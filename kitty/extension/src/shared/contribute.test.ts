import { describe, expect, it } from 'vitest';
import { contributionPlan, slug } from './contribute';
import { issueNumberFromUrl, pullNumberFromUrl } from './github-page';

describe('contribution plan', () => {
  const base = { owner: 'cli', repo: 'cli', defaultBranch: 'trunk', issue: { number: 1234, title: 'Login fails when "config" has $HOME`s path!' } };

  it('names the branch after the issue', () => {
    expect(slug('Crash when config is empty!')).toBe('crash-when-config-is-empty');
    expect(slug('!!!')).toBe('change');
    expect(slug('a'.repeat(80)).length).toBe(40);
    expect(contributionPlan(base).branch).toBe('fix/1234-login-fails-when-config-has-home-s-path');
  });

  it('forks, adds upstream and branches from upstream for a contributor', () => {
    const p = contributionPlan({ ...base, login: 'newbie' });
    const lines = p.commands.split('\n');
    expect(lines).toContain('git clone https://github.com/newbie/cli.git');
    expect(lines).toContain('git remote add upstream https://github.com/cli/cli.git');
    expect(lines).toContain(`git switch -c ${p.branch} upstream/trunk`);
    expect(lines).toContain(`git push -u origin ${p.branch}`);
    // quotes, $ and backticks are stripped so the command is safe to paste
    expect(lines).toContain('git commit -m "Login fails when config has HOMEs path!" -m "Fixes #1234"');
    expect(p.prUrl).toBe(`https://github.com/cli/cli/compare/trunk...newbie:${p.branch}?expand=1`);
    expect(p.ownRepo).toBe(false);
  });

  it('skips the fork for the repo owner and uses a placeholder when signed out', () => {
    const own = contributionPlan({ ...base, login: 'CLI' });
    expect(own.ownRepo).toBe(true);
    expect(own.commands).not.toContain('upstream');
    expect(own.commands).toContain('origin/trunk');
    expect(contributionPlan(base).commands).toContain('https://github.com/YOUR-USERNAME/cli.git');
  });
});

describe('issue and PR numbers from URLs', () => {
  it('reads them only from issue / pull pages of a repo', () => {
    expect(issueNumberFromUrl('https://github.com/cli/cli/issues/42')).toBe(42);
    expect(issueNumberFromUrl('https://github.com/cli/cli/issues')).toBeNull();
    expect(issueNumberFromUrl('https://github.com/cli/cli/pull/42')).toBeNull();
    expect(pullNumberFromUrl('https://github.com/cli/cli/pull/7/files')).toBe(7);
    expect(pullNumberFromUrl('https://github.com/issues/7')).toBeNull();
  });
});

describe('commit message', () => {
  it('cuts long issue titles at a word boundary', () => {
    const p = contributionPlan({ owner: 'h', repo: 'h', defaultBranch: 'main', issue: { number: 1, title: 'ETag middleware does not cancel the response body stream when returning 304 Not Modified' } });
    expect(p.commands).toContain('git commit -m "ETag middleware does not cancel the response body stream when returning" -m "Fixes #1"');
  });
});
