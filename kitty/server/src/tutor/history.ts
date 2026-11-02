// Chat history handling for the tutor: validation, trimming and follow-up-aware search text.
import { z } from 'zod';

export const TutorTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(8000),
});
export type TutorTurn = z.infer<typeof TutorTurnSchema>;

export const TutorRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  history: z.array(TutorTurnSchema).max(40).default([]),
});
export type TutorRequest = z.infer<typeof TutorRequestSchema>;

/** Keep the newest turns: at most `maxTurns` messages (3 exchanges) and about `maxChars` characters (~1.5k tokens). */
export function trimHistory(history: TutorTurn[], maxTurns = 6, maxChars = 6000): TutorTurn[] {
  const out: TutorTurn[] = [];
  let used = 0;
  for (const turn of [...history].reverse()) {
    if (out.length >= maxTurns) break;
    const content = turn.content.length > 2000 ? `${turn.content.slice(0, 2000)} […]` : turn.content;
    if (used + content.length > maxChars) break;
    used += content.length;
    out.unshift({ role: turn.role, content });
  }
  // a conversation sent to the model should start with a user turn
  while (out[0]?.role === 'assistant') out.shift();
  return out;
}

const FOLLOW_UP = /^(and|but|also|what about|how about|then|so|ok|okay|why|what if|can i|could i|is that|does that|it|that|this|those)\b/i;

/** Search text: the question, plus the previous user question when this one looks like a follow-up. */
export function searchText(question: string, history: TutorTurn[]): string {
  const previous = [...history].reverse().find((t) => t.role === 'user')?.content;
  const words = question.trim().split(/\s+/).length;
  const followUp = FOLLOW_UP.test(question.trim()) || words <= 5;
  return previous && followUp ? `${question} ${previous.slice(0, 300)}` : question;
}

/** Short definition-style questions don't need model reasoning. */
export function isShortQuestion(question: string): boolean {
  const q = question.trim();
  return q.split(/\s+/).length < 12 && /^(what('s| is| are| does)|define|meaning of|difference between)\b/i.test(q);
}
