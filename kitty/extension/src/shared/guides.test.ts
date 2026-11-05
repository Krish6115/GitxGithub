import { describe, expect, it } from 'vitest';
import { actionUrl, wantsToGo } from './actions';
import { copilotPrompt, isCopilotPage } from './copilot';
import { GUIDES, guidePageOf, guidePageUrl, guidesFor } from './guides';

describe('show-me-how guides', () => {
  it('knows which GitHub page a URL is', () => {
    expect(guidePageOf('https://github.com/honojs/hono', 'honojs/hono')).toBe('repo');
    expect(guidePageOf('https://github.com/honojs/hono/tree/main', 'honojs/hono')).toBe('repo');
    expect(guidePageOf('https://github.com/honojs/hono/pulls?q=is%3Aopen', 'honojs/hono')).toBe('pulls');
    expect(guidePageOf('https://github.com/honojs/hono/compare/main...dev', 'honojs/hono')).toBe('compare');
    expect(guidePageOf('https://github.com/honojs/hono/pull/12/files', 'honojs/hono')).toBe('pr-files');
    expect(guidePageOf('https://github.com/honojs/hono/pull/12', 'honojs/hono')).toBe('pr');
    expect(guidePageOf('https://github.com/other/repo', 'honojs/hono')).toBeNull();
  });

  it('builds the page URL for each step', () => {
    expect(guidePageUrl('pulls', 'a/b')).toBe('https://github.com/a/b/pulls');
    expect(guidePageUrl('pr-files', 'a/b', 7)).toBe('https://github.com/a/b/pull/7/files');
  });

  it('every step can be found by selector or text, and PR guides only show on PRs', () => {
    for (const g of GUIDES) for (const s of g.steps) expect(Boolean(s.selectors?.length || s.text)).toBe(true);
    expect(guidesFor(false).some((g) => g.needsPr)).toBe(false);
    expect(guidesFor(true).map((g) => g.id)).toContain('review-pr');
  });

  it('guide actions open the repo (or the PR)', () => {
    expect(actionUrl({ type: 'guide', repo: 'a/b', guide: 'open-pr' })).toBe('https://github.com/a/b');
    expect(actionUrl({ type: 'guide', repo: 'a/b', guide: 'review-pr', number: 3 })).toBe('https://github.com/a/b/pull/3');
  });
});

describe('taking the user straight there', () => {
  it('spots "take me there" requests', () => {
    expect(wantsToGo('find me a docker issue and take me there')).toBe(true);
    expect(wantsToGo('open one about CSS')).toBe(true);
    expect(wantsToGo('find me a good first issue about docker')).toBe(false);
  });
});

describe('Copilot hand-off', () => {
  it('recognises the Copilot page and builds a prompt with context', () => {
    expect(isCopilotPage('https://github.com/copilot')).toBe(true);
    expect(isCopilotPage('https://github.com/copilot/c/123')).toBe(true);
    expect(isCopilotPage('https://github.com/copilotkit/repo')).toBe(false);
    const p = copilotPrompt('Write a test for the rate limiter', { repo: 'Krish6115/GitKitty', file: 'kitty/server/src/lib/rate-limit.ts' });
    expect(p).toBe('Repository: Krish6115/GitKitty\nFile: kitty/server/src/lib/rate-limit.ts\n\nWrite a test for the rate limiter');
  });
});
