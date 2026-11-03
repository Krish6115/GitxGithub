// Instant answers: common Git questions answered once by the real model (through the normal sourced tutor pipeline),
// reviewed, and saved in data/faq.json. A new question that clearly matches one is answered at once, with no tokens.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniSearch from 'minisearch';
import { z } from 'zod';
import type { TutorTurn } from './history.js';

const SourceSchema = z.object({
  n: z.number(),
  title: z.string(),
  headingPath: z.array(z.string()),
  sourceFile: z.string(),
  sourceUrl: z.string(),
  license: z.string(),
});

export const FaqEntrySchema = z.object({
  id: z.string(),
  /** The canonical question first, then other ways people ask it. */
  questions: z.array(z.string().min(3)).min(1),
  answer: z.string().min(20),
  sources: z.array(SourceSchema),
});
export type FaqEntry = z.infer<typeof FaqEntrySchema>;
export const FaqFileSchema = z.object({ generatedAt: z.string(), model: z.string(), entries: z.array(FaqEntrySchema) });
export type FaqFile = z.infer<typeof FaqFileSchema>;

const STOP = new Set('a an the i my me to do does did how what is are can could should would in on of for and or with it this that git github please'.split(' '));
/** Lowercase content words (git command names count; filler words don't). */
export const contentWords = (s: string): string[] =>
  s.toLowerCase().replace(/[^a-z0-9.\-\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

/** Questions about the user's own context (the page, the tour, a PR) or asking Kitty to act need the full tutor. */
const CONTEXTUAL = /\b(this|these|here|above|page|step|tour|take me|show me|find me)\b|#\d+|github\.com\//i;

export interface FaqMatcher {
  match(question: string, history: TutorTurn[]): FaqEntry | null;
  size: number;
}

/**
 * Match only when it is clearly the same question: the best entry must score well above a floor, beat the
 * runner-up entry clearly, and share most of its content words with the matched phrasing.
 */
export function createFaqMatcher(entries: FaqEntry[]): FaqMatcher {
  const docs = entries.flatMap((e, i) => e.questions.map((q, j) => ({ id: `${i}:${j}`, entry: i, text: q })));
  const search = new MiniSearch<(typeof docs)[number]>({ fields: ['text'], storeFields: ['entry', 'text'], searchOptions: { fuzzy: 0.15, prefix: true } });
  search.addAll(docs);
  // words that belong to just one entry ("rename" vs "delete") decide between look-alike questions
  const owners = new Map<string, Set<number>>();
  entries.forEach((e, i) => e.questions.flatMap(contentWords).forEach((w) => owners.set(w, (owners.get(w) ?? new Set()).add(i))));
  const ownedBy = (w: string): number | null => {
    const o = owners.get(w);
    return o?.size === 1 ? ([...o][0] ?? null) : null;
  };
  return {
    size: entries.length,
    match(question, history) {
      if (history.length > 0 || CONTEXTUAL.test(question) || question.length > 220) return null;
      const hits = search.search(question);
      const best = hits[0];
      if (!best) return null;
      const bestEntry = best['entry'] as number;
      const runnerUp = hits.find((h) => h['entry'] !== bestEntry);
      const words = new Set(contentWords(question));
      const target = contentWords(String(best['text']));
      const overlap = target.filter((w) => words.has(w)).length / Math.max(1, Math.max(target.length, words.size));
      const clear = !runnerUp || best.score >= runnerUp.score * 1.4;
      // a word that only another entry uses means the user is asking that other thing
      const conflict = [...words].some((w) => {
        const o = ownedBy(w);
        return o !== null && o !== bestEntry;
      });
      return best.score >= 6 && clear && !conflict && overlap >= 0.5 ? (entries[bestEntry] ?? null) : null;
    },
  };
}

export const DEFAULT_FAQ_PATH = ((): string => {
  const beside = fileURLToPath(new URL('../../data/faq.json', import.meta.url));
  const fromCwd = join(process.cwd(), 'data', 'faq.json');
  return existsSync(beside) || !existsSync(fromCwd) ? beside : fromCwd;
})();

let cached: FaqMatcher | null = null;
/** Load data/faq.json once; a missing or invalid file just means no instant answers. */
export function getFaqMatcher(path = DEFAULT_FAQ_PATH): FaqMatcher {
  if (cached) return cached;
  try {
    cached = createFaqMatcher(FaqFileSchema.parse(JSON.parse(readFileSync(path, 'utf8'))).entries);
  } catch {
    cached = createFaqMatcher([]);
  }
  return cached;
}
