// Service worker: the only part of Kitty that talks to the Kitty server (keys never reach page context).
import { ApiError, postStream } from '../shared/api';
import { EXPLAIN_PORT, SIDEPANEL_TAB_KEY, TOUR_PORT, type ExplainPortEvent, type ExplainPortRequest, type ExplainSelectionMessage, type OpenChatMessage, type TourPortEvent, type TourPortRequest } from '../shared/messages';
import { getSettings } from '../shared/settings';
import { readSse } from '../shared/sse';
import { startState, TOUR_STATE_KEY, type TourResult } from '../shared/tour';

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
// Content scripts need to read/write the running tour (storage.session is extension-only by default).
void chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

async function runTour(req: TourPortRequest, send: (e: TourPortEvent) => void, signal: AbortSignal): Promise<void> {
  const settings = await getSettings();
  let res: Response;
  try {
    res = await fetch(`${settings.serverUrl.replace(/\/+$/, '')}/tour`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.kittyKey ? { 'X-Kitty-Key': settings.kittyKey } : {}),
        ...(settings.githubToken ? { 'X-Kitty-GitHub-Token': settings.githubToken } : {}),
      },
      body: JSON.stringify({ owner: req.owner, repo: req.repo }),
      signal,
    });
  } catch {
    return send({ type: 'error', code: 'network', message: 'Could not reach the Kitty server.' });
  }
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    return send({ type: 'error', code: err.code ?? 'upstream_error', message: err.message ?? `Server returned HTTP ${res.status}.` });
  }
  for await (const ev of readSse(res.body)) {
    if (ev.event === 'progress') {
      const p = JSON.parse(ev.data) as { stage: string; message: string };
      send({ type: 'progress', stage: p.stage, message: p.message });
    } else if (ev.event === 'ping') {
      send({ type: 'progress', stage: 'ping', message: '' }); // keeps the worker and the port alive
    } else if (ev.event === 'result') {
      const result = JSON.parse(ev.data) as TourResult;
      await chrome.storage.session.set({ [TOUR_STATE_KEY]: startState(result) });
      return send({ type: 'done' });
    } else if (ev.event === 'error') {
      const e = JSON.parse(ev.data) as { code: string; message: string };
      return send({ type: 'error', code: e.code, message: e.message });
    }
  }
  send({ type: 'error', code: 'upstream_error', message: 'The server closed the connection early.' });
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== TOUR_PORT) return;
  const abort = new AbortController();
  port.onDisconnect.addListener(() => abort.abort());
  port.onMessage.addListener((msg: TourPortRequest) => {
    if (msg.type !== 'start') return;
    const send = (e: TourPortEvent): void => {
      try {
        port.postMessage(e);
      } catch {
        abort.abort(); // tab closed or navigated away
      }
    };
    void runTour(msg, send, abort.signal);
  });
});

// The cat's "Ask Kitty" item: open the side panel on the chat tab. Chrome only allows this right after a user
// gesture; if it refuses, the content script tells the user to click the toolbar icon instead.
chrome.runtime.onMessage.addListener((msg: OpenChatMessage, sender, sendResponse) => {
  if (msg?.type !== 'open-chat' || sender.tab?.id === undefined) return false;
  void chrome.storage.session.set({ [SIDEPANEL_TAB_KEY]: 'chat' });
  chrome.sidePanel
    .open({ tabId: sender.tab.id })
    .then(() => sendResponse({ ok: true }))
    .catch(() => sendResponse({ ok: false }));
  return true; // async response
});

// "Explain this": stream /explain for the content script (content scripts can't call the server directly).
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== EXPLAIN_PORT) return;
  const abort = new AbortController();
  port.onDisconnect.addListener(() => abort.abort());
  port.onMessage.addListener((msg: ExplainPortRequest) => {
    if (msg.type !== 'start') return;
    const send = (e: ExplainPortEvent): void => {
      try {
        port.postMessage(e);
      } catch {
        abort.abort();
      }
    };
    postStream('/explain', { text: msg.text, page: msg.page }, (event, data) => {
      if (event === 'meta' || event === 'sources' || event === 'delta' || event === 'done' || event === 'error') send({ type: event, ...(data as object) } as ExplainPortEvent);
    }, abort.signal).catch((e: unknown) => {
      if (!abort.signal.aborted) send({ type: 'error', code: e instanceof ApiError ? e.code : 'network', message: e instanceof Error ? e.message : 'Request failed.' });
    });
  });
});

// Right-click menu on selected text.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'kitty-explain', title: 'Ask Kitty about this', contexts: ['selection'], documentUrlPatterns: ['https://github.com/*'] });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'kitty-explain' || tab?.id === undefined || !info.selectionText) return;
  const msg: ExplainSelectionMessage = { type: 'explain-selection', text: info.selectionText };
  void chrome.tabs.sendMessage(tab.id, msg);
});
