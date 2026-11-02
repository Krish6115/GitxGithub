// retrieve(query, k): BM25 search over the knowledge index with synonym expansion and per-source dedupe.
import { getIndex, type LoadedIndex } from './load-index.js';
import { FIELD_BOOST, type Chunk } from './search-config.js';
import { expandQuery } from './synonyms.js';
import { terms } from './tokenize.js';

export interface RetrievedChunk extends Chunk {
  score: number;
}

export interface RetrieveOptions {
  /** Max chunks returned from one source file (default 2), so answers can cite several sources. */
  maxPerSource?: number;
  /** Weight of synonym-expanded terms relative to the learner's own words (default 0.35). */
  synonymWeight?: number;
  /** How many raw hits to consider before dedupe (default 40). */
  candidates?: number;
}

/** Retrieve against a specific loaded index (used by tests and the eval script). */
export function retrieveFrom(index: LoadedIndex, query: string, k = 6, opts: RetrieveOptions = {}): RetrievedChunk[] {
  const { maxPerSource = 2, synonymWeight = 0.35, candidates = 40 } = opts;
  const q = query.trim();
  if (!q || k <= 0) return [];

  const own = new Set(terms(q));
  const extra = expandQuery(q);
  const expanded = new Set(terms(extra).filter((t) => !own.has(t)));

  const hits = index.search.search(extra ? `${q} ${extra}` : q, {
    boost: FIELD_BOOST,
    combineWith: 'OR',
    boostTerm: (term) => (expanded.has(term) ? synonymWeight : 1),
    // typo tolerance only for longer plain words; flags and refs must match exactly
    fuzzy: (term) => (/^[a-z]{6,}$/.test(term) ? 0.15 : false),
    prefix: (term) => /^[a-z]{5,}$/.test(term),
    weights: { fuzzy: 0.3, prefix: 0.5 },
  });

  const out: RetrievedChunk[] = [];
  const perSource = new Map<string, number[]>();
  for (const hit of hits.slice(0, candidates)) {
    const pos = hit.id as number;
    const chunk = index.chunks[pos];
    if (!chunk) continue;
    const taken = perSource.get(chunk.sourceFile) ?? [];
    // skip extra hits from an already-full source, and neighbours that overlap a chunk we already have
    if (taken.length >= maxPerSource || taken.some((p) => Math.abs(p - pos) <= 1)) continue;
    taken.push(pos);
    perSource.set(chunk.sourceFile, taken);
    out.push({ ...chunk, score: Math.round(hit.score * 1000) / 1000 });
    if (out.length >= k) break;
  }
  return out;
}

/** Retrieve the top-k chunks for a learner question from the default index. */
export function retrieve(query: string, k = 6, opts?: RetrieveOptions): RetrievedChunk[] {
  return retrieveFrom(getIndex(), query, k, opts);
}
