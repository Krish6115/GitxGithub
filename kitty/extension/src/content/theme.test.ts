import { describe, expect, it } from 'vitest';
import { effectiveTheme } from './theme';
describe('effectiveTheme', () => {
  it('follows GitHub\'s explicit setting and the OS for auto', () => {
    expect(effectiveTheme('dark', false)).toBe('dark');
    expect(effectiveTheme('light', true)).toBe('light');
    expect(effectiveTheme('auto', true)).toBe('dark');
    expect(effectiveTheme(null, false)).toBe('light');
  });
});
