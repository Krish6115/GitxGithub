// Pure animation logic for Kitty: which frame to show, where to walk, how long walking takes.
import type { Box } from './highlight';
import { ANIMATIONS, type AnimationName, type Frame } from './sprite-sheet';

export type CatMode = 'idle' | 'walk' | 'think' | 'sleep' | 'wave';

export const CAT_SIZE = 96;
export const HOME_MARGIN = 24;
export const SLEEP_AFTER_MS = 120_000;
export const TICK_MS = 150;

/** Ticks each frame stays on screen, per animation (walk and wave are fast, sleep is slow). */
const HOLD: Record<AnimationName, number> = { walk: 1, wave: 2, blink: 1, idle: 3, think: 2, sleep: 4 };

const loop = (anim: AnimationName, tick: number): Frame => ({ anim, index: Math.floor(tick / HOLD[anim]) % ANIMATIONS[anim].frames });

/** Ticks a full wave plays for (two waves of the paw). */
export const WAVE_TICKS = ANIMATIONS.wave.frames * HOLD.wave * 2;

/** Frame for a mode at a given animation tick (one tick = TICK_MS). */
export function frameFor(mode: CatMode, tick: number): Frame {
  if (mode !== 'idle') return loop(mode, tick);
  // ~7s idle loop: breathe and wave the tail, with a quick blink every loop
  const t = tick % 48;
  if (t < ANIMATIONS.blink.frames) return { anim: 'blink', index: t };
  return loop('idle', tick);
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

/** Resting spot in the bottom-right corner (top-left of the cat). */
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
