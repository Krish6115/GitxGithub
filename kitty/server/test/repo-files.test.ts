import { beforeEach, describe, expect, it } from 'vitest';
import { clearRepoTreeCache, findRepoFiles, focusText, isRepoCodeQuestion, questionTerms, rankPaths, repoOf } from '../src/github/repo-files.js';
import type { ChatRequest, Provider, StreamEvent } from '../src/llm/types.js';
import { tutorMessages } from '../src/tutor/prompt.js';
import { streamTutor, type TutorEvent } from '../src/tutor/service.js';
import { fakeGitHub, fixtureRepo, treeOf } from './fixtures/repo.js';

beforeEach(() => clearRepoTreeCache());

describe('repo code questions', () => {
  it('spots questions about the code, not about Git', () => {
    expect(isRepoCodeQuestion('Where are the routes defined?')).toBe(true);
    expect(isRepoCodeQuestion('which file handles the database?')).toBe(true);
    expect(isRepoCodeQuestion('How do I undo my last commit?')).toBe(false);
    expect(isRepoCodeQuestion('where does git rebase put my commits?')).toBe(false);
  });

  it('reads owner/repo from page URLs and tour names', () => {
    expect(repoOf('https://github.com/acme/todo-api/blob/main/src/db.js')).toEqual({ owner: 'acme', repo: 'todo-api' });
    expect(repoOf('acme/todo-api')).toEqual({ owner: 'acme', repo: 'todo-api' });
    expect(repoOf('https://github.com/orgs/acme/repositories')).toBeNull();
    expect(repoOf(undefined)).toBeNull();
  });

  it('keeps the distinctive words of a question', () => {
    expect(questionTerms('Where are the routes defined in this repo?')).toEqual(['routes']);
    expect(questionTerms('which file handles the database connection?')).toEqual(['handles', 'database', 'connection']);
  });
});

describe('finding repo files', () => {
  const f = fixtureRepo();
  it('ranks files whose path matches the question, code over tests', () => {
    expect(rankPaths(treeOf(f), ['routes'])[0]).toBe('src/routes.js');
    expect(rankPaths(treeOf(f), ['routes']).indexOf('test/routes.test.js')).toBeGreaterThan(0);
    expect(rankPaths(treeOf(f), ['nothing-like-this'])).toEqual([]);
  });

  it('uses code search hits when a token allows it', async () => {
    const gh = fakeGitHub(f);
    const r = await findRepoFiles(gh, 'acme', 'todo-api', 'where is the express app created?', { canSearchCode: true });
    expect(gh.calls.search).toBe(1);
    expect(r?.files.map((x) => x.path)).toContain('src/server.js');
    expect(r?.files[0]?.url).toMatch(/^https:\/\/github\.com\/acme\/todo-api\/blob\/c{40}\//);
  });

  it('skips code search without a token and caches the tree', async () => {
    const gh = fakeGitHub(f);
    await findRepoFiles(gh, 'acme', 'todo-api', 'where are routes defined?', { canSearchCode: false });
    await findRepoFiles(gh, 'acme', 'todo-api', 'where is the db module?', { canSearchCode: false });
    expect(gh.calls.search).toBe(0);
    expect(gh.calls.tree).toBe(1);
  });

  it('shows the part of a long file around the question words', () => {
    const text = `${'x\n'.repeat(3000)}function rateLimit() {}\n${'y\n'.repeat(3000)}`;
    const cut = focusText(text, ['ratelimit'], 400);
    expect(cut).toContain('function rateLimit');
    expect(cut.length).toBeLessThan(450);
  });
});

function scripted(text: string): Provider & { reqs: ChatRequest[] } {
  const reqs: ChatRequest[] = [];
  return {
    name: 'bharatcode', reqs,
    chat: async () => { throw new Error('unused'); },
    async *stream(req): AsyncGenerator<StreamEvent> {
      reqs.push(req);
      yield { type: 'delta', text };
      yield { type: 'done', result: { text, finishReason: 'stop', truncated: false, usage: null, model: 'x' } };
    },
  };
}
const collect = async (it: AsyncIterable<TutorEvent>) => { const out: TutorEvent[] = []; for await (const e of it) out.push(e); return out; };

describe('tutor with repo files', () => {
  const page = { url: 'https://github.com/acme/todo-api', title: 'acme/todo-api', pageType: 'repo', selection: '', text: '', truncated: false };

  it('reads repo files for code questions and puts them in the prompt as untrusted data', async () => {
    const gh = fakeGitHub(fixtureRepo());
    const provider = scripted('The routes live in [src/routes.js](https://github.com/acme/todo-api/blob/x/src/routes.js).');
    const evs = await collect(streamTutor(
      { provider, retrieve: () => [], repoFiles: (o, r, q) => findRepoFiles(gh, o, r, q, { canSearchCode: false }) },
      { question: 'Where are the routes defined?', history: [], page },
    ));
    const files = evs.find((e) => e.type === 'files');
    expect(files).toMatchObject({ type: 'files', repo: 'acme/todo-api' });
    const prompt = provider.reqs[0]?.messages.at(-1)?.content ?? '';
    expect(prompt).toContain('REPO FILES (from acme/todo-api)');
    expect(prompt).toMatch(/<<<UNTRUSTED_REPO_CONTENT \w+ file src\/routes\.js/);
    expect(provider.reqs[0]?.reasoningEffort).toBe('none');
  });

  it('does not look up files for Git questions', async () => {
    let calls = 0;
    await collect(streamTutor(
      { provider: scripted('answer'), retrieve: () => [], repoFiles: async () => (calls++, null) },
      { question: 'How do I undo my last commit?', history: [], page },
    ));
    expect(calls).toBe(0);
  });

  it('answers without files when the lookup fails', async () => {
    const evs = await collect(streamTutor(
      { provider: scripted('answer'), retrieve: () => [], repoFiles: async () => { throw new Error('github down'); } },
      { question: 'Where is the database code?', history: [], page },
    ));
    expect(evs.some((e) => e.type === 'files')).toBe(false);
    expect(evs.at(-1)?.type).toBe('done');
  });

  it('leaves the prompt unchanged without files', () => {
    expect(tutorMessages('q', [], [], false).at(-1)?.content).not.toContain('REPO FILES');
  });
});
