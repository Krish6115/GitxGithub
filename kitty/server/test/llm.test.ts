import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../src/env.js';
import { withRetry } from '../src/lib/retry.js';
import { createBharatCodeProvider } from '../src/llm/BharatCodeProvider.js';
import { KittyError } from '../src/llm/errors.js';
import { selectProvider } from '../src/llm/index.js';
import { createMockProvider } from '../src/llm/mock.js';
import type { ChatRequest } from '../src/llm/types.js';

const req: ChatRequest = { kind: 'explain', messages: [{ role: 'user', content: 'hi' }] };
const enc = new TextEncoder();

/** An SSE response; each item is either a JSON chunk or a delay in ms before the next one. */
function sse(items: (object | number)[]): Response {
  return new Response(
    new ReadableStream({
      async start(c) {
        for (const it of items) {
          if (typeof it === 'number') await new Promise((r) => setTimeout(r, it));
          else c.enqueue(enc.encode(`data: ${JSON.stringify(it)}\n\n`));
        }
        c.enqueue(enc.encode('data: [DONE]\n\n'));
        c.close();
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  );
}
const delta = (content: string, finish: string | null = null) => ({ id: 'x', object: 'chat.completion.chunk', created: 0, model: 'qwen-3.8-27b', choices: [{ index: 0, delta: { content }, finish_reason: finish }] });
const usageChunk = { id: 'x', object: 'chat.completion.chunk', created: 0, model: 'qwen-3.8-27b', choices: [], usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 } };
const errorRes = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function make(fetchImpl: (url: string, init: RequestInit) => Promise<Response>, over: { firstTokenMs?: number; idleMs?: number; totalMsOverride?: number } = {}) {
  const sleep = vi.fn(async () => {});
  const p = createBharatCodeProvider({
    baseUrl: 'https://bc.test/v1',
    model: 'qwen-3.8-27b',
    apiKey: 'sk-test',
    firstTokenMs: over.firstTokenMs ?? 5000,
    idleMs: over.idleMs ?? 5000,
    ...(over.totalMsOverride ? { totalMsOverride: over.totalMsOverride } : {}),
    fetchImpl: fetchImpl as unknown as typeof fetch,
    sleep,
  });
  return { p, sleep };
}

describe('withRetry', () => {
  it('retries retryable errors with 2s/4s/8s backoff, then gives up', async () => {
    const sleep = vi.fn(async () => {});
    const fn = vi.fn(async () => { throw new KittyError('upstream_unavailable', 'busy', { retryable: true }); });
    await expect(withRetry(fn, { sleep })).rejects.toMatchObject({ code: 'upstream_unavailable' });
    expect(fn).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls.map((c) => (c as unknown[])[0])).toEqual([2000, 4000, 8000]);
  });
});

describe('BharatCodeProvider (openai SDK, fake fetch)', () => {
  it('always streams, with per-kind max_tokens and reasoning_effort, and Bearer auth', async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchImpl = vi.fn(async (_u: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      expect(new Headers(init.headers).get('authorization')).toBe('Bearer sk-test');
      return sse([delta('pong', 'stop'), usageChunk]);
    });
    const { p } = make(fetchImpl);
    const r = await p.chat(req);
    await p.chat({ ...req, kind: 'tour' });
    expect(r).toMatchObject({ text: 'pong', truncated: false, usage: { totalTokens: 8 } });
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe('https://bc.test/v1/chat/completions');
    expect(bodies[0]).toMatchObject({ model: 'qwen-3.8-27b', stream: true, max_tokens: 1500, reasoning_effort: 'none' });
    expect(bodies[1]).toMatchObject({ max_tokens: 16000 });
    expect(bodies[1]).not.toHaveProperty('reasoning_effort');
  });

  it('retries 503 with backoff and then streams', async () => {
    let n = 0;
    const { p, sleep } = make(async () => (++n < 3 ? errorRes(503, { error: { message: 'busy' } }) : sse([delta('ok', 'stop')])));
    expect((await p.chat(req)).text).toBe('ok');
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('maps subscription_required, 401 and 429 to typed errors without retrying', async () => {
    for (const [res, code] of [
      [() => errorRes(403, { error: { code: 'subscription_required', message: 'subscribe' } }), 'subscription_required'],
      [() => errorRes(401, { error: { message: 'bad key' } }), 'auth_failed'],
      [() => errorRes(429, { error: { message: 'slow' } }), 'rate_limited'],
    ] as const) {
      const fetchImpl = vi.fn(async () => res());
      await expect(make(fetchImpl).p.chat(req)).rejects.toMatchObject({ code });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
  });

  it('keeps partial text on finish_reason "length"', async () => {
    const { p } = make(async () => sse([delta('{"summary": "half'), delta('', 'length')]));
    expect(await p.chat(req)).toMatchObject({ text: '{"summary": "half', truncated: true });
  });

  it('treats "length" with empty content as reasoning_budget_exhausted', async () => {
    const reasoningOnly = { ...delta(''), choices: [{ index: 0, delta: { reasoning_content: 'thinking...' }, finish_reason: 'length' }] };
    const { p } = make(async () => sse([reasoningOnly]));
    await expect(p.chat(req)).rejects.toMatchObject({ code: 'reasoning_budget_exhausted' });
  });

  it('streams deltas to the caller', async () => {
    const { p } = make(async () => sse([delta('Hel'), delta('lo', 'stop'), usageChunk]));
    const parts: string[] = [];
    for await (const ev of p.stream(req)) if (ev.type === 'delta') parts.push(ev.text);
    expect(parts).toEqual(['Hel', 'lo']);
  });

  it('times out waiting for the first chunk', async () => {
    const hang = (_u: string, init: RequestInit) => new Promise<Response>((_r, rej) => init.signal?.addEventListener('abort', () => rej(init.signal?.reason)));
    await expect(make(hang, { firstTokenMs: 30 }).p.chat(req)).rejects.toMatchObject({ code: 'timeout', message: expect.stringMatching(/queue/) });
  });

  it('times out when the stream goes idle mid-answer', async () => {
    const { p } = make(async () => sse([delta('a'), 200, delta('b', 'stop')]), { idleMs: 40 });
    await expect(p.chat(req)).rejects.toMatchObject({ code: 'timeout', message: expect.stringMatching(/stopped responding/) });
  });

  it('enforces the total cap even while chunks keep arriving', async () => {
    const { p } = make(async () => sse([delta('a'), 20, delta('b'), 20, delta('c'), 20, delta('d'), 20, delta('e', 'stop')]), { idleMs: 1000, totalMsOverride: 50 });
    await expect(p.chat(req)).rejects.toMatchObject({ code: 'timeout', message: expect.stringMatching(/too long/) });
  });
});

describe('mock provider and selection', () => {
  it('is deterministic and builds a tour from the context file list', async () => {
    const m = createMockProvider();
    const tourReq: ChatRequest = { kind: 'tour', messages: [{ role: 'user', content: 'Repository: a/b\n### File: package.json\n### File: src/index.ts' }] };
    const a = await m.chat(tourReq);
    expect(a.text).toBe((await m.chat(tourReq)).text);
    expect(JSON.parse(a.text).steps.map((s: { path: string }) => s.path)).toEqual(['package.json', 'src/index.ts']);
  });

  it('selects providers: BYOK > mock > server key; bharatcode without a key is a setup error', () => {
    const logger = vi.fn();
    expect(selectProvider(loadEnv({}), undefined, { logger }).provider.name).toBe('mock');
    expect(selectProvider(loadEnv({}), 'sk-user', { logger })).toMatchObject({ byok: true, provider: { name: 'bharatcode' } });
    expect(selectProvider(loadEnv({ LLM_PROVIDER: 'bharatcode', BHARATCODE_API_KEY: 'sk' }), undefined, { logger }).provider.name).toBe('bharatcode');
    expect(() => selectProvider(loadEnv({ LLM_PROVIDER: 'bharatcode' }), undefined)).toThrow(KittyError);
  });

  it('logs one usage line per request', async () => {
    const logger = vi.fn();
    await selectProvider(loadEnv({}), undefined, { logger }).provider.chat(req);
    expect(logger).toHaveBeenCalledWith(expect.objectContaining({ kind: 'explain', provider: 'mock', totalTokens: expect.any(Number) }));
  });

  it('blocks real network access in tests', async () => {
    await expect(fetch('https://example.com')).rejects.toThrow(/disabled in tests/);
  });
});

describe('mock provider path parsing', () => {
  it('keeps file paths that contain spaces', async () => {
    const content = 'Repository: a/b\n### File: README.md  (why picked: docs)\n### File: Git/Git_Github Notes.pdf  (why picked: document)';
    const r = await createMockProvider().chat({ kind: 'tour', messages: [{ role: 'user', content }] });
    expect(JSON.parse(r.text).steps.map((s: { path: string }) => s.path)).toEqual(['README.md', 'Git/Git_Github Notes.pdf']);
  });
});
