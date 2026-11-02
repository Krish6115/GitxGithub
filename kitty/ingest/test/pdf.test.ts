import { describe, expect, it } from 'vitest';
import { groupLines, linesToMarkdown, type PdfLine } from '../src/pdf.js';

const L = (page: number, text: string, size = 9): PdfLine => ({ page, text, size });

describe('groupLines', () => {
  it('joins items on the same baseline and splits on EOL / y change', () => {
    const lines = groupLines([[
      { str: 'git ', y: 100, fontSize: 9, hasEOL: false },
      { str: 'stash', y: 100, fontSize: 9, hasEOL: true },
      { str: 'Scenario 06', y: 80, fontSize: 20, hasEOL: false },
    ]]);
    expect(lines).toEqual([L(0, 'git stash'), L(0, 'Scenario 06', 20)]);
  });
});

describe('linesToMarkdown', () => {
  const body = Array.from({ length: 6 }, (_, i) => L(0, `body text line number ${i} with enough words`));

  it('maps font sizes to headings and the title', () => {
    const { title, markdown } = linesToMarkdown([L(0, 'Git Guide', 36), L(0, 'Scenario 01: Setup', 20), ...body, L(0, 'Step one', 13)], 'fallback');
    expect(title).toBe('Git Guide');
    expect(markdown).toContain('## Scenario 01: Setup');
    expect(markdown).toContain('### Step one');
  });

  it('merges a heading wrapped onto two lines', () => {
    const { markdown } = linesToMarkdown([...body, L(0, 'Working with Existing Projects on', 13), L(0, 'GitHub', 13)], 'f');
    expect(markdown).toContain('### Working with Existing Projects on GitHub');
  });

  it('escapes shell comments and drops running headers and page numbers', () => {
    const pages = [0, 1, 2, 3].flatMap((p) => [L(p, 'Guide · Krish6115/GitxGithub', 8), ...body.map((b) => ({ ...b, page: p })), L(p, String(p + 1))]);
    const { markdown } = linesToMarkdown([...pages, L(3, '# Verify:')], 'f');
    expect(markdown).not.toContain('Krish6115/GitxGithub');
    expect(markdown).not.toMatch(/^\d+$/m);
    expect(markdown).toContain('\\# Verify:');
  });
});
