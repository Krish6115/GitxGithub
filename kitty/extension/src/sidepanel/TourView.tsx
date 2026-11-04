// The running repo tour, shown at the top of the chat: summary, stack, clickable steps (open or ask about each),
// how to run / contribute, tips.
import { useState } from 'preact/hooks';
import { contextPack, contextPackFilename } from '../shared/context-pack';
import { contributionPlan } from '../shared/contribute';
import { stepUrl } from '../shared/github-page';
import { Markdown } from '../shared/Markdown';
import { TOUR_STATE_KEY, withIndex, type TourState } from '../shared/tour';

export async function openStep(state: TourState, i: number): Promise<void> {
  const next = withIndex(state, i);
  await chrome.storage.session.set({ [TOUR_STATE_KEY]: next });
  const step = next.steps[next.currentIndex];
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id !== undefined && step) await chrome.tabs.update(tab.id, { url: stepUrl(next, next.sha, step.path) });
}

/** Copy or download the tour as a brief for an AI assistant. */
function ContextPack({ state }: { state: TourState }) {
  const [copied, setCopied] = useState(false);
  const md = (): string => contextPack(state);
  const download = (): void => {
    const url = URL.createObjectURL(new Blob([md()], { type: 'text/markdown' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = contextPackFilename(state);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section class="context-pack" data-kitty="context-pack">
      <p class="small">Handing this repo to an AI? Give it Kitty's map first.</p>
      <div class="row">
        <button class="small" disabled={state.streaming} onClick={() => void navigator.clipboard.writeText(md()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}>
          {copied ? 'Copied' : 'Copy context for your AI'}
        </button>
        <button class="ghost small" disabled={state.streaming} onClick={download}>Download .md</button>
      </div>
      {state.streaming && <p class="muted small">Ready when Kitty finishes the tour.</p>}
    </section>
  );
}

export function TourPanel({ state, onAsk }: { state: TourState; onAsk: (index: number) => void }) {
  const { tour, meta } = state.result;
  const n = state.currentIndex;
  const issue = meta.issue;
  const plan = issue ? contributionPlan({ owner: meta.owner, repo: meta.repo, defaultBranch: meta.defaultBranch ?? 'main', issue, login: state.login }) : null;
  return (
    <details class="tour-panel" data-kitty="tour-panel" open={issue ? true : undefined}>
      <summary>
        {meta.pr ? (
          <>🔍 Changes in <strong>PR #{meta.pr.number}</strong> · step {n + 1} of {state.steps.length}</>
        ) : issue ? (
          <>🛠️ Fixing <strong>#{issue.number}</strong> in {meta.owner}/{meta.repo} · step {n + 1} of {state.steps.length}</>
        ) : (
          <>🗺️ Tour of <strong>{meta.owner}/{meta.repo}</strong> · step {n + 1} of {state.steps.length}</>
        )}
      </summary>
      {issue && plan && (
        <section class="fix-plan" data-kitty="fix-plan">
          <p><a href={issue.url} target="_blank" rel="noopener noreferrer"><strong>#{issue.number} {issue.title}</strong></a></p>
          <h4>Your git commands</h4>
          <Markdown text={['```bash', plan.commands, '```'].join('\n')} sources={[]} />
          <p class="small">
            Then <a href={plan.prUrl} target="_blank" rel="noopener noreferrer">open the pull request</a> and run Kitty's pre-flight check on it.
            {!state.login && ' Replace YOUR-USERNAME with your GitHub username (sign in on github.com and Kitty fills it in).'}
          </p>
          <h4>The plan</h4>
          <p class="pre">{tour.how_to_contribute}</p>
        </section>
      )}
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
        {meta.pr ? <Markdown text={tour.how_to_run} sources={[]} /> : <p class="pre">{tour.how_to_run}</p>}
      </details>
      <details>
        <summary>{issue ? 'Tips for this issue' : 'How to contribute'}</summary>
        {!issue && <p class="pre">{tour.how_to_contribute}</p>}
        {tour.good_first_issue_tips.length > 0 && <ul>{tour.good_first_issue_tips.map((t) => <li key={t}>{t}</li>)}</ul>}
      </details>
      <ContextPack state={state} />
      <p class="muted small">Commit {meta.sha.slice(0, 7)} · {meta.provider}{meta.cached ? ' · cached' : ''}</p>
    </details>
  );
}
