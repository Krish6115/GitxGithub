import { describe, expect, it } from 'vitest';
import { toHistory, trimChat, type ChatMessage } from './chat';
import { parseInline, parseMarkdown } from './markdown-parse';

describe('parseMarkdown', () => {
  it('parses the tutor answer format', () => {
    const md = [
      '**Situation:** You pushed a bad commit [1].',
      '',
      '**Commands:**',
      '```bash',
      'git revert abc123   # undo safely',
      'git push',
      '```',
      '',
      '1. First step',
      '2. Second step',
      '',
      '- a bullet with `code`',
    ].join('\n');
    const blocks = parseMarkdown(md);
    expect(blocks.map((b) => b.t)).toEqual(['para', 'para', 'code', 'list', 'list']);
    expect(blocks[0]).toEqual({ t: 'para', v: [{ t: 'bold', v: [{ t: 'text', v: 'Situation:' }] }, { t: 'text', v: ' You pushed a bad commit ' }, { t: 'cite', n: 1 }, { t: 'text', v: '.' }] });
    expect(blocks[2]).toEqual({ t: 'code', lang: 'bash', v: 'git revert abc123   # undo safely\ngit push' });
    expect(blocks[3]).toMatchObject({ t: 'list', ordered: true, items: [[{ t: 'text', v: 'First step' }], [{ t: 'text', v: 'Second step' }]] });
  });

  it('keeps an unclosed fence (mid-stream) as a code block', () => {
    expect(parseMarkdown('Try:\n```bash\ngit sta')).toEqual([{ t: 'para', v: [{ t: 'text', v: 'Try:' }] }, { t: 'code', lang: 'bash', v: 'git sta' }]);
  });
});

describe('parseInline safety', () => {
  it('only links http(s) URLs; javascript:, data: and relative links become plain text', () => {
    expect(parseInline('[docs](https://git-scm.com/docs)')).toEqual([{ t: 'link', href: 'https://git-scm.com/docs', v: 'docs' }]);
    for (const evil of ['[click](javascript:alert(1))', '[x](data:text/html,<script>alert(1)</script>)', '[rel](/settings)']) {
      expect(parseInline(evil).some((n) => n.t === 'link')).toBe(false);
    }
  });

  it('treats HTML as text (rendered escaped by Preact)', () => {
    expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([{ t: 'text', v: '<img src=x onerror=alert(1)>' }]);
  });

  it('autolinks bare URLs without trailing punctuation', () => {
    expect(parseInline('See https://git-scm.com/docs/git-rebase.')).toEqual([
      { t: 'text', v: 'See ' },
      { t: 'link', href: 'https://git-scm.com/docs/git-rebase', v: 'https://git-scm.com/docs/git-rebase' },
      { t: 'text', v: '.' },
    ]);
  });
});

describe('chat helpers', () => {
  const a = (content: string, status: 'done' | 'error' | 'stopped' = 'done'): ChatMessage => ({ role: 'assistant', content, sources: [], status });
  const u = (content: string): ChatMessage => ({ role: 'user', content });

  it('keeps the last 20 messages', () => {
    expect(trimChat(Array.from({ length: 25 }, (_, i) => u(String(i))))[0]).toEqual(u('5'));
  });

  it('sends only completed exchanges as history', () => {
    expect(toHistory([u('q1'), a('a1'), u('q2'), a('', 'error'), u('q3'), a('partial', 'stopped')])).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
    ]);
  });
});
