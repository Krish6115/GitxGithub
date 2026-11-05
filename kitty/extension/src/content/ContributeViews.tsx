// On-page bubbles for contributors: good first issues (with "Help me fix this") and the PR pre-flight checklist.
import { useState } from 'preact/hooks';
import type { BeginnerIssues, CheckStatus, ConflictRescue, PreflightCheck, PreflightResult, RescueStep } from '../shared/contribute';
import { CHAT_DRAFT_KEY } from '../shared/messages';
import type { ApiState } from './useApi';
import { DraftPr } from './DraftPr';
import { Icon, type IconName } from '../shared/Icon';

const ICON: Record<CheckStatus, IconName> = { fail: 'x-circle', warn: 'alert', info: 'info', pass: 'check-circle' };

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      class="ghost copy"
      onClick={() => void navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

/** Pre-fill a question in the side panel chat and open it. */
function askInChat(question: string, onHint: () => void): void {
  void chrome.storage.session.set({ [CHAT_DRAFT_KEY]: question });
  void chrome.runtime.sendMessage({ type: 'open-chat' }).then((r: { ok?: boolean } | undefined) => r?.ok || onHint());
}

function Status({ state, loading, onClose }: { state: ApiState<unknown>; loading: string; onClose: () => void }) {
  if (state.kind === 'loading') return <p class="thinking">{loading}</p>;
  if (state.kind === 'error') {
    return (
      <>
        <p>{state.message}</p>
        <div class="row"><button class="ghost" onClick={onClose}>Close</button></div>
      </>
    );
  }
  return null;
}

export function IssuesView({ state, repo, onFix, onClose }: { state: ApiState<BeginnerIssues>; repo: string; onFix: (n: number) => void; onClose: () => void }) {
  if (state.kind !== 'done') {
    return <div class="bubble panel" data-kitty="issues"><Status state={state} loading="Kitty is looking for good first issues…" onClose={onClose} /></div>;
  }
  const { issues, labeled } = state.data;
  return (
    <div class="bubble panel" data-kitty="issues">
      <h3>Good first issues in {repo}</h3>
      {issues.length === 0 ? (
        <p>No open, unassigned issues right now. Check back later, or ask the maintainers what they need help with.</p>
      ) : (
        <>
          {!labeled && <p class="hint">Nothing here is labelled for beginners, so these are the quietest recent issues. Ask on the issue before starting.</p>}
          <ol class="issue-list">
            {issues.map((i) => (
              <li key={i.number}>
                <a href={i.url}>#{i.number} {i.title}</a>
                <div class="meta">
                  {i.labels.slice(0, 3).map((l) => <span key={l} class="badge">{l}</span>)}
                  <span><Icon name="comment" size={12} /> {i.comments}</span>
                </div>
                {i.reasons.length > 0 && <p class="why">{i.reasons.join(' · ')}</p>}
                <button data-kitty="fix-issue" onClick={() => onFix(i.number)}>Help me fix this</button>
              </li>
            ))}
          </ol>
        </>
      )}
      <div class="row"><button class="ghost" onClick={onClose}>Close</button></div>
    </div>
  );
}

function CheckItem({ check, onHint }: { check: PreflightCheck; onHint: () => void }) {
  const commands = check.commands?.join('\n');
  return (
    <li class={`check check-${check.status}`} data-check={check.id}>
      <div class="check-title"><span class={`status-icon s-${check.status}`}><Icon name={ICON[check.status]} /></span> <strong>{check.title}</strong></div>
      <p>{check.detail}</p>
      {commands && (
        <div class="code">
          <pre><code>{commands}</code></pre>
          <CopyButton text={commands} />
        </div>
      )}
      {(check.status === 'fail' || check.status === 'warn') && (
        <button class="ghost small" onClick={() => askInChat(`My pull request has this problem: "${check.title}". ${check.detail} How do I fix it, step by step?`, onHint)}>
          Ask Kitty
        </button>
      )}
    </li>
  );
}

function Step({ step, n }: { step: RescueStep; n?: number }) {
  const commands = step.commands.join('\n');
  return (
    <li class="check">
      <div class="check-title"><strong>{n !== undefined ? `${n}. ` : ''}{step.title}</strong></div>
      <div class="code">
        <pre><code>{commands}</code></pre>
        <CopyButton text={commands} />
      </div>
      {step.note && <p class="why">{step.note}</p>}
    </li>
  );
}

/** Step-by-step help for a PR with merge conflicts. */
function ConflictView({ rescue }: { rescue: ConflictRescue }) {
  return (
    <details class="conflict" data-kitty="conflict-rescue" open>
      <summary><Icon name="git-merge" /> <strong>Merge-conflict rescue</strong></summary>
      {rescue.likelyFiles.length > 0 && (
        <p>Likely conflicts (changed on both sides): {rescue.likelyFiles.map((f) => <code key={f}>{f} </code>)}</p>
      )}
      <ul class="checks">{rescue.steps.map((s, i) => <Step key={s.title} step={s} n={i + 1} />)}</ul>
      <ul class="checks"><Step step={rescue.undo} /></ul>
    </details>
  );
}

export function PreflightView({ state, onClose, onHint, target }: { state: ApiState<PreflightResult>; onClose: () => void; onHint: () => void; target?: { owner: string; repo: string } }) {
  if (state.kind !== 'done') {
    return <div class="bubble panel" data-kitty="preflight"><Status state={state} loading="Kitty is checking this pull request…" onClose={onClose} /></div>;
  }
  const r = state.data;
  const todo = r.checks.filter((c) => c.status !== 'pass');
  const passed = r.checks.filter((c) => c.status === 'pass');
  const summary = [
    r.counts.fail ? `${r.counts.fail} to fix` : '',
    r.counts.warn ? `${r.counts.warn} to check` : '',
    r.counts.pass ? `${r.counts.pass} passed` : '',
  ].filter(Boolean).join(' · ');
  return (
    <div class="bubble panel" data-kitty="preflight">
      <h3>Pre-flight check · #{r.number}</h3>
      <p class="meta">{summary || 'Nothing to report.'}</p>
      {r.counts.fail === 0 && r.counts.warn === 0 && <p>Looks ready for review.</p>}
      <ul class="checks">{todo.map((c) => <CheckItem key={c.id} check={c} onHint={onHint} />)}</ul>
      {r.conflict && <ConflictView rescue={r.conflict} />}
      {passed.length > 0 && (
        <details>
          <summary>{passed.length} passed</summary>
          <ul class="checks">{passed.map((c) => <CheckItem key={c.id} check={c} onHint={onHint} />)}</ul>
        </details>
      )}
      <p class="hint">Rule-based check: no AI tokens used.</p>
      {target && <DraftPr owner={target.owner} repo={target.repo} pr={r.number} />}
      <div class="row"><button class="ghost" onClick={onClose}>Close</button></div>
    </div>
  );
}
