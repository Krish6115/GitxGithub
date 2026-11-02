// "Ask Kitty" tutor chat: streamed answers with numbered sources, unverified-flag notes, stop and new chat.
import { useEffect, useRef, useState } from 'preact/hooks';
import { ApiError, postStream } from '../shared/api';
import { CHAT_KEY, sourceLabel, toHistory, trimChat, type ChatMessage, type ChatSource } from '../shared/chat';
import { errorText } from '../shared/messages';
import { Markdown } from './Markdown';

type Assistant = Extract<ChatMessage, { role: 'assistant' }>;

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const busy = messages.at(-1)?.role === 'assistant' && (messages.at(-1) as Assistant).status === 'streaming';

  useEffect(() => {
    void chrome.storage.session.get(CHAT_KEY).then((r) => setMessages(((r[CHAT_KEY] as ChatMessage[] | undefined) ?? []).map((m) => (m.role === 'assistant' && m.status === 'streaming' ? { ...m, status: 'stopped' } : m))));
  }, []);
  useEffect(() => {
    if (!busy) void chrome.storage.session.set({ [CHAT_KEY]: trimChat(messages) });
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, busy]);

  const updateLast = (f: (m: Assistant) => Assistant): void =>
    setMessages((ms) => {
      const last = ms.at(-1);
      return last?.role === 'assistant' ? [...ms.slice(0, -1), f(last)] : ms;
    });

  async function send(question: string): Promise<void> {
    const q = question.trim();
    if (!q || busy) return;
    const history = toHistory(messages);
    setInput('');
    setMessages((ms) => trimChat([...ms, { role: 'user', content: q }, { role: 'assistant', content: '', sources: [], status: 'streaming' }]));
    const abort = new AbortController();
    abortRef.current = abort;
    try {
      await postStream('/tutor', { question: q, history }, (event, data) => {
        const d = data as Record<string, unknown>;
        if (event === 'sources') updateLast((m) => ({ ...m, sources: d.sources as ChatSource[] }));
        else if (event === 'delta') updateLast((m) => ({ ...m, content: m.content + String(d.text ?? '') }));
        else if (event === 'done') updateLast((m) => ({ ...m, status: 'done', unverifiedFlags: d.unverifiedFlags as string[], truncated: Boolean(d.truncated) }));
        else if (event === 'error') updateLast((m) => ({ ...m, status: 'error', error: errorText(String(d.code), String(d.message)) }));
      }, abort.signal);
      updateLast((m) => (m.status === 'streaming' ? { ...m, status: 'error', error: 'The answer ended unexpectedly.' } : m));
    } catch (e) {
      if (abort.signal.aborted) updateLast((m) => ({ ...m, status: 'stopped' }));
      else updateLast((m) => ({ ...m, status: 'error', error: e instanceof ApiError ? errorText(e.code, e.message) : 'Something went wrong.' }));
    }
  }

  return (
    <section class="chat">
      <div class="messages" aria-live="polite">
        {messages.length === 0 && (
          <div class="muted">
            <p>Ask me anything about Git or GitHub. I answer from Kitty's learning material and cite my sources.</p>
            {['How do I undo my last commit?', 'How do I sync my fork with upstream?', "What's the difference between merge and rebase?"].map((s) => (
              <button key={s} class="chip" onClick={() => void send(s)}>{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} class="msg user">{m.content}</div>
          ) : (
            <div key={i} class="msg kitty" data-status={m.status}>
              {m.content ? <Markdown text={m.content} sources={m.sources} /> : m.status === 'streaming' && <p class="thinking">Kitty is thinking</p>}
              {m.status === 'error' && <p class="error">{m.error}</p>}
              {m.status === 'stopped' && <p class="muted small">Stopped.</p>}
              {m.truncated && <p class="muted small">The answer hit its length limit and may be incomplete.</p>}
              {m.unverifiedFlags && m.unverifiedFlags.length > 0 && (
                <p class="warn">⚠ Not verified in Kitty's sources: {m.unverifiedFlags.map((f) => <code key={f}>{f}</code>)}. Check the <a href="https://git-scm.com/docs" target="_blank" rel="noopener noreferrer">git docs</a>.</p>
              )}
              {m.sources.length > 0 && m.status !== 'streaming' && (
                <details class="sources">
                  <summary>Sources ({m.sources.length})</summary>
                  <ol>{m.sources.map((s) => <li key={s.n} value={s.n}><a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{sourceLabel(s)}</a> <span class="muted small">· {s.license}</span></li>)}</ol>
                </details>
              )}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>
      <form class="composer" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <textarea
          value={input}
          maxLength={2000}
          rows={2}
          placeholder="Ask a Git question…"
          aria-label="Your question"
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }}
        />
        <div class="row">
          {busy ? <button type="button" onClick={() => abortRef.current?.abort()}>Stop</button> : <button type="submit" disabled={!input.trim()}>Ask</button>}
          <button type="button" class="ghost" disabled={busy || messages.length === 0} onClick={() => setMessages([])}>New chat</button>
        </div>
      </form>
    </section>
  );
}
