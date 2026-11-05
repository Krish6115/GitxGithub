// Speech bubbles for "Show me how" walkthroughs: the step being shown (or a link to the page it lives on), and the
// list of walkthroughs to pick from in the cat's menu.
import { guidesFor, type Guide } from '../shared/guides';
import { Icon } from '../shared/Icon';
import type { useGuide } from './useGuide';

type G = ReturnType<typeof useGuide>;

export function GuideBubble({ g }: { g: G }) {
  const { guide, step, state, view } = g;
  if (!guide || !step || !state) return null;
  const n = state.index;
  const last = n === guide.steps.length - 1;
  return (
    <div class="bubble tour" data-kitty="guide-step">
      <div class="meta"><span class="badge">Show me how</span> {guide.title} · step {n + 1} of {guide.steps.length}</div>
      <h3>{step.title}</h3>
      <p>{step.body}</p>
      {view?.kind === 'elsewhere' && <p class="hint">This step is on another page.</p>}
      {view?.kind === 'here' && view.missing && <p class="hint" data-kitty="guide-missing">I can't find it on this page. It may need you to sign in, or only appear in some repositories.</p>}
      <div class="row">
        <button class="ghost" disabled={n === 0} onClick={() => g.goTo(n - 1)}>Back</button>
        {view?.kind === 'elsewhere' ? (
          <button data-kitty="guide-go" onClick={() => location.assign(view.url)}>Take me there</button>
        ) : last ? (
          <button onClick={g.exit}>Finish</button>
        ) : (
          <button data-kitty="guide-next" onClick={() => g.goTo(n + 1)}>Next</button>
        )}
        <button class="ghost" onClick={g.exit}>Exit</button>
      </div>
    </div>
  );
}

export function GuidesMenu({ isPr, onPick, onClose }: { isPr: boolean; onPick: (guide: Guide) => void; onClose: () => void }) {
  return (
    <div class="bubble panel" data-kitty="guides">
      <h3>Show me how</h3>
      <p class="hint">I'll walk you through GitHub's own pages and point at each button.</p>
      <ul class="guide-list">
        {guidesFor(isPr).map((g) => (
          <li key={g.id}>
            <button class="ghost" data-guide={g.id} onClick={() => onPick(g)}><Icon name="arrow-right" size={12} /> {g.title}</button>
          </li>
        ))}
      </ul>
      <div class="row"><button class="ghost" onClick={onClose}>Close</button></div>
    </div>
  );
}
