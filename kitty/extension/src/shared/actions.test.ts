import { describe, expect, it } from 'vitest';
import { actionLabel, actionUrl, pendingFor, stripAction } from './actions';

describe('chat actions', () => {
  it('maps actions to GitHub pages', () => {
    expect(actionUrl({ type: 'tour', repo: 'honojs/hono' })).toBe('https://github.com/honojs/hono');
    expect(actionUrl({ type: 'explain_issue', repo: 'cli/cli', number: 9 })).toBe('https://github.com/cli/cli/issues/9');
    expect(actionUrl({ type: 'check_pr', repo: 'cli/cli', number: 7 })).toBe('https://github.com/cli/cli/pull/7');
    expect(actionLabel({ type: 'find_issues', query: 'docker' })).toBe('Searching for "docker" issues');
  });

  it('runs a pending action only on its page and only while fresh', () => {
    const p = { action: { type: 'fix_issue' as const, repo: 'cli/cli', number: 9 }, url: 'https://github.com/cli/cli/issues/9', at: 1000 };
    expect(pendingFor(p, 'https://github.com/cli/cli/issues/9/', 2000)).toEqual(p.action);
    expect(pendingFor(p, 'https://github.com/cli/cli/issues/10', 2000)).toBeNull();
    expect(pendingFor(p, 'https://github.com/cli/cli/issues/9', 1000 + 91_000)).toBeNull();
  });

  it('hides the ACTION line from the answer', () => {
    expect(stripAction('Looking now.\nACTION: {"type":"tour","repo":"a/b"}')).toBe('Looking now.');
  });
});
