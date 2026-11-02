// Tutor pipeline: retrieve -> prompt -> streamed answer -> flag check.
import { streamWithEarlyRetry } from '../llm/early-retry.js';
import type { Provider, Usage } from '../llm/types.js';
import type { RetrievedChunk } from '../rag/retrieve.js';
import { isShortQuestion, searchText, trimHistory, type TutorRequest } from './history.js';
import { tutorMessages } from './prompt.js';
import { unverifiedFlags } from './verify-flags.js';

/** Below this top BM25 score the sources are treated as not relevant (calibrated: off-topic <= ~31, eval questions >= ~124). */
export const WEAK_SCORE = 20;

export interface TutorSource {
  n: number;
  title: string;
  headingPath: string[];
  sourceFile: string;
  sourceUrl: string;
  license: string;
}

export type TutorEvent =
  | { type: 'sources'; sources: TutorSource[]; weak: boolean }
  | { type: 'delta'; text: string }
  | { type: 'done'; usage: Usage | null; truncated: boolean; unverifiedFlags: string[] };

export interface TutorDeps {
  provider: Provider;
  retrieve: (query: string, k: number) => RetrievedChunk[];
}

export async function* streamTutor(deps: TutorDeps, req: TutorRequest, signal?: AbortSignal): AsyncGenerator<TutorEvent> {
  const history = trimHistory(req.history);
  const chunks = deps.retrieve(searchText(req.question, history), 6);
  const weak = (chunks[0]?.score ?? 0) < WEAK_SCORE;
  yield {
    type: 'sources',
    weak,
    sources: chunks.map((c, i) => ({ n: i + 1, title: c.title, headingPath: c.headingPath, sourceFile: c.sourceFile, sourceUrl: c.sourceUrl, license: c.license })),
  };
  const request = {
    kind: 'tutor' as const,
    messages: tutorMessages(req.question, history, chunks, weak, req.page, undefined, req.tour),
    ...(isShortQuestion(req.question) ? { reasoningEffort: 'none' as const } : {}),
    ...(signal ? { signal } : {}),
  };
  let answer = '';
  for await (const ev of streamWithEarlyRetry(deps.provider, request)) {
    if (ev.type === 'delta') {
      answer += ev.text;
      yield ev;
    } else {
      yield { type: 'done', usage: ev.result.usage, truncated: ev.result.truncated, unverifiedFlags: unverifiedFlags(answer, chunks.map((c) => c.text)) };
    }
  }
}
