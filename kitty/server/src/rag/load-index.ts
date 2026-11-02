// Loads and validates the prebuilt knowledge index (server/data/index.json).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniSearch, { type AsPlainObject } from 'minisearch';
import { IndexFileSchema, miniSearchOptions, type Chunk, type IndexedDoc, type IndexFile } from './search-config.js';

export interface LoadedIndex {
  chunks: Chunk[];
  search: MiniSearch<IndexedDoc>;
}

/** server/data/index.json next to the source; on Vercel the bundled function may run from the project root instead. */
export const DEFAULT_INDEX_PATH = ((): string => {
  const beside = fileURLToPath(new URL('../../data/index.json', import.meta.url));
  const fromCwd = join(process.cwd(), 'data', 'index.json');
  return process.env.KITTY_INDEX_PATH ?? (existsSync(beside) || !existsSync(fromCwd) ? beside : fromCwd);
})();

/** Validate a parsed index file and rebuild the MiniSearch instance from it. */
export function fromIndexFile(raw: unknown): LoadedIndex {
  const parsed: IndexFile = IndexFileSchema.parse(raw);
  const search = MiniSearch.loadJS<IndexedDoc>(parsed.search as unknown as AsPlainObject, miniSearchOptions);
  if (search.documentCount !== parsed.chunks.length) {
    throw new Error(`index mismatch: ${search.documentCount} indexed docs vs ${parsed.chunks.length} chunks`);
  }
  return { chunks: parsed.chunks, search };
}

let cached: LoadedIndex | null = null;

/** Load the default index once per process. */
export function getIndex(path = DEFAULT_INDEX_PATH): LoadedIndex {
  if (!cached) cached = fromIndexFile(JSON.parse(readFileSync(path, 'utf8')));
  return cached;
}
