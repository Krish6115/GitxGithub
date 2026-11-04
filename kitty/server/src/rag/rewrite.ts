// Question rewriting for search: when a learner's plain-English question finds only weak matches ("I messed up my
// last save"), the model turns it into Git terms ("amend reset undo commit") and Kitty searches again. Only used on
// weak results, with no reasoning and a tiny output cap, so it costs a few hundred tokens at most.
import type { Provider } from '../llm/types.js';

export const REWRITE_PROMPT = [
  'You turn a learner\'s question about Git or GitHub into search keywords for Git documentation.',
  'Reply with one line of 3 to 10 lowercase keywords: git command names and Git terms only (e.g. "amend reset undo last commit").',
  'If the question is not about Git, GitHub or version control, reply exactly: NONE',
  'No sentences, no punctuation except hyphens, no explanations.',
].join('\n');

/** Keep only plausible keyword output: short, no sentences, not NONE. */
export function cleanRewrite(text: string): string | null {
  const line = text.trim().split('\n')[0]?.toLowerCase().replace(/[^a-z0-9\s.-]/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
  if (!line || /^none\b/.test(line)) return null;
  const words = line.split(' ').filter((w) => w.length > 1);
  if (words.length < 1 || words.length > 14) return null;
  return words.join(' ');
}

export async function rewriteQuery(provider: Provider, question: string, signal?: AbortSignal): Promise<string | null> {
  let text = '';
  try {
    for await (const ev of provider.stream({
      kind: 'tutor',
      messages: [{ role: 'system', content: REWRITE_PROMPT }, { role: 'user', content: question.slice(0, 500) }],
      reasoningEffort: 'none',
      maxTokens: 60,
      temperature: 0,
      firstTokenMs: 5000,
      totalMs: 8000,
      ...(signal ? { signal } : {}),
    })) {
      if (ev.type === 'delta') text += ev.text;
    }
  } catch {
    return null; // a slow or busy model just means no rewrite
  }
  return cleanRewrite(text);
}

/** Worth a rewrite: a real question (not a word or two) that is not about the page or repo files. */
export const worthRewriting = (question: string): boolean => question.trim().split(/\s+/).length >= 4 && question.length <= 500;
