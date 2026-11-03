import { describe, expect, it } from 'vitest';
import { pathFromUrl, repoFromUrl, stepUrl } from './github-page';
import { errorText } from './messages';
import { readSse } from './sse';
import { appendStep, finishState, startState, streamingState, syncToPath, tourContext, withIndex, type TourResult } from './tour';

const SHA = 'abcdef0123456789abcdef0123456789abcdef01';
const ref = { owner: 'honojs', repo: 'hono' };

describe('repoFromUrl', () => {
  it('detects repo pages and ignores GitHub feature pages', () => {
    expect(repoFromUrl('https://github.com/honojs/hono')).toEqual(ref);
    expect(repoFromUrl('https://github.com/honojs/hono/blob/main/src/index.ts')).toEqual(ref);
    expect(repoFromUrl('https://github.com/vercel/next.js/pulls')).toEqual({ owner: 'vercel', repo: 'next.js' });
    for (const u of ['https://github.com/', 'https://github.com/honojs', 'https://github.com/settings/profile', 'https://github.com/orgs/acme/people', 'https://github.com/marketplace/actions', 'https://gitlab.com/a/b', 'not a url']) {
      expect(repoFromUrl(u)).toBeNull();
    }
  });
});

describe('pathFromUrl / stepUrl', () => {
  it('round-trips paths with spaces and parentheses at the tour commit', () => {
    const path = 'Git/git_missing_topics(other than 101,notes,cheatsheet).pdf';
    const url = stepUrl({ owner: 'Krish6115', repo: 'GitKitty' }, SHA, path);
    expect(url).toBe(`https://github.com/Krish6115/GitKitty/blob/${SHA}/Git/git_missing_topics(other%20than%20101%2Cnotes%2Ccheatsheet).pdf`);
    expect(pathFromUrl(url, { owner: 'Krish6115', repo: 'GitKitty' }, SHA)).toBe(path);
  });

  it('only matches file pages at the tour commit (or its short sha)', () => {
    expect(pathFromUrl(`https://github.com/honojs/hono/blob/${SHA.slice(0, 7)}/src/index.ts`, ref, SHA)).toBe('src/index.ts');
    expect(pathFromUrl('https://github.com/honojs/hono/blob/main/src/index.ts', ref, SHA)).toBeNull();
    expect(pathFromUrl(`https://github.com/other/repo/blob/${SHA}/src/index.ts`, ref, SHA)).toBeNull();
    expect(pathFromUrl('https://github.com/honojs/hono/issues', ref, SHA)).toBeNull();
  });
});

const result: TourResult = {
  tour: { summary: 's', stack: [], how_to_run: 'r', how_to_contribute: 'c', good_first_issue_tips: [], steps: ['README.md', 'src/index.ts', 'package.json'].map((path) => ({ path, title: path, what: 'w', why_it_matters: 'y' })) },
  meta: { owner: 'honojs', repo: 'hono', sha: SHA, partial: true, cached: false, provider: 'mock', repaired: false, droppedSteps: [], unreadableFiles: 0 },
};

describe('tour state', () => {
  it('starts at step 0 and clamps navigation', () => {
    const s = startState(result);
    expect(s).toMatchObject({ owner: 'honojs', sha: SHA, partial: true, currentIndex: 0 });
    expect(withIndex(s, 5).currentIndex).toBe(2);
    expect(withIndex(s, -1).currentIndex).toBe(0);
  });

  it('follows the page the user is on (back button) and ignores unrelated pages', () => {
    const s = withIndex(startState(result), 2);
    expect(syncToPath(s, 'src/index.ts').currentIndex).toBe(1);
    expect(syncToPath(s, 'docs/other.md')).toBe(s);
    expect(syncToPath(s, null)).toBe(s);
  });
});

describe('readSse', () => {
  it('parses named events split across chunks', async () => {
    const enc = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        for (const part of ['event: progress\ndata: {"stage":"fetch', 'ing"}\n\n', 'event: ping\ndata: {}\n\n', 'event: result\r\ndata: {"ok":true}\r\n\r\n']) c.enqueue(enc.encode(part));
        c.close();
      },
    });
    const out = [];
    for await (const e of readSse(body)) out.push(e);
    expect(out).toEqual([
      { event: 'progress', data: '{"stage":"fetching"}' },
      { event: 'ping', data: '{}' },
      { event: 'result', data: '{"ok":true}' },
    ]);
  });
});

describe('errorText', () => {
  it('gives setup guidance for subscription and key problems', () => {
    expect(errorText('subscription_required', 'x')).toMatch(/subscription/);
    expect(errorText('key_required', 'x')).toMatch(/settings/);
    expect(errorText('weird_code', 'Fallback text')).toBe('Fallback text');
  });
});

describe('tour context for the chat', () => {
  it('describes the current step, or the one the user asked about', () => {
    const s = withIndex(startState(result), 1);
    expect(tourContext(s)).toMatchObject({ repo: 'honojs/hono', summary: 's', stepNumber: 2, totalSteps: 3, step: { path: 'src/index.ts' } });
    expect(tourContext(s, 2)?.stepNumber).toBe(3);
    expect(tourContext(s, 99)?.stepNumber).toBe(3); // clamped
  });
});

describe('streaming tours', () => {
  const start = { owner: 'honojs', repo: 'hono', sha: SHA, defaultBranch: 'main', partial: false, expectedSteps: 7 };
  const step = (path: string) => ({ path, title: path, what: 'w', why_it_matters: 'y' });

  it('opens on step 1 and appends steps as they arrive', () => {
    let s = streamingState(start, step('README.md'));
    expect(s).toMatchObject({ streaming: true, expectedSteps: 7, currentIndex: 0 });
    s = appendStep(appendStep(s, step('src/index.ts')), step('src/index.ts'));
    expect(s.steps.map((x) => x.path)).toEqual(['README.md', 'src/index.ts']);
  });

  it('keeps the user on the step they are reading when the final tour arrives', () => {
    const s = withIndex(appendStep(streamingState(start, step('README.md')), step('src/index.ts')), 1);
    const done = finishState(s, result);
    expect(done.streaming).toBeUndefined();
    expect(done.steps[done.currentIndex]?.path).toBe('src/index.ts');
    expect(finishState(null, result).currentIndex).toBe(0);
  });
});
