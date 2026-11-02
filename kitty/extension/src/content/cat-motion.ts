// Pure animation logic for Kitty: which frame to show, where to walk, how long walking takes.
import type { FrameName } from './sprite-frames';
import type { Box } from './highlight';

export type CatMode = 'idle' | 'walk' | 'think' | 'sleep';

export const CAT_SIZE = 64;
export const HOME_MARGIN = 24;
export const SLEEP_AFTER_MS = 120_000;
export const TICK_MS = 150;

const WALK: FrameName[] = ['walkA', 'walkB', 'walkC', 'walkB'];

/** Frame for a mode at a given animation tick (one tick = TICK_MS). */
export function frameFor(mode: CatMode, tick: number): FrameName {
  if (mode === 'sleep') return 'sleep';
  if (mode === 'walk') return WALK[tick % WALK.length] ?? 'walkA';
  const t = tick % 40; // ~6s idle loop: blink at the start, tail flick in the middle
  if (t === 0 || t === 1) return 'blink';
  if (t >= 20 && t <= 22) return 'tail';
  return 'idle';
}

export interface Point {
  x: number;
  y: number;
}
export interface Viewport {
  width: number;
  height: number;
}

/** Viewport size without scrollbars (what `position: fixed` offsets are measured against). */
export const viewport = (): Viewport => ({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight });

/** Resting spot in the bottom-right corner (top-left of the 64px cat). */
export const homePosition = (vp: Viewport): Point => ({
  x: vp.width - CAT_SIZE - HOME_MARGIN,
  y: vp.height - CAT_SIZE - HOME_MARGIN,
});

/** Spot just to the right of the highlighted file header, kept inside the viewport. */
export function besideBox(box: Box, vp: Viewport): Point {
  const x = Math.min(box.left + box.width + 12, vp.width - CAT_SIZE - 8);
  const y = Math.min(Math.max(8, box.top + box.height / 2 - CAT_SIZE / 2), vp.height - CAT_SIZE - 8);
  return { x: Math.max(8, x), y };
}

/** Walking time for a move: ~350 px/s, between 300 ms and 1.5 s. */
export function walkDuration(from: Point, to: Point): number {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.round(Math.min(1500, Math.max(300, d / 0.35)));
}

/** Only re-target when the destination moved noticeably (avoids jitter while the page scrolls). */
export const movedEnough = (a: Point, b: Point, threshold = 24): boolean => Math.hypot(a.x - b.x, a.y - b.y) > threshold;
