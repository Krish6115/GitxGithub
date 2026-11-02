// Side panel tour overview: summary, stack, clickable steps, how to run / contribute, tips.
import { useEffect, useState } from 'preact/hooks';
import { stepUrl } from '../shared/github-page';
import { TOUR_STATE_KEY, withIndex, type TourState } from '../shared/tour';

async function openStep(state: TourState, i: number): Promise<void> {
  const next = withIndex(state, i);
  await chrome.storage.session.set({ [TOUR_STATE_KEY]: next });
  const step = next.steps[next.currentIndex];
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id !== undefined && step) await chrome.tabs.update(tab.id, { url: stepUrl(next, next.sha, step.path) });
}

export function TourView() {
  const [state, setState] = useState<TourState | null>(null);
  useEffect(() => {
    void chrome.storage.session.get(TOUR_STATE_KEY).then((r) => setState((r[TOUR_STATE_KEY] as TourState | undefined) ?? null));
    const onChange = (c: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'session' && TOUR_STATE_KEY in c) setState((c[TOUR_STATE_KEY]?.newValue as TourState | undefined) ?? null);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  if (!state) {
    return <p class="muted">No tour running. Open a repository on github.com, click Kitty and choose “Tour this repo”.</p>;
  }
  const { tour, meta } = state.result;
  return (
    <section>
      <h2>{meta.owner}/{meta.repo}</h2>
      {meta.partial && <p class="badge">Large repo — partial tour (GitHub returned only part of the file list).</p>}
      <p>{tour.summary}</p>
      {tour.stack.length > 0 && <p class="stack">{tour.stack.map((s) => <span key={s}>{s}</span>)}</p>}
      <h3>Steps</h3>
      <ol class="steps">
        {tour.steps.map((s, i) => (
          <li key={s.path} class={i === state.currentIndex ? 'current' : ''}>
            <button onClick={() => void openStep(state, i)}>
              <strong>{s.title}</strong>
              <code>{s.path}</code>
            </button>
          </li>
        ))}
      </ol>
      <h3>How to run</h3>
      <p class="pre">{tour.how_to_run}</p>
      <h3>How to contribute</h3>
      <p class="pre">{tour.how_to_contribute}</p>
      {tour.good_first_issue_tips.length > 0 && (
        <>
          <h3>Good first issue tips</h3>
          <ul>{tour.good_first_issue_tips.map((t) => <li key={t}>{t}</li>)}</ul>
        </>
      )}
      <p class="muted small">Commit {meta.sha.slice(0, 7)} · {meta.provider}{meta.cached ? ' · cached' : ''}</p>
    </section>
  );
}
