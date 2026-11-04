// Tutor pipeline: retrieve -> prompt -> streamed answer -> flag check.
import { streamWithEarlyRetry } from '../llm/early-retry.js';
import { KittyError } from '../llm/errors.js';
import type { Provider, Usage } from '../llm/types.js';
import type { RetrievedChunk } from '../rag/retrieve.js';
import { isShortQuestion, searchText, trimHistory, type TutorRequest } from './history.js';
import { tutorMessages } from './prompt.js';
import { unverifiedFlags } from './verify-flags.js';
import { parseAction, type KittyAction } from './actions.js';
import type { FaqMatcher } from './faq.js';
import { isRepoCodeQuestion, repoOf, type RepoFiles } from '../github/repo-files.js';

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
  | { type: 'action'; action: KittyAction }
  /** Repo files Kitty read to answer a question about the code. */
  | { type: 'files'; repo: string; files: { path: string; url: string }[] }
  /** `instant`: a saved, reviewed answer to a common question (no model call). */
  | { type: 'done'; usage: Usage | null; truncated: boolean; unverifiedFlags: string[]; instant?: boolean };

/** The whole answer must start within this long, retry included; the model's own limits are tighter per attempt. */
export const TUTOR_DEADLINE_MS = 45_000;
const FIRST_TOKEN_MS = 25_000;

const SMALL_TALK: [RegExp, string][] = [
  [/^(hi+|hey+|hello+|hola|yo|namaste|good (morning|afternoon|evening))[\s!.,]*(kitty)?[\s!.]*$/i, "Hi! 🐾 I'm Kitty. Ask me anything about Git or GitHub (\"how do I undo my last commit?\"), ask about the page you're on, or say \"find me a good first issue about Docker\"."],
  [/^(thanks|thank you|thx|ty|cool|great|nice|ok(ay)?|got it)[\s!.,]*(kitty)?[\s!.]*$/i, "You're welcome! 🐾 Ask me whenever you're stuck with Git."],
  [/^(who|what) are you\??$|^what can you do\??$/i, "I'm Kitty, a Git & GitHub companion. I can tour a repo, explain Git step by step with sources, explain anything you select on GitHub, find good first issues, walk you through fixing one, and check your PR before maintainers do."],
];
/** A canned reply for greetings and thanks (no model call). */
export const smallTalk = (q: string): string | null => SMALL_TALK.find(([re]) => re.test(q.trim()))?.[1] ?? null;

export interface TutorDeps {
  provider: Provider;
  retrieve: (query: string, k: number) => RetrievedChunk[];
  /** Saved answers to common questions; a clear match is answered instantly. */
  faq?: FaqMatcher;
  /** Finds repo files for questions about the code on screen (needs GitHub). */
  repoFiles?: (owner: string, repo: string, question: string) => Promise<RepoFiles | null>;
}

/** Repo lookups must not hold the answer up for long. */
export const REPO_FILES_MS = 8_000;

async function lookUpRepoFiles(deps: TutorDeps, req: TutorRequest): Promise<RepoFiles | null> {
  const ref = repoOf(req.page?.url) ?? repoOf(req.tour?.repo);
  if (!deps.repoFiles || !ref || !isRepoCodeQuestion(req.question)) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => (timer = setTimeout(() => resolve(null), REPO_FILES_MS)));
  try {
    return await Promise.race([deps.repoFiles(ref.owner, ref.repo, req.question).catch(() => null), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function* streamTutor(deps: TutorDeps, req: TutorRequest, signal?: AbortSignal): AsyncGenerator<TutorEvent> {
  const history = trimHistory(req.history);
  const chat = smallTalk(req.question);
  if (chat) {
    yield { type: 'sources', weak: false, sources: [] };
    yield { type: 'delta', text: chat };
    yield { type: 'done', usage: null, truncated: false, unverifiedFlags: [], instant: true };
    return;
  }
  const saved = deps.faq?.match(req.question, history);
  if (saved) {
    yield { type: 'sources', weak: false, sources: saved.sources };
    yield { type: 'delta', text: saved.answer };
    yield { type: 'done', usage: null, truncated: false, unverifiedFlags: [], instant: true };
    return;
  }
  // questions about the open page need the page, not six Git references: a lighter prompt answers sooner
  const repoFiles = await lookUpRepoFiles(deps, req);
  const aboutPage = Boolean(repoFiles) || Boolean(req.page) &&/(this|here|page|file|repo|repository|project|explain|summar\w*|overview|about)/i.test(req.question);
  const chunks = deps.retrieve(searchText(req.question, history), aboutPage ? 3 : 6);
  const weak = (chunks[0]?.score ?? 0) < WEAK_SCORE;
  yield {
    type: 'sources',
    weak,
    sources: chunks.map((c, i) => ({ n: i + 1, title: c.title, headingPath: c.headingPath, sourceFile: c.sourceFile, sourceUrl: c.sourceUrl, license: c.license })),
  };
  if (repoFiles) yield { type: 'files', repo: repoFiles.repo, files: repoFiles.files.map((f) => ({ path: f.path, url: f.url })) };
  const request = {
    kind: 'tutor' as const,
    messages: tutorMessages(req.question, history, chunks, weak, req.page, undefined, req.tour, repoFiles),
    ...(isShortQuestion(req.question) || aboutPage ? { reasoningEffort: 'none' as const } : {}),
    firstTokenMs: FIRST_TOKEN_MS,
    totalMs: TUTOR_DEADLINE_MS + 45_000,
    ...(signal ? { signal } : {}),
  };
  let answer = '';
  const deadline = Date.now() + TUTOR_DEADLINE_MS;
  let started = false;
  try {
  for await (const ev of streamWithEarlyRetry(deps.provider, request, deadline)) {
    if (ev.type === 'delta') started = true;
    if (ev.type === 'delta') {
      answer += ev.text;
      yield ev;
    } else {
      const action = parseAction(answer);
      if (action) yield { type: 'action', action };
      yield { type: 'done', usage: ev.result.usage, truncated: ev.result.truncated, unverifiedFlags: unverifiedFlags(answer, chunks.map((c) => c.text)) };
    }
  }
  } catch (e) {
    // the model is busy or down: say so quickly, and offer the closest saved answer if there is one
    if (started || !(e instanceof KittyError) || !['timeout', 'upstream_unavailable', 'upstream_error'].includes(e.code) || signal?.aborted) throw e;
    const near = deps.faq?.closest(req.question);
    if (!near) throw new KittyError(e.code, 'BharatCode, the AI model behind Kitty, is busy and did not answer in time.');
    yield { type: 'delta', text: `_The AI model is busy right now, so here is Kitty's saved answer to a similar question ("${near.questions[0]}"):_\n\n${near.answer}` };
    yield { type: 'done', usage: null, truncated: false, unverifiedFlags: [], instant: true };
  }
}
