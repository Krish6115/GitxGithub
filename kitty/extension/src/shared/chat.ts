// Tutor chat model: messages kept in chrome.storage.session (cleared when the browser closes).

export interface ChatSource {
  n: number;
  title: string;
  headingPath: string[];
  sourceFile: string;
  sourceUrl: string;
  license: string;
}

export type ChatMessage =
  | { role: 'user'; content: string; /** e.g. "Step 4: login.go" when asked from a tour step */ about?: string }
  | {
      role: 'assistant';
      content: string;
      sources: ChatSource[];
      status: 'streaming' | 'done' | 'stopped' | 'error';
      unverifiedFlags?: string[];
      truncated?: boolean;
      error?: string;
      /** A saved, reviewed answer to a common question (served instantly, no tokens). */
      instant?: boolean;
      /** Something the answer asked Kitty to do (open a repo, explain an issue, find issues...). */
      action?: import('./actions').KittyAction;
      /** Repo files Kitty read to answer a question about the code. */
      files?: { repo: string; files: { path: string; url: string }[] };
      /** Results of a find_issues action. */
      found?: { status: 'loading' | 'done' | 'error'; issues?: import('./contribute').BeginnerIssue[]; labeled?: boolean; error?: string };
    };

export const CHAT_KEY = 'kitty:chat';
export const MAX_MESSAGES = 20;

export const trimChat = (messages: ChatMessage[]): ChatMessage[] => messages.slice(-MAX_MESSAGES);

/** History sent to the server: completed turns only (no errors, no half-streamed answers). */
export function toHistory(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.content });
    else if (m.status === 'done' && m.content) out.push({ role: 'assistant', content: m.content });
    else if (out.at(-1)?.role === 'user') out.pop(); // drop the question whose answer failed
  }
  return out.slice(-6);
}

/** Readable label for a source: "Pro Git > Rebasing" style, falling back to the file name. */
export function sourceLabel(s: ChatSource): string {
  const parts = [s.title, ...s.headingPath.slice(0, 2)].filter(Boolean);
  return parts.length ? parts.join(' › ') : (s.sourceFile.split('/').pop() ?? s.sourceFile);
}
