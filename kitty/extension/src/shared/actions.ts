// Chat -> cat actions (mirror of the server's tutor/actions.ts) and the hand-off to the page:
// the side panel navigates the tab and leaves a pending action; the content script on that page carries it out.

export type KittyAction =
  | { type: 'find_issues'; query: string; repo?: string }
  | { type: 'tour'; repo: string }
  | { type: 'explain_issue'; repo: string; number: number }
  | { type: 'fix_issue'; repo: string; number: number }
  | { type: 'check_pr'; repo: string; number: number }
  /** Walk through GitHub's own pages ("show me how to open a pull request"). */
  | { type: 'guide'; repo: string; guide: string; number?: number }
  /** Hand over to GitHub Copilot: Kitty types the prompt into Copilot's chat; the user sends it. */
  | { type: 'copilot'; prompt: string };

export type PageAction = Exclude<KittyAction, { type: 'find_issues' } | { type: 'copilot' }>;

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
  if (a.type === 'guide') return a.number ? `${base}/pull/${a.number}` : base;
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
    case 'guide':
      return `Showing you around ${a.repo}`;
    case 'copilot':
      return 'This is a job for GitHub Copilot';
  }
}

/** Remove the machine-readable ACTION line from an answer before showing it. */
export const stripAction = (text: string): string => text.replace(/^\s*ACTION:\s*\{.*\}\s*$/gm, '').trim();

/** "…and take me there", "open it", "go to it": the user wants Kitty to open the best match, not just list it. */
export const wantsToGo = (question: string): boolean =>
  /\b(take me|bring me|go to|open (it|one|the|that)|show me (it|one|the|that)|directly|straight to|navigate)\b/i.test(question);
