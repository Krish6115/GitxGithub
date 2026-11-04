import { describe, expect, it } from 'vitest';
import { emptyState, resolve, type SimState } from './git-sim';
import { run, tokenize, type RunResult } from './git-sim-commands';
import { lostCommits, scenarioById, SCENARIOS } from './practice-scenarios';

const play = (s: SimState, ...lines: string[]) => {
  let state = s;
  let last: RunResult = { state, output: '' };
  for (const l of lines) {
    last = run(state, l);
    state = last.state;
  }
  return last;
};

describe('git simulator', () => {
  it('commits, branches and resolves refs', () => {
    const r = play(emptyState(), 'edit', 'git add .', 'git commit -m "first"', 'edit', 'git add .', 'git commit -m "second"');
    expect(r.state.branches.main).toBe('c2');
    expect(resolve(r.state, 'HEAD~1')).toBe('c1');
    expect(resolve(r.state, 'HEAD^')).toBe('c1');
    expect(resolve(r.state, 'HEAD@{1}')).toBe('c1');
    expect(tokenize('git commit -m "two words"')).toEqual(['git', 'commit', '-m', 'two words']);
  });

  it('refuses to commit with nothing staged and explains why', () => {
    expect(play(emptyState(), 'git commit -m x')).toMatchObject({ error: true });
    expect(play(emptyState(), 'edit', 'git commit -m x').output).toContain('git add');
  });

  it('labels risk: reset --hard loses work, rebase rewrites, revert is safe', () => {
    const base = play(emptyState(), 'edit', 'git add .', 'git commit -m a', 'edit', 'git add .', 'git commit -m b', 'edit').state;
    const hard = run(base, 'git reset --hard HEAD~1');
    expect(hard.risk).toBe('can_lose_work');
    expect(hard.output).toContain('discarded');
    expect(lostCommits(hard.state)).toEqual(['c2']);
    expect(run(base, 'git revert HEAD').risk).toBe('safe');
  });

  it('rejects a non-fast-forward push; --force-with-lease protects unseen work', () => {
    const s = scenarioById('rejected-push')!.setup();
    expect(run(s, 'git push')).toMatchObject({ error: true });
    expect(run(s, 'git push --force-with-lease').output).toContain('stale info');
    expect(run(s, 'git push --force')).toMatchObject({ risk: 'rewrites_history' });
  });

  it('does not simulate unknown commands', () => {
    expect(run(emptyState(), 'git bisect start')).toMatchObject({ error: true });
    expect(run(emptyState(), 'rm -rf /')).toMatchObject({ error: true });
  });
});

describe('practice scenarios can be solved', () => {
  const solutions: Record<string, string[]> = {
    'undo-commit': ['git reset --soft HEAD~1'],
    'recover-reset': ['git reflog', 'git reset --hard c4'],
    'rebase-feature': ['git rebase main'],
    'revert-pushed': ['git revert HEAD', 'git push'],
    'rejected-push': ['git pull --rebase', 'git push'],
    'cherry-pick': ['git switch main', 'git cherry-pick c5'],
    'detached-head': ['git switch -c layout'],
  };
  for (const sc of SCENARIOS.filter((x) => x.id !== 'sandbox')) {
    it(sc.id, () => {
      const start = sc.setup();
      expect(sc.done(start)).toBe(false);
      const r = play(start, ...(solutions[sc.id] ?? []));
      expect(r.error).toBeFalsy();
      expect(sc.done(r.state)).toBe(true);
    });
  }

  it('a wrong fix does not count: reset --hard on a pushed commit is not a revert', () => {
    const sc = scenarioById('revert-pushed')!;
    expect(sc.done(play(sc.setup(), 'git reset --hard HEAD~1', 'git push --force').state)).toBe(false);
  });
});
