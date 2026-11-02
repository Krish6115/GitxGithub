import { describe, expect, it } from 'vitest';
import { pageTypeFromUrl } from '../shared/page-type';
import { bubblePosition, MAX_SELECTION, pillPosition, shouldOffer } from './selection';

describe('pageTypeFromUrl', () => {
  it.each([
    ['https://github.com/honojs/hono/pull/42/files', 'pull_request_diff'],
    ['https://github.com/honojs/hono/pull/42/commits', 'pull_request_diff'],
    ['https://github.com/honojs/hono/pull/42', 'pull_request'],
    ['https://github.com/honojs/hono/commit/abc123', 'commit'],
    ['https://github.com/honojs/hono/blob/main/src/index.ts', 'file'],
    ['https://github.com/honojs/hono/issues/7', 'issue'],
    ['https://github.com/honojs/hono/issues', 'repo'],
    ['https://github.com/honojs/hono/compare/main...dev', 'compare'],
    ['https://github.com/honojs/hono', 'repo'],
    ['https://github.com/honojs/hono/actions', 'other'],
    ['https://github.com/settings/profile', 'other'],
  ])('%s -> %s', (url, type) => {
    expect(pageTypeFromUrl(url)).toBe(type);
  });
});

describe('shouldOffer', () => {
  it('needs 3..4000 characters outside editable fields and Kitty', () => {
    expect(shouldOffer('git reset --hard', false, false)).toBe(true);
    expect(shouldOffer('  ab ', false, false)).toBe(false);
    expect(shouldOffer('x'.repeat(MAX_SELECTION + 1), false, false)).toBe(false);
    expect(shouldOffer('git status', true, false)).toBe(false);
    expect(shouldOffer('git status', false, true)).toBe(false);
  });
});

describe('placement', () => {
  const vp = { width: 1280, height: 800 };

  it('puts the pill under the selection end, clamped to the viewport', () => {
    expect(pillPosition({ top: 100, left: 200, right: 400, bottom: 120 }, vp)).toEqual({ top: 126, left: 290 });
    expect(pillPosition({ top: 100, left: 0, right: 20, bottom: 120 }, vp).left).toBe(4);
    expect(pillPosition({ top: 760, left: 200, right: 400, bottom: 790 }, vp).top).toBe(724); // flips above near the bottom
  });

  it('puts the bubble below, above, or pinned, never off-screen', () => {
    expect(bubblePosition({ top: 100, left: 1200, right: 1250, bottom: 120 }, vp)).toEqual({ top: 128, left: 892 });
    expect(bubblePosition({ top: 600, left: 10, right: 50, bottom: 620 }, vp).top).toBe(272);
    expect(bubblePosition({ top: 100, left: 10, right: 50, bottom: 700 }, { width: 400, height: 500 }).top).toBe(8);
    expect(bubblePosition(null, vp).left).toBeGreaterThan(0);
  });
});

describe('placement for long selections', () => {
  it('keeps the pill on screen when the selection rect is far below the viewport', () => {
    expect(pillPosition({ top: 4300, left: 400, right: 600, bottom: 4320 }, { width: 1280, height: 800 }).top).toBe(766);
  });
});
