import MiniSearch from 'minisearch';
import { describe, expect, it } from 'vitest';
import { fromIndexFile } from '../src/rag/load-index.js';
import { retrieveFrom } from '../src/rag/retrieve.js';
import { INDEX_VERSION, miniSearchOptions, toIndexedDoc, type Chunk, type IndexedDoc } from '../src/rag/search-config.js';
import { TOKENIZER_VERSION } from '../src/rag/tokenize.js';

const chunk = (sourceFile: string, n: number, title: string, text: string, headingPath: string[] = []): Chunk => ({
  id: `${sourceFile}#${n}`,
  text,
  title,
  headingPath,
  sourceFile,
  sourceUrl: `https://example.com/${sourceFile}`,
  license: 'CC BY 4.0',
});

const CHUNKS: Chunk[] = [
  chunk('stash.md', 0, 'Stashing', 'git stash saves your uncommitted changes so you can switch branches.', ['Stashing Your Work']),
  chunk('stash.md', 1, 'Stashing', 'git stash pop reapplies the most recent stash.', ['Stashing Your Work']),
  chunk('stash.md', 2, 'Stashing', 'git stash list shows every stash. git stash drop deletes one.', ['Managing stashes']),
  chunk('stash.md', 3, 'Stashing', 'git stash -u also stashes untracked files.', ['Untracked files']),
  chunk('undo.md', 0, 'Undoing', 'git revert creates a new commit that reverses an earlier one.', ['Revert']),
  chunk('undo.md', 1, 'Undoing', 'git reset HEAD~1 moves the branch back one commit.', ['Reset']),
  chunk('push.md', 0, 'Pushing', 'git push --force-with-lease refuses to overwrite work you have not seen.', ['Force pushing']),
  chunk('blame.md', 0, 'Blame', 'git blame shows the author and commit for every line of a file.', ['Blame']),
];

function fixtureIndex() {
  const search = new MiniSearch<IndexedDoc>(miniSearchOptions);
  search.addAll(CHUNKS.map(toIndexedDoc));
  // round-trip through JSON exactly like server/data/index.json
  const raw = JSON.parse(JSON.stringify({ version: INDEX_VERSION, tokenizerVersion: TOKENIZER_VERSION, chunks: CHUNKS, search }));
  return fromIndexFile(raw);
}

describe('retrieveFrom', () => {
  const index = fixtureIndex();

  it('returns at most k results with chunk metadata and a score', () => {
    const r = retrieveFrom(index, 'git stash', 3);
    expect(r.length).toBeLessThanOrEqual(3);
    expect(r[0]).toMatchObject({ sourceFile: 'stash.md', license: 'CC BY 4.0', sourceUrl: 'https://example.com/stash.md' });
    expect(r[0]?.score).toBeGreaterThan(0);
  });

  it('caps results per source and skips overlapping neighbours', () => {
    const r = retrieveFrom(index, 'stash', 6);
    const fromStash = r.filter((c) => c.sourceFile === 'stash.md');
    expect(fromStash.length).toBeLessThanOrEqual(2);
    const ids = fromStash.map((c) => Number(c.id.split('#')[1]));
    if (ids.length === 2) expect(Math.abs((ids[0] ?? 0) - (ids[1] ?? 0))).toBeGreaterThan(1);
  });

  it('matches exact git flags', () => {
    expect(retrieveFrom(index, 'what does --force-with-lease do', 1)[0]?.sourceFile).toBe('push.md');
  });

  it('uses synonyms to bridge learner phrasing', () => {
    expect(retrieveFrom(index, 'how do I undo my last commit', 1)[0]?.sourceFile).toBe('undo.md');
    expect(retrieveFrom(index, 'who changed this line', 1)[0]?.sourceFile).toBe('blame.md');
  });

  it('handles empty queries', () => {
    expect(retrieveFrom(index, '   ', 6)).toEqual([]);
  });

  it('rejects an index built with a different tokenizer version', () => {
    expect(() => fromIndexFile({ version: INDEX_VERSION, tokenizerVersion: TOKENIZER_VERSION + 1, chunks: [], search: {} })).toThrow();
  });
});
