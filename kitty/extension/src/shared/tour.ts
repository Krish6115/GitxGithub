// Tour types (mirror of the server's /tour result) and pure tour-state helpers.

export interface TourStep {
  path: string;
  title: string;
  what: string;
  why_it_matters: string;
}

export interface Tour {
  summary: string;
  stack: string[];
  steps: TourStep[];
  how_to_run: string;
  how_to_contribute: string;
  good_first_issue_tips: string[];
}

export interface TourMeta {
  owner: string;
  repo: string;
  sha: string;
  partial: boolean;
  cached: boolean;
  provider: string;
  repaired: boolean;
  droppedSteps: string[];
  unreadableFiles: number;
  defaultBranch?: string;
  /** Set for "Help me fix this issue" walkthroughs. */
  issue?: { number: number; title: string; url: string; labels: string[] };
}

export interface TourResult {
  tour: Tour;
  meta: TourMeta;
}

/** What persists in chrome.storage.session while a tour is running. */
export interface TourState {
  owner: string;
  repo: string;
  sha: string;
  partial: boolean;
  steps: TourStep[];
  currentIndex: number;
  /** Full result, for the side panel overview. */
  result: TourResult;
  /** Signed-in GitHub user when the tour started (for fork commands). */
  login?: string;
  /** The model is still writing: more steps (and the overview) are on the way. */
  streaming?: boolean;
  /** How many steps the server asked for (shown as "step 1 of ~7" while streaming). */
  expectedSteps?: number;
}

/** The server's "start" event: everything needed to open step 1 before the rest of the tour is written. */
export interface TourStart {
  owner: string;
  repo: string;
  sha: string;
  defaultBranch: string;
  partial: boolean;
  expectedSteps: number;
  issue?: { number: number; title: string; url: string; labels: string[] };
}

/** A tour that is still streaming, with its first step. */
export function streamingState(start: TourStart, first: TourStep, login?: string): TourState {
  const result: TourResult = {
    tour: { summary: '', stack: [], steps: [first], how_to_run: '', how_to_contribute: '', good_first_issue_tips: [] },
    meta: {
      owner: start.owner, repo: start.repo, sha: start.sha, partial: start.partial, cached: false, provider: '',
      repaired: false, droppedSteps: [], unreadableFiles: 0, defaultBranch: start.defaultBranch,
      ...(start.issue ? { issue: start.issue } : {}),
    },
  };
  return { ...startState(result, login), streaming: true, expectedSteps: start.expectedSteps };
}

/** Add a newly streamed step (ignored if it is a different tour or the step is already there). */
export function appendStep(s: TourState, step: TourStep): TourState {
  if (!s.streaming || s.steps.some((x) => x.path === step.path)) return s;
  const steps = [...s.steps, step];
  return { ...s, steps, result: { ...s.result, tour: { ...s.result.tour, steps } } };
}

/** The final tour replaces a streaming one; the user stays on the step they are reading. */
export function finishState(prev: TourState | null, result: TourResult, login?: string): TourState {
  const next = startState(result, login);
  if (!prev?.streaming || prev.owner !== next.owner || prev.repo !== next.repo || prev.sha !== next.sha) return next;
  const path = prev.steps[prev.currentIndex]?.path;
  const i = next.steps.findIndex((x) => x.path === path);
  return i >= 0 ? { ...next, currentIndex: i } : next;
}

export const TOUR_STATE_KEY = 'kitty:tour';

export function startState(result: TourResult, login?: string): TourState {
  return {
    ...(login ? { login } : {}),
    owner: result.meta.owner,
    repo: result.meta.repo,
    sha: result.meta.sha,
    partial: result.meta.partial,
    steps: result.tour.steps,
    currentIndex: 0,
    result,
  };
}

export const clampIndex = (s: TourState, i: number): number => Math.max(0, Math.min(s.steps.length - 1, i));
export const withIndex = (s: TourState, i: number): TourState => ({ ...s, currentIndex: clampIndex(s, i) });

/**
 * Keep the tour in sync with the page the user is actually on (e.g. after the browser back button):
 * if the URL shows one of the tour's files, that step becomes current. Otherwise the state is unchanged.
 */
export function syncToPath(s: TourState, path: string | null): TourState {
  if (path === null) return s;
  const i = s.steps.findIndex((st) => st.path === path);
  return i >= 0 && i !== s.currentIndex ? { ...s, currentIndex: i } : s;
}

/** chrome.storage.session key: the tour step the user clicked "Ask" on (the chat attaches it to the next question). */
export const CHAT_FOCUS_KEY = 'kitty:chat-focus';
export type ChatFocus = { kind: 'tour-step'; owner: string; repo: string; index: number };

/** What the tutor gets about the tour: the repo summary and one step. */
export interface TourContextPayload {
  repo: string;
  summary: string;
  stepNumber: number;
  totalSteps: number;
  step: TourStep;
}

export function tourContext(s: TourState, index = s.currentIndex): TourContextPayload | null {
  const i = clampIndex(s, index);
  const step = s.steps[i];
  if (!step) return null;
  return {
    repo: `${s.owner}/${s.repo}`,
    summary: `${s.result.meta.issue ? `Walkthrough for fixing issue #${s.result.meta.issue.number}: ${s.result.meta.issue.title}. ` : ''}${s.result.tour.summary}`.slice(0, 2000),
    stepNumber: i + 1,
    totalSteps: s.steps.length,
    step: { path: step.path, title: step.title, what: step.what, why_it_matters: step.why_it_matters },
  };
}
