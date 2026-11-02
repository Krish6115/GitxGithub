// Content-side "Explain this" state: tracks the page selection (for the pill), runs explanations through the
// service worker, and answers right-click menu requests.
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { ChatSource } from '../shared/chat';
import { errorText, EXPLAIN_PORT, type ExplainPortEvent, type ExplainSelectionMessage } from '../shared/messages';
import { pageTypeFromUrl } from '../shared/page-type';
import { getSettings } from '../shared/settings';
import { isEditable, shouldOffer, type Rect } from './selection';

export interface Explanation {
  text: string;
  rect: Rect | null;
  kind?: 'command' | 'diff' | 'prose' | 'code';
  risk?: 'safe' | 'rewrites_history' | 'can_lose_work' | null;
  selectionCut?: boolean;
  sources: ChatSource[];
  answer: string;
  status: 'streaming' | 'done' | 'error';
  error?: string;
  unverifiedFlags: string[];
}

const toRect = (r: DOMRect): Rect => ({ top: r.top, left: r.left, right: r.right, bottom: r.bottom });

/** The last line of the selection that is on screen (long selections run past the viewport). */
function visibleEnd(range: Range): Rect {
  const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.bottom > 0 && r.top < window.innerHeight);
  const last = rects[rects.length - 1];
  return toRect(last ?? range.getBoundingClientRect());
}

export function useExplain(hostId: string) {
  const [offer, setOffer] = useState<{ text: string; rect: Rect } | null>(null);
  const [current, setCurrent] = useState<Explanation | null>(null);
  const [pillEnabled, setPillEnabled] = useState(true);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    void getSettings().then((s) => setPillEnabled(s.explainPill !== false));
    const onStorage = (c: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'local' && c['kitty:settings']) void getSettings().then((s) => setPillEnabled(s.explainPill !== false));
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, []);

  // Watch the selection (debounced) to offer the pill.
  useEffect(() => {
    let timer = 0;
    const check = (): void => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        const sel = document.getSelection();
        const text = sel?.toString() ?? '';
        const inKitty = Boolean(sel?.anchorNode && document.getElementById(hostId)?.contains(sel.anchorNode));
        if (!sel || sel.rangeCount === 0 || !shouldOffer(text, isEditable(sel.anchorNode), inKitty)) return setOffer(null);
        setOffer({ text: text.trim(), rect: visibleEnd(sel.getRangeAt(0)) });
      }, 180);
    };
    // On scroll, hide immediately and re-place the pill once scrolling settles (it follows the selection).
    const onScroll = (): void => {
      setOffer(null);
      check();
    };
    document.addEventListener('selectionchange', check);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener('selectionchange', check);
      window.removeEventListener('scroll', onScroll);
    };
  }, [hostId]);

  const close = useCallback(() => {
    portRef.current?.disconnect();
    portRef.current = null;
    setCurrent(null);
  }, []);

  const explain = useCallback((text: string, rect: Rect | null) => {
    portRef.current?.disconnect();
    setOffer(null);
    const port = chrome.runtime.connect({ name: EXPLAIN_PORT });
    portRef.current = port;
    setCurrent({ text, rect, sources: [], answer: '', status: 'streaming', unverifiedFlags: [] });
    const update = (f: (e: Explanation) => Explanation): void => setCurrent((c) => (c ? f(c) : c));
    port.onMessage.addListener((e: ExplainPortEvent) => {
      if (e.type === 'meta') update((c) => ({ ...c, kind: e.kind, risk: e.risk, selectionCut: e.truncated }));
      else if (e.type === 'sources') update((c) => ({ ...c, sources: e.sources }));
      else if (e.type === 'delta') update((c) => ({ ...c, answer: c.answer + e.text }));
      else if (e.type === 'done') update((c) => ({ ...c, status: 'done', unverifiedFlags: e.unverifiedFlags }));
      else update((c) => ({ ...c, status: 'error', error: errorText(e.code, e.message) }));
    });
    port.postMessage({ type: 'start', text, page: { url: location.href, pageType: pageTypeFromUrl(location.href) } });
  }, []);

  // Right-click menu: explain the selection the browser reports (use the live selection's position when it matches).
  useEffect(() => {
    const onMessage = (msg: ExplainSelectionMessage): void => {
      if (msg?.type !== 'explain-selection') return;
      const sel = document.getSelection();
      const rect = sel && sel.rangeCount > 0 && sel.toString().trim() === msg.text.trim() ? toRect(sel.getRangeAt(0).getBoundingClientRect()) : null;
      explain(msg.text.trim(), rect);
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [explain]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      setOffer(null);
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return { offer: pillEnabled ? offer : null, current, explain, close };
}
