import { describe, expect, it } from 'vitest';
import { createApp } from '../src/create-app.js';
import { loadEnv } from '../src/env.js';
import type { Issue, Pull, PullCommit, PullFile } from '../src/github/client.js';
import { rankBeginnerIssues } from '../src/github/issues.js';
import { preflightChecks } from '../src/github/preflight.js';
import { boostForIssue, issueHints, rankFiles } from '../src/github/rank.js';
import { LruCache } from '../src/lib/lru.js';
import { createMockProvider } from '../src/llm/mock.js';
import type { ChatRequest, Provider } from '../src/llm/types.js';
import { tourSystemPrompt } from '../src/tour/prompt.js';
import type { TourResult } from '../src/tour/schema.js';
import { getTour } from '../src/tour/service.js';
import { fakeGitHub, fixtureRepo, treeOf } from './fixtures/repo.js';

const NOW = Date.parse('2026-11-01T00:00:00Z');
const issue = (over: Partial<Issue> & { number: number }): Issue => ({
  title: `Issue ${over.number}`,
  body: '',
  html_url: `https://github.com/acme/todo-api/issues/${over.number}`,
  state: 'open',
  comments: 1,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-20T00:00:00Z',
  labels: [],
  assignees: [],
  ...over,
});

describe('good first issues', () => {
  it('ranks labelled, quiet, recent issues first and drops PRs, assigned and avoid-labelled ones', () => {
    const r = rankBeginnerIssues(
      [
        issue({ number: 1, labels: ['bug'] }),
        issue({ number: 2, labels: ['good first issue'], comments: 0 }),
        issue({ number: 3, labels: ['help wanted'], comments: 25 }),
        issue({ number: 4, labels: ['good first issue'], assignees: [{ login: 'someone' }] }),
        issue({ number: 5, labels: ['good first issue'], pull_request: {} }),
        issue({ number: 6, labels: ['good first issue', 'needs discussion'] }),
        issue({ number: 7, labels: ['Good First Issue', 'documentation'], updated_at: '2024-01-01T00:00:00Z' }),
        issue({ number: 8, labels: ['good first issue', 'triage'] }),
      ],
      NOW,
    );
    expect(r.labeled).toBe(true);
    expect(r.issues.map((i) => i.number)).toEqual([2, 7, 3]);
    expect(r.issues[0]?.reasons).toContain('nobody has replied yet');
  });

  it('falls back to the quietest recent issues when nothing is labelled for beginners', () => {
    const r = rankBeginnerIssues([issue({ number: 1, comments: 30 }), issue({ number: 2, comments: 0 })], NOW);
    expect(r.labeled).toBe(false);
    expect(r.issues[0]?.number).toBe(2);
  });
});

describe('issue-aware file ranking', () => {
  const f = fixtureRepo();
  it('pulls files the issue talks about up the ranking', () => {
    const hints = issueHints('Routes return 500 when the database is empty', 'In `src/db.js` the Map is never seeded, so routes crash.');
    expect(hints.keywords.has('routes')).toBe(true);
    const plain = rankFiles(treeOf(f), 25).map((x) => x.path);
    const ranked = rankFiles(treeOf(f), 25, hints);
    expect(ranked[0]?.path).toBe('src/db.js'); // named in the issue
    expect(ranked.map((x) => x.path).indexOf('src/routes.js')).toBeLessThan(plain.indexOf('src/routes.js') + 1);
    expect(boostForIssue({ path: 'src/db.js', score: 1, reasons: ['code'] }, hints).reasons).toContain('named in the issue');
  });

  it('asks the model for an issue walkthrough, not a general tour', () => {
    const p = tourSystemPrompt('n0nce', 7, 3, 'issue');
    expect(p).toContain('fix one GitHub issue');
    expect(p).toContain('Do not write git commands');
  });

  it('builds an issue walkthrough with the issue in the context and in meta', async () => {
    const fx = fixtureRepo({ issues: [issue({ number: 42, title: 'Routes crash when db is empty', body: 'See src/db.js', labels: ['good first issue'] })] });
    const seen: string[] = [];
    const mock = createMockProvider();
    const provider: Provider = {
      name: 'mock',
      chat: (req: ChatRequest) => mock.chat(req),
      stream: (req: ChatRequest) => {
        seen.push(req.messages.map((m) => m.content).join('\n'));
        return mock.stream(req);
      },
    };
    const r = await getTour({ github: fakeGitHub(fx), provider, cache: new LruCache<TourResult>(10, 60_000), maxSteps: 10 }, { owner: 'acme', repo: 'todo-api', issue: 42 });
    expect(r.meta.issue).toMatchObject({ number: 42, title: 'Routes crash when db is empty' });
    expect(r.meta.defaultBranch).toBe('main');
    expect(seen[0]).toContain('## The issue to fix (#42)');
    expect(seen[0]).toContain('fix one GitHub issue');
    expect(r.tour.steps.length).toBeLessThanOrEqual(7);
  });

  it('refuses a pull request number', async () => {
    const fx = fixtureRepo({ issues: [issue({ number: 7, pull_request: {} })] });
    await expect(getTour({ github: fakeGitHub(fx), provider: createMockProvider(), cache: new LruCache<TourResult>(10, 60_000), maxSteps: 10 }, { owner: 'acme', repo: 'todo-api', issue: 7 })).rejects.toThrow(/pull request/);
  });
});

const pull = (over: Partial<Pull> = {}): Pull => ({
  number: 9,
  title: 'Handle an empty database in routes',
  body: 'Routes crashed when the db was empty. Now they return []. Fixes #42.\n\nTested with the new unit test.',
  html_url: 'https://github.com/acme/todo-api/pull/9',
  state: 'open',
  merged: false,
  draft: false,
  mergeable_state: 'clean',
  additions: 20,
  deletions: 3,
  changed_files: 2,
  commits: 1,
  maintainer_can_modify: true,
  user: { login: 'newbie' },
  head: { ref: 'fix/42-empty-db', repo: { full_name: 'newbie/todo-api' } },
  base: { ref: 'main', repo: { full_name: 'acme/todo-api' } },
  ...over,
});
const files = (...names: string[]): PullFile[] => names.map((filename) => ({ filename, status: 'modified', additions: 5, deletions: 1 }));
const commit = (message: string, parents = 1): PullCommit => ({ sha: 'a'.repeat(40), commit: { message }, parents: Array.from({ length: parents }, () => ({ sha: 'b'.repeat(40) })) });
const run = (over: Partial<Parameters<typeof preflightChecks>[0]> = {}) =>
  preflightChecks({ owner: 'acme', repo: 'todo-api', pull: pull(), files: files('src/routes.js', 'test/routes.test.js'), commits: [commit('fix: handle empty db')], contributing: null, template: null, ...over });
const byId = (r: ReturnType<typeof run>, id: string) => r.checks.find((c) => c.id === id);

describe('PR pre-flight check', () => {
  it('passes a tidy PR', () => {
    const r = run();
    expect(r.counts.fail).toBe(0);
    expect(r.counts.warn).toBe(0);
    expect(byId(r, 'issue')?.status).toBe('pass');
    expect(byId(r, 'tests')?.status).toBe('pass');
  });

  it('flags conflicts with rebase commands against upstream for a fork', () => {
    const c = byId(run({ pull: pull({ mergeable_state: 'dirty' }) }), 'conflicts');
    expect(c?.status).toBe('fail');
    expect(c?.commands).toEqual(['git fetch upstream', 'git rebase upstream/main', '# fix each conflicted file, then:', 'git add <file>', 'git rebase --continue', 'git push --force-with-lease']);
  });

  it('uses origin when the branch is in the same repo', () => {
    const c = byId(run({ pull: pull({ mergeable_state: 'behind', head: { ref: 'x', repo: { full_name: 'acme/todo-api' } } }) }), 'up-to-date');
    expect(c?.commands?.[0]).toBe('git fetch origin');
  });

  it('warns about an empty description, no linked issue, no tests and a generic title', () => {
    const r = run({ pull: pull({ body: '', title: 'Update routes.js' }), files: files('src/routes.js') });
    expect(byId(r, 'description')?.status).toBe('fail');
    expect(byId(r, 'issue')?.status).toBe('warn');
    expect(byId(r, 'tests')?.status).toBe('warn');
    expect(byId(r, 'title')?.status).toBe('warn');
    expect(r.checks[0]?.status).toBe('fail'); // failures first
  });

  it('checks the PR template, merge and WIP commits, Conventional Commits and DCO when CONTRIBUTING asks', () => {
    const template = '## Description\n\n## How was this tested?\n\n- [ ] Tests added';
    const r = run({
      pull: pull({ body: 'Routes crashed when the db was empty. Fixes #42 and adds a regression test for it.' }),
      template,
      contributing: 'We use Conventional Commits. Sign your commits with git commit -s (DCO).',
      commits: [commit('Merge branch main into fix', 2), commit('wip'), commit('fix: handle empty db\n\nSigned-off-by: N <n@x.dev>')],
    });
    expect(byId(r, 'template')?.status).toBe('warn');
    expect(byId(r, 'merge-commits')?.status).toBe('warn');
    expect(byId(r, 'wip-commits')?.commands).toContain('git rebase -i --autosquash upstream/main');
    expect(byId(r, 'commit-format')?.status).toBe('warn');
    expect(byId(r, 'signoff')?.status).toBe('fail');
    expect(byId(r, 'signoff')?.commands).toContain('git rebase --signoff upstream/main');
  });
});

describe('contributor routes', () => {
  it('POST /issues returns ranked beginner issues', async () => {
    const fx = fixtureRepo();
    const issues = [issue({ number: 3, labels: ['good first issue'] })];
    const fetchImpl = (async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith(`https://api.github.com/repos/${fx.owner}/${fx.repo}/issues?`)) {
        // the beginner label query finds an older issue the "recent" list missed
        return new Response(JSON.stringify(url.includes('labels=good%20first%20issue') ? [...issues, issue({ number: 11, labels: ['good first issue'], comments: 0 })] : issues));
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;
    const app = createApp(loadEnv({}), { githubFetch: fetchImpl });
    const res = await app.request('/issues', { method: 'POST', body: JSON.stringify({ owner: fx.owner, repo: fx.repo }), headers: { 'content-type': 'application/json' } });
    expect(res.status).toBe(200);
    const numbers = ((await res.json()) as { issues: { number: number }[] }).issues.map((i) => i.number);
    expect([...numbers].sort((a, b) => a - b)).toEqual([3, 11]); // merged and de-duplicated
  });

  it('POST /preflight validates its input', async () => {
    const app = createApp(loadEnv({}));
    const res = await app.request('/preflight', { method: 'POST', body: JSON.stringify({ owner: 'acme', repo: 'x' }), headers: { 'content-type': 'application/json' } });
    expect(res.status).toBe(400);
  });
});
