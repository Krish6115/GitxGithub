import { describe, expect, it } from 'vitest';
import { cleanPageText, pageLabel } from './page-context';

describe('page context', () => {
  it('collapses whitespace and caps the text', () => {
    expect(cleanPageText('a  \t b\n\n\n\n c ').text).toBe('a b\n\nc');
    const long = cleanPageText('x'.repeat(50), 10);
    expect(long.truncated).toBe(true);
    expect(long.text.startsWith('x'.repeat(10))).toBe(true);
  });

  it('labels the page by repo and file', () => {
    expect(pageLabel({ url: 'https://github.com/Krish6115/GitKitty/blob/main/kitty/README.md', title: '' })).toBe('Krish6115/GitKitty · README.md');
    expect(pageLabel({ url: 'https://github.com/Krish6115/GitKitty/pull/4', title: '' })).toBe('Krish6115/GitKitty · pull 4');
    expect(pageLabel({ url: 'https://github.com/Krish6115/GitKitty', title: '' })).toBe('Krish6115/GitKitty');
  });
});
