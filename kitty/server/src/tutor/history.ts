// Chat history handling for the tutor: validation, trimming and follow-up-aware search text.
import { z } from 'zod';

export const TutorTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(8000),
});
export type TutorTurn = z.infer<typeof TutorTurnSchema>;

/** The GitHub page the user is looking at (read by the extension; untrusted). */
export const PageContextSchema = z.object({
  url: z.string().max(1000),
  title: z.string().max(300).default(''),
  pageType: z.string().max(40).default('other'),
  selection: z.string().max(2000).default(''),
  text: z.string().max(8000).default(''),
  truncated: z.boolean().default(false),
});
export type PageContext = z.infer<typeof PageContextSchema>;

/** The repo tour the user is on, and the step they're asking about (model-written from repo content; untrusted). */
export const TourContextSchema = z.object({
  repo: z.string().max(200),
  summary: z.string().max(2000).default(''),
  stepNumber: z.number().int().min(1).max(50),
  totalSteps: z.number().int().min(1).max(50),
  step: z.object({
    path: z.string().max(500),
    title: z.string().max(300),
    what: z.string().max(2000),
    why_it_matters: z.string().max(2000),
  }),
});
export type TourContext = z.infer<typeof TourContextSchema>;

export const TutorRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  history: z.array(TutorTurnSchema).max(40).default([]),
  page: PageContextSchema.optional(),
  tour: TourContextSchema.optional(),
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
