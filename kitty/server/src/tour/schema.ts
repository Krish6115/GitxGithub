// Repo tour JSON contract (model output, validated with zod) and the API result shape.
import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);

export const TourStepSchema = z.object({
  path: z.string().trim().min(1).max(400),
  title: text(140),
  what: text(1200),
  why_it_matters: text(900),
});
export type TourStep = z.infer<typeof TourStepSchema>;

export const TourSchema = z.object({
  summary: text(2000),
  stack: z.array(text(80)).max(20).default([]),
  steps: z.array(TourStepSchema).min(1).max(30),
  how_to_run: text(2500),
  how_to_contribute: text(2500),
  // models sometimes return a single string; accept and normalise to a list
  good_first_issue_tips: z.union([z.array(text(400)), text(1200).transform((s) => [s])]).default([]),
});
export type Tour = z.infer<typeof TourSchema>;

export interface TourMeta {
  owner: string;
  repo: string;
  sha: string;
  /** GitHub truncated the file list (very large repo): the tour was built from a partial view. */
  partial: boolean;
  cached: boolean;
  provider: string;
  repaired: boolean;
  droppedSteps: string[];
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
  contextTokens: number;
  /** Ranked files GitHub would not serve (rate limits, errors); the tour was built without them. */
  unreadableFiles: number;
  defaultBranch: string;
  /** Set for "Help me fix this issue" walkthroughs. */
  issue?: { number: number; title: string; url: string; labels: string[] };
  /** Planned tours: how many steps the model explained (the rest keep Kitty's own notes). */
  described?: number;
  /** Planned tours: the model was too slow or failed, so the tour uses Kitty's own notes. */
  modelFailed?: boolean;
}

export interface TourResult {
  tour: Tour;
  meta: TourMeta;
}

export const TourRequestSchema = z.object({
  owner: z.string().regex(/^[A-Za-z0-9_.-]{1,100}$/),
  repo: z.string().regex(/^[A-Za-z0-9_.-]{1,100}$/),
  /** Build a walkthrough of the files relevant to this issue instead of a general tour. */
  issue: z.number().int().positive().max(100_000_000).optional(),
});

export const MIN_VALID_STEPS = 5;
export const MIN_REQUESTED_STEPS = 6;
/** Issue walkthroughs are shorter: only the files that matter for the fix. */
export const ISSUE_MIN_VALID_STEPS = 3;
export const ISSUE_MIN_REQUESTED_STEPS = 3;
export const ISSUE_MAX_STEPS = 7;
