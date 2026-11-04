import { describe, expect, it } from 'vitest';
import { annotationText, extractFailure, failedJob, stepLines, cleanLog } from '../src/ci/extract.js';
import { streamCiExplain } from '../src/ci/service.js';
import { createApp } from '../src/create-app.js';
import { loadEnv } from '../src/env.js';
import type { WorkflowJob, WorkflowRun } from '../src/github/client.js';
import { fakeGitHub, fixtureRepo } from './fixtures/repo.js';
import { collect, scripted } from './fixtures/provider.js';

const ts = (s: string): string => s.split('\n').map((l) => `2026-11-01T10:00:00.1234567Z ${l}`).join('\n');

const NPM_LOG = ts([
  '##[group]Run actions/checkout@v4',
  'Syncing repository: acme/todo-api',
  '##[endgroup]',
  '##[group]Run npm test',
  '> todo-api@1.0.0 test',
  '> vitest run',
  ' FAIL  test/routes.test.js > lists todos',
  'AssertionError: expected [] to deeply equal [ { id: 1 } ]',
  ' ❯ test/routes.test.js:4:20',
  ' Test Files  1 failed (1)',
  '##[error]Process completed with exit code 1.',
].join('\n'));

describe('CI log extraction', () => {
  it('strips timestamps and colour codes', () => {
    expect(cleanLog('2026-11-01T10:00:00.1Z \u001b[31mred\u001b[0m')).toEqual(['red']);
  });

  it('finds the test failure, not the exit-code line', () => {
    const f = extractFailure(NPM_LOG, 'npm test');
    expect(f.confidence).toBe('strong');
    expect(f.headline).toContain('FAIL  test/routes.test.js');
    expect(f.excerpt).toContain('AssertionError');
    expect(f.excerpt).not.toContain('Syncing repository');
  });

  it('keeps only the failed step when it can find it', () => {
    expect(stepLines(cleanLog(NPM_LOG), 'Run npm test')[0]).toBe('##[group]Run npm test');
    expect(stepLines(cleanLog(NPM_LOG), 'not a step')).toHaveLength(cleanLog(NPM_LOG).length);
  });

  it('recognises TypeScript, Python and Go failures', () => {
    expect(extractFailure(ts("src/a.ts(3,1): error TS2304: Cannot find name 'x'.")).headline).toContain('TS2304');
    expect(extractFailure(ts('collected 3 items\nTraceback (most recent call last):\n  File "a.py"')).confidence).toBe('strong');
    expect(extractFailure(ts('=== RUN TestAdd\n--- FAIL: TestAdd (0.00s)')).headline).toBe('--- FAIL: TestAdd (0.00s)');
  });

  it('falls back to the exit code, then to the tail', () => {
    expect(extractFailure(ts('building\n##[error]Process completed with exit code 2.')).confidence).toBe('weak');
    const tail = extractFailure(ts('step one\nstep two\nall quiet'));
    expect(tail.confidence).toBe('tail');
    expect(tail.excerpt).toContain('all quiet');
  });
});

const job = (over: Partial<WorkflowJob> & { id: number }): WorkflowJob => ({ name: `job ${over.id}`, conclusion: 'success', html_url: `https://github.com/acme/todo-api/actions/runs/7/job/${over.id}`, steps: [], ...over });
const run: WorkflowRun = { id: 7, name: 'CI', display_title: 'fix: routes', status: 'completed', conclusion: 'failure', head_branch: 'fix/1-routes', event: 'pull_request', html_url: 'https://github.com/acme/todo-api/actions/runs/7', path: '.github/workflows/ci.yml' };

describe('failed job', () => {
  it('picks the first failed job and its failed step (or the one asked for)', () => {
    const jobs = [job({ id: 1 }), job({ id: 2, conclusion: 'failure', steps: [{ name: 'Set up', number: 1, conclusion: 'success' }, { name: 'Run npm test', number: 2, conclusion: 'failure' }] }), job({ id: 3, conclusion: 'failure' })];
    expect(failedJob(jobs)).toMatchObject({ job: { id: 2 }, step: 'Run npm test' });
    expect(failedJob(jobs, 3)?.job.id).toBe(3);
    expect(failedJob([job({ id: 1 })])).toBeNull();
  });

  it('puts real annotations before generic exit-code ones', () => {
    const text = annotationText([
      { path: '.github', start_line: null, annotation_level: 'failure', message: 'Process completed with exit code 1.', title: null },
      { path: 'src/a.ts', start_line: 3, annotation_level: 'failure', message: "Cannot find name 'x'.", title: 'TS2304' },
    ]);
    expect(text.split('\n')[0]).toBe("FAILURE src/a.ts:3: TS2304: Cannot find name 'x'.");
  });
});

describe('streamCiExplain', () => {
  const jobs = [job({ id: 2, name: 'test', conclusion: 'failure', steps: [{ name: 'Run npm test', number: 2, conclusion: 'failure' }] })];

  it('sends the failing part of the log to the model as untrusted data', async () => {
    const gh = fakeGitHub(fixtureRepo({ ci: { run, jobs, log: NPM_LOG, annotations: [] } }));
    const provider = scripted('**What failed:** the routes test.');
    const evs = await collect(streamCiExplain({ github: gh, provider }, { owner: 'acme', repo: 'todo-api', run: 7 }));
    expect(evs[0]).toMatchObject({ type: 'meta', kind: 'ci', title: 'test › Run npm test', from: 'log' });
    const prompt = provider.reqs[0]?.messages.at(-1)?.content ?? '';
    expect(prompt).toMatch(/<<<UNTRUSTED_REPO_CONTENT \w+ ci-log>>>/);
    expect(prompt).toContain('AssertionError');
    expect(provider.reqs[0]?.reasoningEffort).toBe('none');
    expect(evs.at(-1)?.type).toBe('done');
  });

  it('uses annotations when the log is not available (no token)', async () => {
    const gh = fakeGitHub(fixtureRepo({ ci: { run, jobs, log: null, annotations: [{ path: 'src/a.ts', start_line: 3, annotation_level: 'failure', message: 'boom', title: null }] } }));
    const provider = scripted('ok');
    const evs = await collect(streamCiExplain({ github: gh, provider }, { owner: 'acme', repo: 'todo-api', run: 7 }));
    expect(evs[0]).toMatchObject({ type: 'meta', from: 'annotations' });
    expect(provider.reqs[0]?.messages.at(-1)?.content).toContain('FAILURE src/a.ts:3: boom');
  });

  it('says so when nothing failed', async () => {
    const gh = fakeGitHub(fixtureRepo({ ci: { run: { ...run, conclusion: 'success' }, jobs: [job({ id: 1 })], log: null, annotations: [] } }));
    await expect(collect(streamCiExplain({ github: gh, provider: scripted('x') }, { owner: 'acme', repo: 'todo-api', run: 7 }))).rejects.toThrow('This run passed');
  });

  it('rejects bad requests at the route', async () => {
    const app = createApp(loadEnv({ LLM_PROVIDER: 'mock' }));
    const res = await app.request('/ci-explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner: 'acme', repo: 'x', run: 'seven' }) });
    expect(res.status).toBe(400);
  });
});

describe('CI without a log', () => {
  const jobs = [job({ id: 2, name: 'Main', conclusion: 'failure', steps: [{ name: 'Run pnpm run check', number: 5, conclusion: 'failure' }] })];
  const exitOnly = [
    { path: '.github', start_line: null, annotation_level: 'failure', message: 'Process completed with exit code 1.', title: null },
    { path: '.github', start_line: null, annotation_level: 'notice', message: 'The ubuntu-latest label will migrate.', title: null },
  ];

  it('drops runner notices from the annotations', () => {
    expect(annotationText(exitOnly)).toBe('FAILURE: Process completed with exit code 1.');
  });

  it('answers without the model when GitHub only reports an exit code', async () => {
    const provider = scripted('should not be called');
    const evs = await collect(streamCiExplain({ github: fakeGitHub(fixtureRepo({ ci: { run, jobs, log: null, annotations: exitOnly } })), provider }, { owner: 'acme', repo: 'todo-api', run: 7 }));
    expect(provider.reqs).toHaveLength(0);
    expect(evs[0]).toMatchObject({ type: 'meta', title: 'Main › Run pnpm run check', from: 'annotations' });
    expect((evs[1] as { text: string }).text).toContain('Add a GitHub token in Kitty settings');
    expect(evs.at(-1)).toMatchObject({ type: 'done', usage: null });
  });
});
