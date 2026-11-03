// The page side of chat actions: the side panel navigated this tab and left an action in session storage; when the
// page it was meant for loads, run it once.
import { useEffect } from 'preact/hooks';
import { PENDING_ACTION_KEY, pendingFor, type PageAction, type PendingAction } from '../shared/actions';

export function usePendingAction(href: string, run: (a: PageAction) => void): void {
  useEffect(() => {
    void chrome.storage.session.get(PENDING_ACTION_KEY).then((r) => {
      const action = pendingFor(r[PENDING_ACTION_KEY] as PendingAction | undefined, href);
      if (!action) return;
      void chrome.storage.session.remove(PENDING_ACTION_KEY);
      run(action);
    });
  }, [href]);
}

/** The issue's title and description from the page (GitHub renders them a moment after load). */
export async function issueText(n: number): Promise<string> {
  const pick = (sels: string[]): string => sels.map((q) => document.querySelector<HTMLElement>(q)?.innerText?.trim() ?? '').find(Boolean) ?? '';
  for (let i = 0; i < 25; i++) {
    const title = pick(['[data-testid="issue-title"]', 'bdi.js-issue-title', 'h1 bdi', 'h1']);
    const body = pick(['[data-testid="issue-body"] .markdown-body', '[data-testid="issue-body"]', '.js-comment-body', '.markdown-body']);
    if (title && body) return [`GitHub issue #${n}: ${title}`, '', body].join('\n').slice(0, 4000);
    await new Promise((r) => setTimeout(r, 200));
  }
  return `GitHub issue #${n}: ${document.title}`;
}
