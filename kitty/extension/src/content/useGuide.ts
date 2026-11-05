// Runs a "Show me how" walkthrough on the page: finds the step's real GitHub element, scrolls to it and tracks its
// box (the cat walks there and it gets highlighted), and moves between pages when a step lives elsewhere.
import { useCallback, useEffect, useState } from 'preact/hooks';
import { norm } from '../shared/github-buttons';
import { GUIDE_KEY, guideById, guidePageOf, guidePageUrl, type GuideState, type GuideStep } from '../shared/guides';
import { boxOf, type Box } from './highlight';

const visible = (el: Element): boolean => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};

/** The element a step points at: selectors first, then visible text of links, buttons and tabs. */
export function findGuideTarget(step: GuideStep, doc: Document = document): Element | null {
  for (const sel of step.selectors ?? []) {
    for (const el of doc.querySelectorAll(sel)) if (visible(el) && !el.closest('#kitty-root')) return el;
  }
  if (step.text) {
    for (const el of doc.querySelectorAll('a, button, summary, [role="tab"]')) {
      if (!el.closest('#kitty-root') && step.text.test(norm(el.textContent ?? '')) && visible(el)) return el;
    }
  }
  return null;
}

export type GuideView =
  | { kind: 'here'; box: Box | null; missing: boolean }
  | { kind: 'elsewhere'; url: string };

export function useGuide(href: string) {
  const [state, setState] = useState<GuideState | null>(null);
  const [view, setView] = useState<GuideView | null>(null);

  useEffect(() => {
    void chrome.storage.session.get(GUIDE_KEY).then((r) => setState((r[GUIDE_KEY] as GuideState | undefined) ?? null));
    const onChange = (c: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'session' && GUIDE_KEY in c) setState((c[GUIDE_KEY]?.newValue as GuideState | undefined) ?? null);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const guide = state ? guideById(state.id) : undefined;
  const step = guide?.steps[state?.index ?? 0];

  useEffect(() => {
    if (!state || !step) return setView(null);
    const onPage = guidePageOf(href, state.repo) === step.page;
    if (!onPage) return setView({ kind: 'elsewhere', url: guidePageUrl(step.page, state.repo, state.pr) });
    let el: Element | null = null;
    let raf = 0;
    let scrolled = false;
    const started = Date.now();
    const tick = (): void => {
      if (!el || !el.isConnected) el = findGuideTarget(step);
      if (el && !scrolled) {
        scrolled = true;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      const waiting = !el && Date.now() - started < 6000;
      setView({ kind: 'here', box: el ? boxOf(el) : null, missing: !el && !waiting });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [href, state?.id, state?.index, state?.repo]);

  const save = (s: GuideState | null): Promise<void> => (s ? chrome.storage.session.set({ [GUIDE_KEY]: s }) : chrome.storage.session.remove(GUIDE_KEY));
  const start = useCallback((id: string, repo: string, pr?: number) => void save({ id, repo, index: 0, ...(pr ? { pr } : {}) }), []);
  const exit = useCallback(() => void save(null), []);
  const goTo = useCallback(
    (i: number) => {
      if (!state || !guide) return;
      const index = Math.max(0, Math.min(guide.steps.length - 1, i));
      void save({ ...state, index });
    },
    [state, guide],
  );

  return { state, guide, step, view, start, exit, goTo };
}
