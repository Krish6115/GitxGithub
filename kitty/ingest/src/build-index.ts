// Turns sources into chunks and a serialized MiniSearch index.
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import MiniSearch from 'minisearch';
import {
  INDEX_VERSION,
  miniSearchOptions,
  toIndexedDoc,
  type Chunk,
  type IndexedDoc,
  type IndexFile,
} from '../../server/src/rag/search-config.js';
import { TOKENIZER_VERSION } from '../../server/src/rag/tokenize.js';
import { chunkMarkdown } from './chunk.js';
import { pdfToMarkdown } from './pdf.js';
import type { SourceFile } from './sources.js';

export interface SourceReport {
  path: string;
  via: 'pdf-text' | 'transcript' | 'markdown' | 'skipped';
  chunks: number;
}

const fileTitle = (path: string): string => basename(path).replace(/\.(pdf|md)$/i, '').replace(/[_-]+/g, ' ');

async function chunksFor(repoRoot: string, s: SourceFile): Promise<{ chunks: Chunk[]; via: SourceReport['via'] }> {
  const meta = { sourceUrl: s.url, license: s.license };
  if (s.kind === 'md') {
    const md = readFileSync(join(repoRoot, s.path), 'utf8').replace(/\r/g, '');
    const title = md.match(/^# (.*)$/m)?.[1]?.trim() ?? fileTitle(s.path);
    return { chunks: chunkMarkdown({ sourceFile: s.path, title, markdown: md, meta, skipPreamble: true }), via: 'markdown' };
  }
  const pdf = await pdfToMarkdown(new Uint8Array(readFileSync(join(repoRoot, s.path))), fileTitle(s.path));
  if (pdf.markdown) {
    return { chunks: chunkMarkdown({ sourceFile: s.path, title: pdf.title, markdown: pdf.markdown, meta }), via: 'pdf-text' };
  }
  if (s.transcript) {
    const md = readFileSync(join(repoRoot, s.transcript), 'utf8').replace(/\r/g, '');
    const title = md.match(/^# (.*)$/m)?.[1]?.trim() ?? pdf.title;
    // citations point at the PDF, not the transcript
    return { chunks: chunkMarkdown({ sourceFile: s.path, title, markdown: md, meta }), via: 'transcript' };
  }
  return { chunks: [], via: 'skipped' };
}

export async function buildIndex(repoRoot: string, sources: SourceFile[]): Promise<{ file: IndexFile; report: SourceReport[] }> {
  const chunks: Chunk[] = [];
  const report: SourceReport[] = [];
  for (const s of sources) {
    const r = await chunksFor(repoRoot, s);
    chunks.push(...r.chunks);
    report.push({ path: s.path, via: r.via, chunks: r.chunks.length });
  }
  const search = new MiniSearch<IndexedDoc>(miniSearchOptions);
  search.addAll(chunks.map(toIndexedDoc));
  const file: IndexFile = {
    version: INDEX_VERSION,
    tokenizerVersion: TOKENIZER_VERSION,
    chunks,
    search: search.toJSON() as unknown as Record<string, unknown>,
  };
  return { file, report };
}
