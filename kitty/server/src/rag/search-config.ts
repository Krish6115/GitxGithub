// Shared index schema + MiniSearch options. The indexer and the retriever must use exactly these.
import type { Options } from 'minisearch';
import { z } from 'zod';
import { processTerm, tokenize, TOKENIZER_VERSION } from './tokenize.js';

export const INDEX_VERSION = 1;

export const ChunkSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  title: z.string(),
  headingPath: z.array(z.string()),
  sourceFile: z.string().min(1),
  sourceUrl: z.url(),
  license: z.string().min(1),
});
export type Chunk = z.infer<typeof ChunkSchema>;

/** What MiniSearch indexes for each chunk; `id` is the chunk's position in `chunks`. */
export interface IndexedDoc {
  id: number;
  title: string;
  headings: string;
  text: string;
}

export const FIELD_BOOST = { title: 3, headings: 2, text: 1 } as const;

export const miniSearchOptions: Options<IndexedDoc> = {
  fields: ['title', 'headings', 'text'],
  storeFields: [],
  tokenize: (text) => tokenize(text),
  processTerm: (term) => processTerm(term),
};

export const toIndexedDoc = (c: Chunk, id: number): IndexedDoc => ({
  id,
  title: c.title,
  headings: c.headingPath.join(' > '),
  text: c.text,
});

export const IndexFileSchema = z.object({
  version: z.literal(INDEX_VERSION),
  tokenizerVersion: z.literal(TOKENIZER_VERSION),
  chunks: z.array(ChunkSchema),
  // MiniSearch's own serialized form; validated structurally by MiniSearch.loadJS.
  search: z.record(z.string(), z.unknown()),
});
export type IndexFile = z.infer<typeof IndexFileSchema>;
