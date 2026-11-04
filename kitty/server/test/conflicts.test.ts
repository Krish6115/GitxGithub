import { describe, expect, it } from 'vitest';
import type { Pull } from '../src/github/client.js';
import { likelyConflicts, rescueSteps } from '../src/github/conflicts.js';
import { runPreflight } from '../src/github/preflight.js';
import { fakeGitHub, fixtureRepo } from './fixtures/repo.js';

const HEAD = 'h'.repeat(40);
const pull = (over: Partial<Pull> = {}): Pull => ({
  number: 9, title: 'fix: handle empty db', body: 'Fixes #42. Seeds the Map so routes stop crashing; tested with npm test.',
  html_url: 'https://github.com/acme/todo-api/pull/9', state: 'open', merged: false, draft: false, mergeable_state: 'dirty',
  additions: 20, deletions: 3, changed_files: 2, commits: 1, maintainer_can_modify: true, user: { login: 'newbie' },
  head: { ref: 'fix/42-empty-db', sha: HEAD, repo: { full_name: 'newbie/todo-api' } },
  base: { ref: 'main', sha: '', repo: { full_name: 'acme/todo-api' } },
  ...over,
});
const compare = {
  [`main...${HEAD}`]: { merge_base_commit: { sha: 'm'.repeat(40) }, files: [{ filename: 'src/db.js' }, { filename: 'src/routes.js' }, { filename: 'test/db.test.js' }] },
  [`${'m'.repeat(40)}...main`]: { merge_base_commit: { sha: 'm'.repeat(40) }, files: [{ filename: 'src/db.js' }, { filename: 'README.md' }] },
};

describe('merge-conflict rescue', () => {
  it('uses the real branch names, and upstream for forks', () => {
    const r = rescueSteps(pull(), true, 'acme/todo-api');
    const all = r.steps.flatMap((s) => s.commands).join('\n');
    expect(all).toContain('git switch fix/42-empty-db');
    expect(all).toContain('git fetch upstream');
    expect(all).toContain('git rebase upstream/main');
    expect(all).toContain('# only once: git remote add upstream https://github.com/acme/todo-api.git');
    expect(all).toContain('git push --force-with-lease');
    expect(r.undo.commands).toContain('git rebase --abort');
    expect(r.undo.commands).toContain('git reset --hard fix/42-empty-db@{1}');
  });

  it('uses origin when the branch is in the same repo', () => {
    const all = rescueSteps(pull({ head: { ref: 'feature', sha: HEAD, repo: { full_name: 'acme/todo-api' } } }), false, 'acme/todo-api').steps.flatMap((s) => s.commands);
    expect(all).toContain('git rebase origin/main');
    expect(all.some((c) => c.includes('remote add'))).toBe(false);
  });

  it('lists files changed on both sides since the branches split', async () => {
    const gh = fakeGitHub(fixtureRepo({ compare }));
    expect(await likelyConflicts(gh, 'acme', 'todo-api', pull())).toEqual(['src/db.js']);
    expect(await likelyConflicts(fakeGitHub(fixtureRepo()), 'acme', 'todo-api', pull())).toEqual([]); // GitHub can't tell
  });

  it('is attached to the pre-flight result only for conflicting open PRs', async () => {
    const files = [{ filename: 'src/db.js', status: 'modified', additions: 3, deletions: 1 }];
    const dirty = await runPreflight(fakeGitHub(fixtureRepo({ compare, pull: { pull: pull(), files, commits: [] } })), 'acme', 'todo-api', 9);
    expect(dirty.conflict?.likelyFiles).toEqual(['src/db.js']);
    expect(dirty.checks.find((c) => c.id === 'conflicts')?.detail).toContain('rescue below');
    const clean = await runPreflight(fakeGitHub(fixtureRepo({ pull: { pull: pull({ mergeable_state: 'clean' }), files, commits: [] } })), 'acme', 'todo-api', 9);
    expect(clean.conflict).toBeUndefined();
  });
});
