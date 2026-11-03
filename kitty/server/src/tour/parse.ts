// Extract and validate the model's tour JSON. Invalid step paths are dropped, not trusted.
import { z } from 'zod';
import { MIN_VALID_STEPS, TourSchema, TourStepSchema, type Tour, type TourStep } from './schema.js';

/** Pull the first balanced JSON object out of a reply (tolerates code fences and stray prose). */
export function extractJsonObject(text: string): unknown {
  const s = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  const start = s.indexOf('{');
  if (start < 0) throw new Error('no JSON object found in the reply');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return JSON.parse(s.slice(start, i + 1));
  }
  throw new Error('the JSON object is incomplete (the reply may have been cut off)');
}

export type TourValidation =
  | { ok: true; tour: Tour; dropped: string[] }
  | { ok: false; error: string };

const normalisePath = (p: string): string => p.trim().replace(/^\.?\//, '').replace(/\/+$/, '');

/**
 * Validate against the schema, drop steps whose path is not in the repo (or repeats), cap at `maxSteps`.
 * Fails if fewer than `minValid` (default MIN_VALID_STEPS) remain.
 */
export function validateTour(text: string, repoPaths: Set<string>, maxSteps: number, minValid = MIN_VALID_STEPS): TourValidation {
  let raw: unknown;
  try {
    raw = extractJsonObject(text);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'invalid JSON' };
  }
  const parsed = TourSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: `JSON does not match the schema: ${z.prettifyError(parsed.error).slice(0, 600)}` };

  const seen = new Set<string>();
  const dropped: string[] = [];
  const steps = parsed.data.steps.filter((step) => {
    const path = normalisePath(step.path);
    if (!repoPaths.has(path) || seen.has(path)) {
      dropped.push(step.path);
      return false;
    }
    seen.add(path);
    step.path = path;
    return true;
  });
  if (steps.length < minValid) {
    return { ok: false, error: `only ${steps.length} steps use real file paths (need at least ${minValid}); invalid: ${dropped.join(', ') || 'none'}` };
  }
  return { ok: true, tour: { ...parsed.data, steps: steps.slice(0, maxSteps) }, dropped };
}

/**
 * Steps that are already complete in a partial (still streaming) tour reply, so the tour can start before the
 * model finishes. Only fully closed step objects inside the "steps" array are returned.
 */
export function completedSteps(partial: string): TourStep[] {
  const key = partial.indexOf('"steps"');
  if (key < 0) return [];
  const open = partial.indexOf('[', key);
  if (open < 0) return [];
  const out: TourStep[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = open + 1; i < partial.length; i++) {
    const ch = partial[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          const step = TourStepSchema.safeParse(JSON.parse(partial.slice(start, i + 1)));
          if (step.success) out.push({ ...step.data, path: normalisePath(step.data.path) });
        } catch {
          /* not valid JSON yet */
        }
        start = -1;
      }
    } else if (ch === ']' && depth === 0) break;
  }
  return out;
}

/**
 * A planned tour: Kitty's steps, in Kitty's order, with the model's explanation wherever it wrote one (from the
 * full JSON, or whatever steps finished streaming before a timeout). Never fails: missing parts keep the drafts.
 */
export function mergePlannedTour(
  drafts: { path: string; title: string; what: string; why_it_matters: string }[],
  modelText: string,
  fallback: { summary: string; howToContribute: string },
): { tour: Tour; described: number; ignored: string[] } {
  let full: Tour | null = null;
  try {
    const parsed = TourSchema.safeParse(extractJsonObject(modelText));
    if (parsed.success) full = parsed.data;
  } catch {
    /* incomplete reply: use the streamed steps */
  }
  const written = full?.steps ?? (modelText ? completedSteps(modelText) : []);
  const byPath = new Map(written.map((s) => [normalisePath(s.path), s]));
  const planned = new Set(drafts.map((d) => d.path));
  const steps = drafts.map((d) => {
    const m = byPath.get(d.path);
    return m ? { path: d.path, title: m.title, what: m.what, why_it_matters: m.why_it_matters } : { path: d.path, title: d.title, what: d.what, why_it_matters: d.why_it_matters };
  });
  return {
    tour: {
      steps,
      summary: full?.summary ?? fallback.summary,
      stack: full?.stack ?? [],
      how_to_run: full?.how_to_run ?? 'Not stated in the repo.',
      how_to_contribute: full?.how_to_contribute ?? fallback.howToContribute,
      good_first_issue_tips: full?.good_first_issue_tips ?? [],
    },
    described: drafts.filter((d) => byPath.has(d.path)).length,
    ignored: [...byPath.keys()].filter((p) => !planned.has(p)),
  };
}
