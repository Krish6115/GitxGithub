import { describe, expect, it } from 'vitest';
import { contextPack, contextPackFilename } from './context-pack';
import { startState, type TourResult } from './tour';

const SHA = 'a'.repeat(40);
const result = (over: Partial<TourResult['tour']> = {}, issue?: TourResult['meta']['issue']): TourResult => ({
  tour: {
    summary: 'A tiny\nweb framework.',
    stack: ['TypeScript', 'Vitest'],
    how_to_run: 'npm install\nnpm test',
    how_to_contribute: 'Open an issue first.',
    good_first_issue_tips: ['Run the tests before pushing.'],
    steps: [
      { path: 'README.md', title: 'README', what: 'Overview.', why_it_matters: 'Start here.' },
      { path: 'src/index.ts', title: 'Entry', what: 'Exports the app.', why_it_matters: 'Public API.' },
    ],
    ...over,
  },
  meta: { owner: 'honojs', repo: 'hono', sha: SHA, partial: false, cached: false, provider: 'bharatcode', repaired: false, droppedSteps: [], unreadableFiles: 0, ...(issue ? { issue } : {}) },
});

describe('context pack', () => {
  it('turns a tour into a Markdown brief with linked key files in order', () => {
    const md = contextPack(startState(result()));
    expect(md).toMatch(/^# Project context: honojs\/hono\n/);
    expect(md).toContain('at commit `aaaaaaa`');
    expect(md).toContain('A tiny web framework.');
    expect(md).toContain('- TypeScript');
    expect(md).toContain(`1. [\`README.md\`](https://github.com/honojs/hono/blob/${SHA}/README.md): Overview. Start here.`);
    expect(md.indexOf('README.md')).toBeLessThan(md.indexOf('src/index.ts'));
    expect(md).toContain('## How to build, run and test\nnpm install\nnpm test');
    expect(md).toContain('## Contribution rules');
  });

  it('leaves out sections the repo did not state', () => {
    const md = contextPack(startState(result({ how_to_run: 'Not stated in the repo.', stack: [], good_first_issue_tips: [] })));
    expect(md).not.toContain('How to build');
    expect(md).not.toContain('## Stack');
    expect(md).not.toContain('## Tips');
  });

  it('describes the task for issue walkthroughs', () => {
    const issue = { number: 42, title: 'Crash on empty config', url: 'https://github.com/honojs/hono/issues/42', labels: [] };
    const s = startState(result({}, issue));
    const md = contextPack(s);
    expect(md).toContain('## The task\nFix issue #42: Crash on empty config');
    expect(md).toContain('## Files involved');
    expect(md).not.toContain('## Contribution rules');
    expect(contextPackFilename(s)).toBe('honojs-hono-issue-42-context.md');
  });
});
