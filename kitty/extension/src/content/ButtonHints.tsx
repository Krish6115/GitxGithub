// Hover a GitHub button that runs Git for you (Sync fork, Squash and merge, Update branch…) and Kitty shows what it
// does in Git terms, with a risk label. Can be turned off in Settings.
import { useEffect, useState } from 'preact/hooks';
import { hintFor, type ButtonHint } from '../shared/github-buttons';
import { getSettings } from '../shared/settings';

const RISK: Record<ButtonHint['risk'], { label: string; cls: string }> = {
  safe: { label: 'Safe', cls: 'risk-safe' },
  rewrites_history: { label: 'Rewrites history', cls: 'risk-rewrite' },
  can_lose_work: { label: 'Can lose work', cls: 'risk-danger' },
};
const DELAY_MS = 600;

/** The button-like element under the pointer and its visible text. */
function buttonAt(target: EventTarget | null): { el: Element; text: string } | null {
  const el = target instanceof Element ? target.closest('button, summary, a[role="button"], a.btn, input[type="submit"]') : null;
  if (!el || el.closest('#kitty-root')) return null;
  const text = el instanceof HTMLInputElement ? el.value : (el.textContent ?? '');
  return { el, text };
}

export function ButtonHints() {
  const [enabled, setEnabled] = useState(true);
  const [shown, setShown] = useState<{ hint: ButtonHint; top: number; left: number } | null>(null);
  useEffect(() => {
    void getSettings().then((s) => setEnabled(s.explainButtons !== false));
    const onStorage = (c: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'local' && c['kitty:settings']) void getSettings().then((s) => setEnabled(s.explainButtons !== false));
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, []);

  useEffect(() => {
    if (!enabled) return setShown(null);
    let timer = 0;
    let current: Element | null = null;
    const onOver = (e: MouseEvent): void => {
      const b = buttonAt(e.target);
      if (b?.el === current) return;
      current = b?.el ?? null;
      clearTimeout(timer);
      if (!b) return;
      const hint = hintFor(b.text, location.href);
      if (!hint) return setShown(null);
      timer = window.setTimeout(() => {
        const r = b.el.getBoundingClientRect();
        const width = 340;
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, r.left));
        const below = r.bottom + 8 + 260 < window.innerHeight;
        setShown({ hint, left, top: below ? r.bottom + 8 : Math.max(8, r.top - 268) });
      }, DELAY_MS);
    };
    const hide = (): void => {
      clearTimeout(timer);
      current = null;
      setShown(null);
    };
    const onOut = (e: MouseEvent): void => {
      if (!buttonAt(e.relatedTarget) || buttonAt(e.relatedTarget)?.el !== current) hide();
    };
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    window.addEventListener('scroll', hide, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
      window.removeEventListener('scroll', hide);
    };
  }, [enabled]);

  if (!shown) return null;
  const { hint } = shown;
  return (
    <div class="bubble button-hint" data-kitty="button-hint" role="tooltip" style={{ top: `${Math.round(shown.top)}px`, left: `${Math.round(shown.left)}px` }}>
      <div class="meta">
        <span>🐾 What "{hint.title}" does</span>
        <span class={`risk ${RISK[hint.risk].cls}`}>{RISK[hint.risk].label}</span>
      </div>
      <p>{hint.what}</p>
      <p class="small"><strong>In Git terms:</strong></p>
      <pre><code>{hint.git.join('\n')}</code></pre>
      {hint.note && <p class="hint">{hint.note}</p>}
    </div>
  );
}
