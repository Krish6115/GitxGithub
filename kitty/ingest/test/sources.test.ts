import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AUTHOR_LICENSE, listSources, REPO_BLOB } from '../src/sources.js';

describe('listSources', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'kitty-src-'));
    mkdirSync(join(root, 'Git', 'references'), { recursive: true });
    mkdirSync(join(root, 'Guide', 'references'), { recursive: true });
    mkdirSync(join(root, 'transcripts'));
    writeFileSync(join(root, 'Git', 'z notes.pdf'), 'xx');
    writeFileSync(join(root, 'Git', 'readme.md'), 'not a reference');
    writeFileSync(join(root, 'Git', 'references', 'rebasing.md'), '# R');
    writeFileSync(join(root, 'Git', 'references', 'SOURCES.md'), '# S');
    writeFileSync(join(root, 'Guide', 'references', 'a.md'), '# A');
    writeFileSync(join(root, 'transcripts', 'z notes.md'), '# T');
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('finds PDFs and reference Markdown, sorted, skipping SOURCES.md and non-reference .md', () => {
    const s = listSources(root, ['Git', 'Guide'], join(root, 'transcripts'));
    expect(s.map((x) => x.path)).toEqual(['Git/references/rebasing.md', 'Git/z notes.pdf', 'Guide/references/a.md']);
  });

  it('attaches citation metadata and transcripts', () => {
    const pdf = listSources(root, ['Git'], join(root, 'transcripts')).find((x) => x.kind === 'pdf');
    expect(pdf).toMatchObject({
      url: `${REPO_BLOB}Git/z%20notes.pdf`,
      license: AUTHOR_LICENSE,
      transcript: 'transcripts/z notes.md',
    });
  });
});
