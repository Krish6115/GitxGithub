// Port protocol between the content script and the service worker for starting a tour.

export const TOUR_PORT = 'kitty-tour';

export type TourPortRequest = { type: 'start'; owner: string; repo: string };

export type TourPortEvent =
  | { type: 'progress'; stage: string; message: string }
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
