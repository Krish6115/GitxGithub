// Chat -> cat actions (mirror of the server's tutor/actions.ts) and the hand-off to the page:
// the side panel navigates the tab and leaves a pending action; the content script on that page carries it out.

export type KittyAction =
  | { type: 'find_issues'; query: string; repo?: string }
  | { type: 'tour'; repo: string }
  | { type: 'explain_issue'; repo: string; number: number }
  | { type: 'fix_issue'; repo: string; number: number }
  | { type: 'check_pr'; repo: string; number: number };

export type PageAction = Exclude<KittyAction, { type: 'find_issues' }>;

/** chrome.storage.session key: the action the page should run after the side panel navigated it. */
export const PENDING_ACTION_KEY = 'kitty:pending-action';
export interface PendingAction {
  action: PageAction;
  url: string;
  at: number;
}
/** A pending action older than this is stale (the page never loaded, or the user went elsewhere). */
export const PENDING_TTL_MS = 90_000;

export function actionUrl(a: PageAction): string {
  const base = `https://github.com/${a.repo}`;
  if (a.type === 'tour') return base;
  if (a.type === 'check_pr') return `${base}/pull/${a.number}`;
  return `${base}/issues/${a.number}`;
}

/** Does this pending action belong to the page at `href`? */
export function pendingFor(p: PendingAction | undefined | null, href: string, now = Date.now()): PageAction | null {
  if (!p || now - p.at > PENDING_TTL_MS) return null;
  const path = (u: string): string => new URL(u).pathname.replace(/\/+$/, '').toLowerCase();
  try {
    return path(p.url) === path(href) ? p.action : null;
  } catch {
    return null;
  }
}

/** Short label for the chat card, e.g. "Explaining cli/cli#42". */
export function actionLabel(a: KittyAction): string {
  switch (a.type) {
    case 'find_issues':
      return `Searching for "${a.query}" issues${a.repo ? ` in ${a.repo}` : ''}`;
    case 'tour':
      return `Touring ${a.repo}`;
    case 'explain_issue':
      return `Explaining ${a.repo}#${a.number}`;
    case 'fix_issue':
      return `Walking through ${a.repo}#${a.number}`;
    case 'check_pr':
      return `Checking PR ${a.repo}#${a.number}`;
  }
}

/** Remove the machine-readable ACTION line from an answer before showing it. */
export const stripAction = (text: string): string => text.replace(/^\s*ACTION:\s*\{.*\}\s*$/gm, '').trim();
