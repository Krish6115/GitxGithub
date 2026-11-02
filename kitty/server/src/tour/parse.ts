// Extract and validate the model's tour JSON. Invalid step paths are dropped, not trusted.
import { z } from 'zod';
import { MIN_VALID_STEPS, TourSchema, type Tour } from './schema.js';

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
