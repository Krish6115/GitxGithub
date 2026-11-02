// "Ask Kitty" selection pill and the streamed explanation bubble.
import { useState } from 'preact/hooks';
import { Markdown } from '../shared/Markdown';
import { CHAT_DRAFT_KEY } from '../shared/messages';
import { bubblePosition, pillPosition } from './selection';
import { useExplain } from './useExplain';

const RISK: Record<string, { label: string; cls: string }> = {
  safe: { label: 'Safe', cls: 'risk-safe' },
  rewrites_history: { label: 'Rewrites history', cls: 'risk-rewrite' },
  can_lose_work: { label: 'Can lose work', cls: 'risk-danger' },
};
const KIND: Record<string, string> = { command: 'Command', diff: 'Diff', prose: 'Text', code: 'Code' };

export function ExplainUI({ hostId }: { hostId: string }) {
  const { offer, current, explain, close } = useExplain(hostId);
  const [copied, setCopied] = useState(false);
  const vp = { width: window.innerWidth, height: window.innerHeight };

  const followUp = (): void => {
    if (!current) return;
    const draft = `About this ${current.kind === 'command' ? 'command' : 'selection'}: ${current.text.slice(0, 600)}\n\nMy question: `;
    void chrome.storage.session.set({ [CHAT_DRAFT_KEY]: draft });
    void chrome.runtime.sendMessage({ type: 'open-chat' });
  };

  return (
    <>
      {offer && !current && (
        <button
          class="ask-pill"
          data-kitty="ask-pill"
          style={pillPosition(offer.rect, vp)}
          onMouseDown={(e) => e.preventDefault()} // keep the page selection
          onClick={() => explain(offer.text, offer.rect)}
        >
          🐾 Ask Kitty
        </button>
      )}
      {current && (
        <div class="bubble explain" data-kitty="explain" role="dialog" aria-label="Kitty explains" style={bubblePosition(current.rect, vp)}>
          <div class="meta">
            {current.kind && <span>{KIND[current.kind]}</span>}
            {current.risk && <span class={`risk ${RISK[current.risk]?.cls ?? ''}`} data-kitty="risk">{RISK[current.risk]?.label}</span>}
            {current.selectionCut && <span>first 4000 characters</span>}
          </div>
          <div class="explain-body">
            {current.answer ? <Markdown text={current.answer} sources={current.sources} /> : current.status === 'streaming' && <p class="thinking">Kitty is reading</p>}
            {current.status === 'error' && <p class="error">{current.error}</p>}
            {current.unverifiedFlags.length > 0 && (
              <p class="warn">⚠ Not verified in Kitty's sources: {current.unverifiedFlags.map((f) => <code key={f}>{f}</code>)}</p>
            )}
            {current.sources.length > 0 && current.status === 'done' && (
              <p class="srcs">Sources: {current.sources.map((s) => <a key={s.n} href={s.sourceUrl} target="_blank" rel="noopener noreferrer" title={s.title}>[{s.n}] {s.title}</a>)}</p>
            )}
          </div>
          <div class="row">
            <button
              class="ghost"
              disabled={!current.answer}
              onClick={() => void navigator.clipboard.writeText(current.answer).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); })}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button class="ghost" disabled={current.status === 'streaming'} onClick={followUp}>Ask a follow-up</button>
            <button onClick={close}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
