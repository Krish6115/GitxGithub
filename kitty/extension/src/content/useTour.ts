// Content-side tour controller: loads/saves the tour in chrome.storage.session, follows GitHub navigation
// (turbo:load, popstate and URL changes), keeps the current step in sync with the page, and starts new tours.
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { pathFromUrl, repoFromUrl, signedInLogin, stepUrl } from '../shared/github-page';
import { errorText, TOUR_PORT, type TourPortEvent } from '../shared/messages';
import { syncToPath, TOUR_STATE_KEY, withIndex, type TourState } from '../shared/tour';

export type Phase = { kind: 'idle' } | { kind: 'loading'; message: string } | { kind: 'error'; message: string };

const load = async (): Promise<TourState | null> => ((await chrome.storage.session.get(TOUR_STATE_KEY))[TOUR_STATE_KEY] as TourState | undefined) ?? null;
const save = (s: TourState | null): Promise<void> =>
  s ? chrome.storage.session.set({ [TOUR_STATE_KEY]: s }) : chrome.storage.session.remove(TOUR_STATE_KEY);

/** Fires `cb` whenever GitHub changes the page without a full reload. */
function useUrl(): string {
  const [href, setHref] = useState(location.href);
  useEffect(() => {
    const check = (): void => setHref(location.href);
    document.addEventListener('turbo:load', check);
    window.addEventListener('popstate', check);
    const poll = setInterval(check, 400); // GitHub's React views use pushState, which fires no event here
    return () => {
      document.removeEventListener('turbo:load', check);
      window.removeEventListener('popstate', check);
      clearInterval(poll);
    };
  }, []);
  return href;
}

export function useTour() {
  const href = useUrl();
  const [tour, setTour] = useState<TourState | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    void load().then(setTour);
    const onChange = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'session' && TOUR_STATE_KEY in changes) setTour((changes[TOUR_STATE_KEY]?.newValue as TourState | undefined) ?? null);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  // Back/forward or a manual click onto another tour file: that step becomes current.
  useEffect(() => {
    if (!tour) return;
    const synced = syncToPath(tour, pathFromUrl(href, tour, tour.sha));
    if (synced !== tour) void save(synced);
  }, [href, tour]);

  const repo = repoFromUrl(href);
  const onTourRepo = Boolean(tour && repo && repo.owner.toLowerCase() === tour.owner.toLowerCase() && repo.repo.toLowerCase() === tour.repo.toLowerCase());
  const currentPath = tour ? pathFromUrl(href, tour, tour.sha) : null;
  const atCurrentStep = Boolean(tour && currentPath === tour.steps[tour.currentIndex]?.path);

  const goTo = useCallback(async (i: number) => {
    if (!tour) return;
    const next = withIndex(tour, i);
    await save(next);
    const step = next.steps[next.currentIndex];
    if (step) location.assign(stepUrl(next, next.sha, step.path));
  }, [tour]);

  const exit = useCallback(async () => {
    await save(null);
    setPhase({ kind: 'idle' });
  }, []);

  /** Start a general tour, a walkthrough of the files to change for `issue`, or a tour of `pr`'s changed files. */
  const start = useCallback((issue?: number, pr?: number) => {
    if (!repo) return;
    portRef.current?.disconnect();
    const port = chrome.runtime.connect({ name: TOUR_PORT });
    portRef.current = port;
    setPhase({ kind: 'loading', message: issue ? `Kitty is reading issue #${issue}…` : pr ? `Kitty is reading pull request #${pr}…` : 'Kitty is getting ready…' });
    let opened = false;
    port.onMessage.addListener((e: TourPortEvent) => {
      if (e.type === 'progress' && e.stage !== 'ping') setPhase({ kind: 'loading', message: e.message });
      else if (e.type === 'error') setPhase({ kind: 'error', message: errorText(e.code, e.message) });
      else if (e.type === 'first-step' || e.type === 'done') {
        // step 1 is ready (the rest may still be streaming): open it; the service worker keeps going
        setPhase({ kind: 'idle' });
        port.disconnect();
        if (opened) return;
        opened = true;
        void load().then((t) => {
          const first = t?.steps[0];
          if (t && first) location.assign(stepUrl(t, t.sha, first.path));
        });
      }
    });
    const login = signedInLogin();
    port.postMessage({ type: 'start', owner: repo.owner, repo: repo.repo, ...(issue ? { issue } : {}), ...(pr ? { pr } : {}), ...(login ? { login } : {}) });
  }, [repo?.owner, repo?.repo]);

  return { href, repo, tour, phase, setPhase, onTourRepo, atCurrentStep, goTo, exit, start };
}
