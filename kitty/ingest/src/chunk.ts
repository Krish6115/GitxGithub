// Heading-aware Markdown chunker.
import type { Chunk } from '../../server/src/rag/search-config.js';

export const CHUNK = { min: 400, max: 600, overlap: 60 } as const;

/** Rough token estimate (~4 characters per token); no Qwen tokenizer is available offline. */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export interface SourceMeta {
  sourceUrl: string;
  license: string;
}

export interface ChunkInput {
  sourceFile: string;
  title: string;
  markdown: string;
  /** Default source/license; `> Source: [label](url) · LICENSE` lines inside the file override it per section. */
  meta: SourceMeta;
  /** Drop everything before the first `##` heading (e.g. license header blocks). */
  skipPreamble?: boolean;
}

interface Block {
  path: string[];
  text: string;
  meta: SourceMeta;
  /** First block of a new section (a preferred place to start a chunk). */
  sectionStart: boolean;
}

const SOURCE_LINE = /^> Source: \[[^\]]*\]\(([^)]+)\) · (.+)$/;
/** Code fence at any indentation (list items indent their code blocks). */
const FENCE = /^\s*```/;
export const countFences = (text: string): number => text.split('\n').filter((l) => FENCE.test(l)).length;

/** Split markdown into paragraph/code blocks annotated with heading path and source. */
function toBlocks(input: ChunkInput): Block[] {
  const blocks: Block[] = [];
  const path: string[] = [];
  let meta = input.meta;
  let buf: string[] = [];
  let fence = false;
  let sectionStart = true;
  let seenHeading = false;
  const flush = (): void => {
    const text = buf.join('\n').replace(/^\n+|\s+$/g, ''); // keep indentation (list-item code blocks)
    buf = [];
    if (!text || (input.skipPreamble && !seenHeading)) return;
    blocks.push({ path: [...path], text, meta, sectionStart });
    sectionStart = false;
  };
  for (const line of input.markdown.split('\n')) {
    if (FENCE.test(line)) fence = !fence;
    if (!fence) {
      const h = line.match(/^(#{1,6}) (.*)$/);
      if (h?.[1] && h[2] !== undefined) {
        flush();
        const level = h[1].length;
        if (level === 1) continue; // document title lives in `title`
        path.length = Math.max(0, level - 2);
        path.push(h[2].trim());
        sectionStart = true;
        seenHeading = true;
        continue;
      }
      const src = line.match(SOURCE_LINE);
      if (src?.[1] && src[2]) {
        flush();
        meta = { sourceUrl: src[1], license: src[2].trim() };
        continue;
      }
      if (line.trim() === '') {
        flush();
        continue;
      }
    }
    buf.push(line);
  }
  flush();
  return blocks;
}

/** Split one oversized block into line-based pieces under the max size, keeping code fences balanced. */
function splitBlock(b: Block): Block[] {
  if (estimateTokens(b.text) <= CHUNK.max) return [b];
  const lines = b.text.split('\n');
  const fenceOpen = FENCE.test(lines[0] ?? '') ? (lines[0] ?? '```').trim() : null;
  const pieces: Block[] = [];
  let cur: string[] = [];
  const emit = (): void => {
    if (!cur.length) return;
    let text = cur.join('\n');
    if (fenceOpen && !FENCE.test(text.split('\n')[0] ?? '')) text = `${fenceOpen}\n${text}`;
    if (fenceOpen && countFences(text) % 2 === 1) text += '\n```';
    pieces.push({ ...b, text, sectionStart: b.sectionStart && pieces.length === 0 });
    cur = [];
  };
  for (const line of lines) {
    if (estimateTokens([...cur, line].join('\n')) > CHUNK.max) emit();
    cur.push(line);
  }
  emit();
  return pieces;
}

/** Last ~`tokens` tokens of `text`, cut at a line or sentence boundary. */
function tail(text: string, tokens: number): string {
  const want = tokens * 4;
  if (text.length <= want) return text;
  const slice = text.slice(-want);
  const cut = slice.search(/(?<=[.!?:])\s|\n/);
  return (cut >= 0 ? slice.slice(cut) : slice).trim();
}

const slug = (s: string): string => s.toLowerCase().replace(/\.(pdf|md)$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function chunkMarkdown(input: ChunkInput): Chunk[] {
  const blocks = toBlocks(input).flatMap(splitBlock);
  const chunks: Chunk[] = [];
  let cur: Block[] = [];
  let overlap = '';
  const emit = (continuesSection: boolean): void => {
    if (!cur.length) return;
    const first = cur[0];
    if (!first) return;
    const parts: string[] = [];
    if (overlap) parts.push(overlap);
    cur.forEach((b, i) => {
      // a later section merged into this chunk keeps its heading inline for context
      const prev = cur[i - 1];
      if (i > 0 && b.sectionStart && prev && b.path.join('>') !== prev.path.join('>')) parts.push(`${'#'.repeat(b.path.length + 1)} ${b.path.at(-1) ?? ''}`);
      parts.push(b.text);
    });
    const text = parts.join('\n\n');
    chunks.push({
      id: `${slug(input.sourceFile)}#${chunks.length}`,
      text,
      title: input.title,
      headingPath: first.path,
      sourceFile: input.sourceFile,
      sourceUrl: first.meta.sourceUrl,
      license: first.meta.license,
    });
    const t = continuesSection ? tail(text, CHUNK.overlap) : '';
    overlap = t.includes('```') ? '' : t; // a tail that crosses a code fence would unbalance the next chunk
    cur = [];
  };

  for (const b of blocks) {
    const size = (overlap ? estimateTokens(overlap) : 0) + estimateTokens(cur.map((c) => c.text).join('\n\n'));
    const first = cur[0];
    const sourceChanged = first !== undefined && first.meta.sourceUrl !== b.meta.sourceUrl;
    const topChanged = first !== undefined && (first.path[0] ?? '') !== (b.path[0] ?? '');
    // tiny trailing sections may join the next top-level section, but never across sources
    const topBreak = topChanged && size >= CHUNK.min / 2;
    if (cur.length && (sourceChanged || topBreak || (b.sectionStart && size >= CHUNK.min))) emit(false);
    else if (cur.length && size + estimateTokens(b.text) > CHUNK.max) emit(!b.sectionStart);
    cur.push(b);
  }
  emit(false);
  return chunks;
}
