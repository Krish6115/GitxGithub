// Per-feature output caps, reasoning effort and time limits.
import type { ReasoningEffort, TaskKind } from './types.js';

export interface CallBudget {
  /** Output cap; on BharatCode this includes reasoning tokens. */
  maxTokens: number;
  /** `undefined` = don't send the parameter (model default). */
  reasoningEffort: ReasoningEffort | undefined;
  /** Hard cap for the whole call, retries included. */
  totalMs: number;
}

export const CALL_BUDGETS: Record<TaskKind, CallBudget> = {
  tour: { maxTokens: 16_000, reasoningEffort: undefined, totalMs: 180_000 },
  tutor: { maxTokens: 6_000, reasoningEffort: undefined, totalMs: 90_000 },
  explain: { maxTokens: 1_500, reasoningEffort: 'none', totalMs: 45_000 },
};

export interface StreamTimeouts {
  /** Max wait for the first streamed chunk (free-tier queueing happens here). */
  firstTokenMs: number;
  /** Max silence between chunks once streaming has started. */
  idleMs: number;
  totalMs: number;
}
