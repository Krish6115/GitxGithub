import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildIndex, listPdfs } from '../src/sources.js';

describe('listPdfs', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'kitty-ingest-'));
    mkdirSync(join(root, 'A', 'nested'), { recursive: true });
    mkdirSync(join(root, 'B'));
    writeFileSync(join(root, 'A', 'z.pdf'), 'xx');
    writeFileSync(join(root, 'A', 'nested', 'a.PDF'), 'x');
    writeFileSync(join(root, 'A', 'notes.md'), 'ignored');
    writeFileSync(join(root, 'B', 'b.pdf'), 'xxx');
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('finds PDFs recursively with sorted POSIX paths', () => {
    expect(listPdfs(root, ['A', 'B'])).toEqual([
      { path: 'A/nested/a.PDF', bytes: 1 },
      { path: 'A/z.pdf', bytes: 2 },
      { path: 'B/b.pdf', bytes: 3 },
    ]);
  });

  it('builds a deterministic index', () => {
    expect(buildIndex([])).toEqual({ version: 1, sources: [], chunks: [] });
  });
});
