import { describe, expect, it } from 'vitest';
import { createApp } from '../src/create-app.js';
import { loadEnv } from '../src/env.js';
import type { ChatRequest, Provider, StreamEvent } from '../src/llm/types.js';
import type { RetrievedChunk } from '../src/rag/retrieve.js';
import { isShortQuestion, searchText, trimHistory } from '../src/tutor/history.js';
import { formatSources, tutorMessages } from '../src/tutor/prompt.js';
import { streamTutor, WEAK_SCORE, type TutorEvent } from '../src/tutor/service.js';
import { extractFlags, unverifiedFlags } from '../src/tutor/verify-flags.js';

const chunk = (n: number, text: string, score = 200): RetrievedChunk => ({
  id: `src${n}#0`, text, title: `Title ${n}`, headingPath: [`Section ${n}`], sourceFile: `Git/references/f${n}.md`,
  sourceUrl: `https://example.com/${n}`, license: 'CC BY 4.0', score,
});
const SOURCES = [chunk(1, 'Use `git revert <commit>` to undo a pushed commit. Add --no-edit to skip the editor.'), chunk(2, 'git reset --soft HEAD~1 keeps changes staged.')];

describe('history and search text', () => {
  it('keeps the newest 3 exchanges, trims long turns and starts with a user turn', () => {
    const h = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `m${i}` }) as const);
    const t = trimHistory([...h]);
    expect(t.map((x) => x.content)).toEqual(['m4', 'm5', 'm6', 'm7', 'm8', 'm9']);
    expect(trimHistory([{ role: 'assistant', content: 'hi' }, { role: 'user', content: 'x'.repeat(5000) }])[0]?.content).toHaveLength(2000 + ' […]'.length);
  });

  it('adds the previous question to the search text for follow-ups only', () => {
    const history = [{ role: 'user', content: 'How do I undo a pushed commit?' }, { role: 'assistant', content: '...' }] as const;
    expect(searchText('What about on a remote branch?', [...history])).toContain('undo a pushed commit');
    expect(searchText('How do I set up SSH keys for GitHub on Windows?', [...history])).toBe('How do I set up SSH keys for GitHub on Windows?');
  });

  it('detects short definition questions', () => {
    expect(isShortQuestion('What is a detached HEAD?')).toBe(true);
    expect(isShortQuestion('I pushed a secret key to main yesterday and my team already pulled. What now?')).toBe(false);
  });
});

describe('prompt', () => {
  it('numbers sources to match the UI and adds a note when sources are weak', () => {
    expect(formatSources(SOURCES)).toMatch(/^\[1\] Title 1 > Section 1\n\(source: Git\/references\/f1\.md\)/);
    const msgs = tutorMessages('q?', [{ role: 'user', content: 'earlier' }, { role: 'assistant', content: 'reply' }], SOURCES, true);
    expect(msgs.map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'user']);
    expect(msgs[0]?.content).toMatch(/Never invent commands or flags/);
    expect(msgs[0]?.content).toMatch(/\*\*Situation:\*\*/);
    expect(msgs.at(-1)?.content).toMatch(/NOTE: no closely relevant sources/);
  });
});

describe('flag check', () => {
  const answer = ['Do this [1]:', '```bash', '$ git revert --no-edit abc123   # undo', 'git push --force-with-lease', 'ls -la', 'gh pr checkout 42 -b x', '```', 'Inline `git reset --hard` is not checked.'].join('\n');

  it('extracts flags from git/gh command lines in code blocks only', () => {
    expect(extractFlags(answer)).toEqual(['--no-edit', '--force-with-lease', '-b']);
  });

  it('reports flags that never appear in the sources', () => {
    expect(unverifiedFlags(answer, SOURCES.map((s) => s.text))).toEqual(['--force-with-lease', '-b']);
  });
});

function scripted(text: string): Provider & { reqs: ChatRequest[] } {
  const reqs: ChatRequest[] = [];
  return {
    name: 'bharatcode', reqs,
    chat: async () => { throw new Error('unused'); },
    async *stream(req): AsyncGenerator<StreamEvent> {
      reqs.push(req);
      for (const part of text.match(/.{1,10}/gs) ?? []) yield { type: 'delta', text: part };
      yield { type: 'done', result: { text, finishReason: 'stop', truncated: false, usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }, model: 'x' } };
    },
  };
}
const collect = async (it: AsyncIterable<TutorEvent>) => { const out: TutorEvent[] = []; for await (const e of it) out.push(e); return out; };

describe('streamTutor', () => {
  it('emits sources first, then deltas, then done with unverified flags', async () => {
    const provider = scripted('**Commands:**\n```bash\ngit revert --no-edit HEAD\ngit commit --auto-squash-all\n```');
    const evs = await collect(streamTutor({ provider, retrieve: () => SOURCES }, { question: 'How do I undo a pushed commit safely on main?', history: [] }));
    expect(evs[0]).toMatchObject({ type: 'sources', weak: false, sources: [{ n: 1, sourceUrl: 'https://example.com/1' }, { n: 2 }] });
    expect(evs.filter((e) => e.type === 'delta').map((e) => (e as { text: string }).text).join('')).toContain('git revert');
    expect(evs.at(-1)).toEqual({ type: 'done', usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }, truncated: false, unverifiedFlags: ['--auto-squash-all'] });
    expect(provider.reqs[0]).toMatchObject({ kind: 'tutor' });
    expect(provider.reqs[0]).not.toHaveProperty('reasoningEffort');
  });

  it('flags weak retrieval and uses no reasoning for short definition questions', async () => {
    const provider = scripted("I'm not sure.");
    const evs = await collect(streamTutor({ provider, retrieve: () => [chunk(1, 'unrelated', WEAK_SCORE - 1)] }, { question: 'What is sourdough?', history: [] }));
    expect(evs[0]).toMatchObject({ type: 'sources', weak: true });
    expect(provider.reqs[0]?.reasoningEffort).toBe('none');
    expect(provider.reqs[0]?.messages.at(-1)?.content).toMatch(/NOTE: no closely relevant sources/);
  });
});

async function sse(res: Response) {
  return (await res.text()).split('\n\n').flatMap((b) => {
    const event = /^event: (.*)$/m.exec(b)?.[1];
    const data = b.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6)).join('');
    return event && event !== 'ping' ? [{ event, data: JSON.parse(data) as Record<string, unknown> }] : [];
  });
}
const ask = (app: ReturnType<typeof createApp>, body: unknown, headers: Record<string, string> = {}) =>
  app.request('/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

describe('POST /tutor', () => {
  it('streams sources, deltas and done using the real index and the mock model', async () => {
    const app = createApp(loadEnv({}), { logger: () => {} });
    const evs = await sse(await ask(app, { question: 'How do I undo a commit that I already pushed?' }));
    expect(evs[0]?.event).toBe('sources');
    expect((evs[0]?.data.sources as unknown[]).length).toBeGreaterThan(0);
    expect(evs.some((e) => e.event === 'delta')).toBe(true);
    expect(evs.at(-1)).toMatchObject({ event: 'done', data: { truncated: false, unverifiedFlags: [] } });
  });

  it('rejects empty or oversized questions', async () => {
    const app = createApp(loadEnv({}), { logger: () => {} });
    expect((await ask(app, { question: '' })).status).toBe(400);
    expect((await ask(app, { question: 'x'.repeat(2001) })).status).toBe(400);
  });

  it('shares one per-IP rate limit between /tour and /tutor', async () => {
    const app = createApp(loadEnv({ RATE_LIMIT_PER_MIN: '1' }), { logger: () => {}, retrieve: () => SOURCES });
    const ip = { 'x-forwarded-for': '198.51.100.9' };
    expect((await ask(app, { question: 'How do I revert?' }, ip)).status).toBe(200);
    const tour = await app.request('/tour', { method: 'POST', headers: { 'Content-Type': 'application/json', ...ip }, body: JSON.stringify({ owner: 'a', repo: 'b' }) });
    expect(tour.status).toBe(429);
  });
});

describe('streamTutor retries', () => {
  const failingThen = (failures: number, failAfterDelta = false): Provider => {
    let n = 0;
    return {
      name: 'bharatcode',
      chat: async () => { throw new Error('unused'); },
      async *stream(): AsyncGenerator<StreamEvent> {
        const { KittyError } = await import('../src/llm/errors.js');
        if (n++ < failures) {
          if (failAfterDelta) yield { type: 'delta', text: 'partial ' };
          throw new KittyError('timeout', 'stalled');
        }
        yield { type: 'delta', text: 'answer' };
        yield { type: 'done', result: { text: 'answer', finishReason: 'stop', truncated: false, usage: null, model: 'x' } };
      },
    };
  };

  it('retries once when the stream fails before any text', async () => {
    const evs = await collect(streamTutor({ provider: failingThen(1), retrieve: () => SOURCES }, { question: 'How do I revert?', history: [] }));
    expect(evs.at(-1)).toMatchObject({ type: 'done' });
  });

  it('does not retry after text was shown, or more than once', async () => {
    await expect(collect(streamTutor({ provider: failingThen(1, true), retrieve: () => SOURCES }, { question: 'How do I revert?', history: [] }))).rejects.toMatchObject({ code: 'timeout' });
    await expect(collect(streamTutor({ provider: failingThen(2), retrieve: () => SOURCES }, { question: 'How do I revert?', history: [] }))).rejects.toMatchObject({ code: 'timeout' });
  });
});

describe('guide and copilot actions', () => {
  it('accepts known guides and Copilot hand-offs, rejects unknown guides', async () => {
    const { parseAction } = await import('../src/tutor/actions.js');
    expect(parseAction('Sure.\nACTION: {"type":"guide","repo":"a/b","guide":"open-pr"}')).toMatchObject({ type: 'guide', guide: 'open-pr' });
    expect(parseAction('ACTION: {"type":"guide","repo":"a/b","guide":"hack-the-planet"}')).toBeNull();
    expect(parseAction('Copilot is better for this.\nACTION: {"type":"copilot","prompt":"Write tests for src/db.js"}')).toMatchObject({ type: 'copilot' });
  });
});
