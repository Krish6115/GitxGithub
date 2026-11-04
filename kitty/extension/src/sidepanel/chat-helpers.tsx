// Side panel chat helpers: what's on the active tab, the "thinking" timer, and sending the cat to a page.
import { useEffect, useState } from 'preact/hooks';
import { actionUrl, PENDING_ACTION_KEY, type PageAction, type PendingAction } from '../shared/actions';
import type { PageContext, PageContextRequest } from '../shared/page-context';

/** Ask the content script in the active tab what's on screen (null when it isn't a GitHub page). */
export async function activePageContext(): Promise<PageContext | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.id === undefined) return null;
    const msg: PageContextRequest = { type: 'get-page-context' };
    const ctx = (await chrome.tabs.sendMessage(tab.id, msg)) as PageContext | undefined;
    return ctx?.url ? ctx : null;
  } catch {
    return null; // no Kitty content script there (not github.com, or the tab is still loading)
  }
}

/** "Kitty is thinking (12s)", and after 15s an honest note that the AI model is slow right now. */
export function Thinking() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <p class="thinking">Kitty is thinking{s >= 3 ? ` (${s}s)` : ''}</p>
      {s >= 15 && <p class="muted small" data-kitty="slow">The AI model is slow right now. Kitty gives up after about 45 seconds and tells you.</p>}
    </>
  );
}

/** Send the active tab to the action's page; the cat there picks the action up and runs it. */
export async function runOnPage(action: PageAction): Promise<void> {
  const url = actionUrl(action);
  const pending: PendingAction = { action, url, at: Date.now() };
  await chrome.storage.session.set({ [PENDING_ACTION_KEY]: pending });
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id !== undefined) await chrome.tabs.update(tab.id, { url });
  else await chrome.tabs.create({ url });
}
