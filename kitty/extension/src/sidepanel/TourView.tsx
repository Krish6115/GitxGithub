// The running repo tour, shown at the top of the chat: summary, stack, clickable steps (open or ask about each),
// how to run / contribute, tips.
import { stepUrl } from '../shared/github-page';
import { TOUR_STATE_KEY, withIndex, type TourState } from '../shared/tour';

export async function openStep(state: TourState, i: number): Promise<void> {
  const next = withIndex(state, i);
  await chrome.storage.session.set({ [TOUR_STATE_KEY]: next });
  const step = next.steps[next.currentIndex];
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id !== undefined && step) await chrome.tabs.update(tab.id, { url: stepUrl(next, next.sha, step.path) });
}

export function TourPanel({ state, onAsk }: { state: TourState; onAsk: (index: number) => void }) {
  const { tour, meta } = state.result;
  const n = state.currentIndex;
  return (
    <details class="tour-panel" data-kitty="tour-panel">
      <summary>
        🗺️ Tour of <strong>{meta.owner}/{meta.repo}</strong> · step {n + 1} of {state.steps.length}
      </summary>
      {meta.partial && <p class="badge">Large repo: partial tour (GitHub returned only part of the file list).</p>}
      <p>{tour.summary}</p>
      {tour.stack.length > 0 && <p class="stack">{tour.stack.map((s) => <span key={s}>{s}</span>)}</p>}
      <ol class="steps">
        {tour.steps.map((s, i) => (
          <li key={s.path} class={i === n ? 'current' : ''}>
            <button class="step" title="Open this file" onClick={() => void openStep(state, i)}>
              <strong>{s.title}</strong>
              <code>{s.path}</code>
            </button>
            <button class="ask-step ghost" title="Ask about this step" onClick={() => onAsk(i)}>Ask</button>
          </li>
        ))}
      </ol>
      <details>
        <summary>How to run</summary>
        <p class="pre">{tour.how_to_run}</p>
      </details>
      <details>
        <summary>How to contribute</summary>
        <p class="pre">{tour.how_to_contribute}</p>
        {tour.good_first_issue_tips.length > 0 && <ul>{tour.good_first_issue_tips.map((t) => <li key={t}>{t}</li>)}</ul>}
      </details>
      <p class="muted small">Commit {meta.sha.slice(0, 7)} · {meta.provider}{meta.cached ? ' · cached' : ''}</p>
    </details>
  );
}
