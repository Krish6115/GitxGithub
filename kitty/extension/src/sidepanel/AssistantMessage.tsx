// One Kitty answer in the chat: the answer, repo files it read, action cards (issue search, Copilot hand-off),
// sources, flags and the per-answer tools (try it in Practice, ask Copilot).
import { actionLabel, stripAction, type PageAction } from '../shared/actions';
import { sourceLabel, type ChatMessage } from '../shared/chat';
import { copilotPrompt } from '../shared/copilot';
import { repoFromUrl } from '../shared/github-page';
import { Icon } from '../shared/Icon';
import { LEARN_FOCUS_KEY, type LearnFocus } from '../shared/learn';
import { Markdown } from '../shared/Markdown';
import { SIDEPANEL_TAB_KEY } from '../shared/messages';
import type { PageContext } from '../shared/page-context';
import { scenarioFor } from '../shared/practice-scenarios';
import { openCopilot, runOnPage, Thinking } from './chat-helpers';

type Assistant = Extract<ChatMessage, { role: 'assistant' }>;

export function AssistantMessage({ m, previous, page }: { m: Assistant; previous: ChatMessage | undefined; page: PageContext | null }) {
  return (
        <div class="msg kitty" data-status={m.status}>
          {m.files && (
            <p class="small muted" data-kitty="repo-files">
              <Icon name="file-directory" size={12} /> Read from {m.files.repo}:{' '}
              {m.files.files.map((f, j) => (
                <span key={f.path}>{j > 0 && ', '}<a href={f.url} target="_blank" rel="noopener noreferrer"><code>{f.path}</code></a></span>
              ))}
            </p>
          )}
          {m.content ? <Markdown text={stripAction(m.content)} sources={m.sources} /> : m.status === 'streaming' && <Thinking />}
          {m.status === 'done' && (() => {
            const q = previous;
            const sc = scenarioFor(`${q?.role === 'user' ? q.content : ''} ${m.content.slice(0, 400)}`);
            const question = q?.role === 'user' ? q.content : '';
            const repo = page ? repoFromUrl(page.url) : null;
            return (
              <div class="answer-tools">
                {sc && (
                  <button class="ghost small" data-kitty="try-practice" onClick={() => void chrome.storage.session.set({ [LEARN_FOCUS_KEY]: { view: 'practice', scenario: sc.id } satisfies LearnFocus, [SIDEPANEL_TAB_KEY]: 'learn' })}>
                    <Icon name="beaker" size={12} /> Try it safely: {sc.title}
                  </button>
                )}
                {question && m.action?.type !== 'copilot' && (
                  <button class="ghost small" data-kitty="answer-copilot" title="Hand this question to GitHub Copilot (for writing or changing code)" onClick={() => void openCopilot(copilotPrompt(question, { repo: repo ? `${repo.owner}/${repo.repo}` : undefined, page: page?.url }))}>
                    <Icon name="copilot" size={12} /> Ask Copilot
                  </button>
                )}
              </div>
            );
          })()}
          {m.action?.type === 'copilot' && (
            <div class="action-card copilot-card" data-kitty="copilot-card">
              <p><Icon name="copilot" size={14} /> Writing and changing code is GitHub Copilot's job. Kitty prepared the question:</p>
              <pre class="draft-text">{m.action.prompt}</pre>
              <div class="row">
                <button class="small" data-kitty="ask-copilot" onClick={() => void openCopilot((m.action as { prompt: string }).prompt)}>Ask GitHub Copilot</button>
                <button class="ghost small" onClick={() => void navigator.clipboard.writeText((m.action as { prompt: string }).prompt)}>Copy</button>
              </div>
              <p class="muted small">Opens Copilot on github.com and types it in; you review and press Enter.</p>
            </div>
          )}
          {m.action && m.action.type !== 'copilot' && (
            <div class="action-card" data-kitty="action">
              <p><Icon name="arrow-right" size={12} /> {actionLabel(m.action)}{m.action.type !== 'find_issues' && ': Kitty is taking you there.'}</p>
              {m.action.type !== 'find_issues' && <button class="ghost small" onClick={() => void runOnPage(m.action as PageAction)}>Go again</button>}
              {m.found?.status === 'loading' && <p class="thinking small">Searching GitHub</p>}
              {m.found?.status === 'error' && <p class="error small">{m.found.error}</p>}
              {m.found?.status === 'done' && (m.found.issues?.length ? (
                <ol class="found" data-kitty="found">
                  {m.found.issues.map((i) => (
                    <li key={`${i.repo}#${i.number}`}>
                      <a href={i.url} target="_blank" rel="noopener noreferrer"><strong>{i.repo}#{i.number}</strong> {i.title}</a>
                      {i.labels.length > 0 && <div class="small muted">{i.labels.slice(0, 3).join(' · ')}</div>}
                      <div class="row">
                        <button class="small" data-kitty="show-issue" onClick={() => void runOnPage({ type: 'explain_issue', repo: i.repo, number: i.number })}>Show me</button>
                        <button class="ghost small" onClick={() => void runOnPage({ type: 'fix_issue', repo: i.repo, number: i.number })}>Help me fix it</button>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : <p class="small muted">No open, beginner-friendly issues matched. Try other words.</p>)}
            </div>
          )}
          {m.status === 'error' && <p class="error">{m.error}</p>}
          {m.instant && (m.diagnosis
            ? <p class="muted small" data-kitty="diagnosis" title="Recognised by Kitty's rules for common Git errors"><Icon name="tools" size={12} /> Recognised Git error, instant</p>
            : <p class="muted small" data-kitty="instant" title="A common question with a saved, checked answer from Kitty's sources"><Icon name="zap" size={12} /> Saved answer, instant</p>)}
          {m.status === 'stopped' && <p class="muted small">Stopped.</p>}
          {m.truncated && <p class="muted small">The answer hit its length limit and may be incomplete.</p>}
          {m.unverifiedFlags && m.unverifiedFlags.length > 0 && (
            <p class="warn"><Icon name="alert" size={12} /> Not verified in Kitty's sources: {m.unverifiedFlags.map((f) => <code key={f}>{f}</code>)}. Check the <a href="https://git-scm.com/docs" target="_blank" rel="noopener noreferrer">git docs</a>.</p>
          )}
          {m.sources.length > 0 && m.status !== 'streaming' && (
            <details class="sources">
              <summary>Sources ({m.sources.length})</summary>
              <ol>{m.sources.map((s) => <li key={s.n} value={s.n}><a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{sourceLabel(s)}</a> <span class="muted small">· {s.license}</span></li>)}</ol>
            </details>
          )}
        </div>
  );
}
