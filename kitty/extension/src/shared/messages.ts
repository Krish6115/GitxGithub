// Port protocol between the content script and the service worker for starting a tour.

export const TOUR_PORT = 'kitty-tour';

/** `issue`: build a walkthrough for fixing that issue. `login`: the signed-in GitHub user (for fork commands). */
export type TourPortRequest = { type: 'start'; owner: string; repo: string; issue?: number; login?: string };

/** One-shot JSON calls the content script asks the service worker to make (content scripts can't call the server). */
export const API_PATHS = ['/issues', '/preflight'] as const;
export type ApiPath = (typeof API_PATHS)[number];
export type ApiMessage = { type: 'api'; path: ApiPath; body: unknown };
export type ApiReply<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

export type TourPortEvent =
  | { type: 'progress'; stage: string; message: string }
  | { type: 'first-step' } // step 1 is in chrome.storage.session; the rest is still streaming
  | { type: 'done' } // the tour was saved to chrome.storage.session
  | { type: 'error'; code: string; message: string };

/** Friendly text for server error codes. */
export function errorText(code: string, fallback: string): string {
  switch (code) {
    case 'subscription_required':
      return 'This BharatCode account needs an active subscription. Check your plan, or add a different key in Kitty settings.';
    case 'key_required':
      return 'Kitty needs a BharatCode key. Add one in Kitty settings (side panel).';
    case 'auth_failed':
      return 'The BharatCode key was rejected. Check it in Kitty settings.';
    case 'rate_limited':
      return 'Too many tours right now. Wait a minute, or add your own key in Kitty settings.';
    case 'github_rate_limited':
      return 'GitHub rate limit reached. Add a GitHub token in Kitty settings, or try again later.';
    case 'github_not_found':
      return 'Kitty could not find this repository (private repos need a GitHub token).';
    case 'timeout':
    case 'upstream_unavailable':
    case 'reasoning_budget_exhausted':
    case 'invalid_model_output':
      return `${fallback} Try again in a moment.`;
    case 'network':
      return 'Kitty could not reach its server. Is it running? (Check the server URL in settings.)';
    default:
      return fallback || 'Something went wrong.';
  }
}

/** chrome.storage.session key for the side panel's active tab ("tour" | "chat" | "settings"). */
export const SIDEPANEL_TAB_KEY = 'kitty:sidepanel-tab';
export type OpenChatMessage = { type: 'open-chat' };

export const EXPLAIN_PORT = 'kitty-explain';
export type ExplainPortRequest = { type: 'start'; text: string; page: { url: string; pageType: string } };
export type ExplainPortEvent =
  | { type: 'meta'; kind: 'command' | 'diff' | 'prose' | 'code'; risk: 'safe' | 'rewrites_history' | 'can_lose_work' | null; truncated: boolean }
  | { type: 'sources'; sources: import('./chat').ChatSource[] }
  | { type: 'delta'; text: string }
  | { type: 'done'; unverifiedFlags: string[]; truncated: boolean }
  | { type: 'error'; code: string; message: string };
/** Sent by the service worker when the user picks "Ask Kitty about this" in the right-click menu. */
export type ExplainSelectionMessage = { type: 'explain-selection'; text: string };
/** chrome.storage.session key: text to pre-fill in the side panel chat ("Ask a follow-up"). */
export const CHAT_DRAFT_KEY = 'kitty:chat-draft';
