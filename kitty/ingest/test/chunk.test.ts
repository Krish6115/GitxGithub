import { describe, expect, it } from 'vitest';
import { CHUNK, chunkMarkdown, countFences, estimateTokens } from '../src/chunk.js';

const meta = { sourceUrl: 'https://example.com/file', license: 'Repository author' };
const para = (n: number, word = 'lorem'): string => Array.from({ length: n }, (_, i) => `${word}${i}`).join(' ') + '.';

describe('chunkMarkdown', () => {
  it('tracks the heading path and title', () => {
    const md = `# Doc\n\n## Branching\n\n${para(30)}\n\n### Merging\n\n${para(30)}\n`;
    const [c] = chunkMarkdown({ sourceFile: 'Git/x.md', title: 'Doc', markdown: md, meta });
    expect(c).toMatchObject({ id: 'git-x#0', title: 'Doc', headingPath: ['Branching'], sourceFile: 'Git/x.md' });
    expect(c?.text).toContain('### Merging'); // merged subsection keeps its heading inline
  });

  it('keeps chunks within the size limit and overlaps continuation chunks', () => {
    const md = `## Big\n\n${Array.from({ length: 12 }, () => para(80)).join('\n\n')}\n`;
    const chunks = chunkMarkdown({ sourceFile: 'a.md', title: 'A', markdown: md, meta });
    expect(chunks.length).toBeGreaterThan(2);
    for (const c of chunks) expect(estimateTokens(c.text)).toBeLessThanOrEqual(CHUNK.max + CHUNK.overlap);
    const tailOfFirst = chunks[0]?.text.slice(-40) ?? '';
    expect(chunks[1]?.text).toContain(tailOfFirst.trim().split(' ').at(-1));
  });

  it('never splits inside a code fence without re-fencing', () => {
    const code = ['```console', ...Array.from({ length: 400 }, (_, i) => `$ git log --oneline ${i}`), '```'].join('\n');
    const chunks = chunkMarkdown({ sourceFile: 'a.md', title: 'A', markdown: `## Code\n\n${code}\n`, meta });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(countFences(c.text) % 2).toBe(0);
  });

  it('starts a new chunk when the excerpt source changes and records its URL and license', () => {
    const md = [
      '## One', '> Source: [A](https://a.example/one) · CC BY 4.0', para(20),
      '## Two', '> Source: [B](https://b.example/two) · GPL-2.0', para(20),
    ].join('\n\n');
    const chunks = chunkMarkdown({ sourceFile: 'r.md', title: 'R', markdown: md, meta });
    expect(chunks.map((c) => [c.sourceUrl, c.license])).toEqual([
      ['https://a.example/one', 'CC BY 4.0'],
      ['https://b.example/two', 'GPL-2.0'],
    ]);
    expect(chunks[0]?.text).not.toContain('> Source:');
  });

  it('drops the preamble before the first section when asked', () => {
    const md = `# T\n\n> **Sources and license.** header\n\n## Real\n\n${para(10)}\n`;
    const [c] = chunkMarkdown({ sourceFile: 'r.md', title: 'T', markdown: md, meta, skipPreamble: true });
    expect(c?.text).not.toContain('Sources and license');
  });
});
