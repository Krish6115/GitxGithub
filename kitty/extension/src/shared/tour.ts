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
}

export const TOUR_STATE_KEY = 'kitty:tour';

export function startState(result: TourResult): TourState {
  return {
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
