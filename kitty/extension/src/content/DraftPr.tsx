// "Draft description" in the PR check: a suggested title, description and commit message to copy (Kitty never posts).
import { useState } from 'preact/hooks';
import type { DraftResult } from '../shared/contribute';
import { useApi } from './useApi';
import { Icon } from '../shared/Icon';

function Copyable({ label, text, multiline }: { label: string; text: string; multiline?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <div class="draft-field">
      <div class="check-title">
        <strong>{label}</strong>
        <button class="ghost small" onClick={() => void navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}>
          {done ? 'Copied' : 'Copy'}
        </button>
      </div>
      {multiline ? <pre class="draft-text">{text}</pre> : <p class="draft-text">{text}</p>}
    </div>
  );
}

export function DraftPr({ owner, repo, pr }: { owner: string; repo: string; pr: number }) {
  const api = useApi<DraftResult>('/draft-pr');
  const s = api.state;
  if (s.kind === 'idle') {
    return (
      <div class="row">
        <button class="ghost small" data-kitty="draft-pr" onClick={() => api.run({ owner, repo, pr })}><Icon name="pencil" /> Draft description & commit message</button>
      </div>
    );
  }
  if (s.kind === 'loading') return <p class="thinking small">Kitty is reading your diff</p>;
  if (s.kind === 'error') {
    return (
      <>
        <p class="small">{s.message}</p>
        <div class="row"><button class="ghost small" onClick={() => api.run({ owner, repo, pr })}>Try again</button></div>
      </>
    );
  }
  const d = s.data;
  return (
    <details class="draft" data-kitty="draft" open>
      <summary><Icon name="pencil" /> <strong>Suggested description</strong></summary>
      <p class="hint">Written from your diff{d.usedTemplate ? ', following the repo\'s PR template' : ''}{d.conventional ? ', in Conventional Commits style' : ''}. Check it, then paste it on GitHub (Edit on the PR).</p>
      <Copyable label="Title" text={d.title} />
      <Copyable label="Description" text={d.description} multiline />
      <Copyable label="Squash commit message" text={d.commit_message} multiline />
    </details>
  );
}
