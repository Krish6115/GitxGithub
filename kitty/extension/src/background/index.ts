// Service worker: the only part of Kitty that talks to the Kitty server (keys never reach page context).
import { ApiError, postJson, postStream } from '../shared/api';
import { API_PATHS, EXPLAIN_PORT, SIDEPANEL_TAB_KEY, TOUR_PORT, type ApiMessage, type ExplainPortEvent, type ExplainPortRequest, type ExplainSelectionMessage, type OpenChatMessage, type TourPortEvent, type TourPortRequest } from '../shared/messages';
import { getSettings } from '../shared/settings';
import { readSse } from '../shared/sse';
import { finishState, streamingState, upsertStep, TOUR_STATE_KEY, type TourResult, type TourStart, type TourState, type TourStep } from '../shared/tour';

chrome.runtime.onInstalled.addListener((details) => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  // first install: open the welcome screen (the side panel page) in a tab
  if (details.reason === 'install') void chrome.tabs.create({ url: chrome.runtime.getURL('src/sidepanel/index.html?welcome') });
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
      body: JSON.stringify({ owner: req.owner, repo: req.repo, ...(req.issue ? { issue: req.issue } : {}), ...(req.pr ? { pr: req.pr } : {}) }),
      signal,
    });
  } catch {
    return send({ type: 'error', code: 'network', message: 'Could not reach the Kitty server.' });
  }
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    return send({ type: 'error', code: err.code ?? 'upstream_error', message: err.message ?? `Server returned HTTP ${res.status}.` });
  }
  const loadTour = async (): Promise<TourState | null> => ((await chrome.storage.session.get(TOUR_STATE_KEY))[TOUR_STATE_KEY] as TourState | undefined) ?? null;
  let start: TourStart | null = null;
  // Chrome stops an idle service worker after ~30s; calling an extension API keeps it alive while the tour streams
  const keepAlive = setInterval(() => void chrome.runtime.getPlatformInfo(), 20_000);
  try {
  for await (const ev of readSse(res.body)) {
    if (ev.event === 'start') {
      start = JSON.parse(ev.data) as TourStart;
      // repo tours arrive with every step planned: open step 1 right away
      if (start.draft?.length) {
        await chrome.storage.session.set({ [TOUR_STATE_KEY]: streamingState(start, start.draft.map((d) => ({ ...d, draft: true })), req.login) });
        send({ type: 'first-step' });
      }
    } else if (ev.event === 'step' && start) {
      const { step } = JSON.parse(ev.data) as { index: number; step: TourStep };
      const cur = await loadTour();
      if (cur?.streaming && cur.sha === start.sha) {
        await chrome.storage.session.set({ [TOUR_STATE_KEY]: upsertStep(cur, step) });
      } else if (!start.draft?.length) {
        // issue walkthroughs: the first step the model writes opens the tour
        await chrome.storage.session.set({ [TOUR_STATE_KEY]: streamingState(start, [step], req.login) });
        send({ type: 'first-step' });
      }
    } else if (ev.event === 'progress') {
      const p = JSON.parse(ev.data) as { stage: string; message: string };
      send({ type: 'progress', stage: p.stage, message: p.message });
    } else if (ev.event === 'ping') {
      send({ type: 'progress', stage: 'ping', message: '' }); // keeps the worker and the port alive
    } else if (ev.event === 'result') {
      const result = JSON.parse(ev.data) as TourResult;
      await chrome.storage.session.set({ [TOUR_STATE_KEY]: finishState(await loadTour(), result, req.login) });
      return send({ type: 'done' });
    } else if (ev.event === 'error') {
      const e = JSON.parse(ev.data) as { code: string; message: string };
      // keep the steps that already arrived, just stop waiting for more
      const cur = await loadTour();
      if (cur?.streaming) await chrome.storage.session.set({ [TOUR_STATE_KEY]: { ...cur, streaming: false } });
      return send({ type: 'error', code: e.code, message: e.message });
    }
  }
  } finally {
    clearInterval(keepAlive);
  }
  send({ type: 'error', code: 'upstream_error', message: 'The server closed the connection early.' });
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== TOUR_PORT) return;
  const abort = new AbortController();
  let started = false; // after step 1 the page navigates to it, which disconnects the port: keep streaming
  port.onDisconnect.addListener(() => started || abort.abort());
  port.onMessage.addListener((msg: TourPortRequest) => {
    if (msg.type !== 'start') return;
    const send = (e: TourPortEvent): void => {
      if (e.type === 'first-step') started = true;
      try {
        port.postMessage(e);
      } catch {
        if (!started) abort.abort(); // tab closed or navigated away before step 1; after it, keep streaming
      }
    };
    void runTour(msg, send, abort.signal);
  });
});

// Good first issues and PR pre-flight: one-shot JSON calls on behalf of the content script.
chrome.runtime.onMessage.addListener((msg: ApiMessage, _sender, sendResponse) => {
  if (msg?.type !== 'api' || !(API_PATHS as readonly string[]).includes(msg.path)) return false;
  postJson(msg.path, msg.body)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((e: unknown) => sendResponse({ ok: false, code: e instanceof ApiError ? e.code : 'upstream_error', message: e instanceof Error ? e.message : 'Something went wrong.' }));
  return true; // async response
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
    postStream(msg.ci ? '/ci-explain' : '/explain', msg.ci ?? { text: msg.text, page: msg.page }, (event, data) => {
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
