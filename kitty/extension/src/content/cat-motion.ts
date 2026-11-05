// Pure animation logic for Kitty: which frame to show, where to walk, how long walking takes.
import type { Box } from './highlight';
import { ANIMATIONS, type AnimationName, type Frame } from './sprite-sheet';

/** held = being dragged by the user; landed = just dropped. */
export type CatMode = 'idle' | 'walk' | 'think' | 'sleep' | 'wave' | 'held' | 'landed';

export const CAT_SIZE = 96;
export const HOME_MARGIN = 24;
export const SLEEP_AFTER_MS = 120_000;
export const TICK_MS = 75;

/** Ticks each frame stays on screen, per animation (walk and wave are fast, sleep is slow). */
const HOLD: Record<AnimationName, number> = { walk: 1, wave: 3, blink: 2, idle: 6, think: 4, sleep: 8 };

const loop = (anim: AnimationName, tick: number): Frame => ({ anim, index: Math.floor(tick / HOLD[anim]) % ANIMATIONS[anim].frames });

/** Ticks a full wave plays for (two waves of the paw). */
export const WAVE_TICKS = ANIMATIONS.wave.frames * HOLD.wave * 2;

/** Frame for a mode at a given animation tick (one tick = TICK_MS). */
export function frameFor(mode: CatMode, tick: number, fast = false): Frame {
  // held up by the scruff: paws paddle, and the eyes squeeze shut when swung fast
  if (mode === 'held') return fast ? { anim: 'blink', index: 1 } : { anim: 'walk', index: Math.floor(tick / 2) % ANIMATIONS.walk.frames };
  if (mode === 'landed') return { anim: 'blink', index: Math.min(2, Math.floor(tick / 2) % 6) };
  if (mode !== 'idle') return loop(mode, tick);
  // ~7s idle loop: breathe and wave the tail, with a quick blink every loop
  const t = tick % 96;
  if (t < ANIMATIONS.blink.frames * HOLD.blink) return { anim: 'blink', index: Math.floor(t / HOLD.blink) };
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

/** Where the user parked the cat, as offsets from the bottom-right corner (so it stays put when the window resizes). */
export interface SavedHome {
  right: number;
  bottom: number;
  /** When the user last used Kitty there (ms); after RETURN_HOME_MS without use the cat walks back to its corner. */
  at?: number;
}
export const HOME_KEY = 'kitty:home';
/** A cat moved out of its corner walks back home after this long without being used. */
export const RETURN_HOME_MS = 60_000;

/** Time to walk back: the cat was moved, nobody has used it for a minute, and it isn't busy (bubble, tour, drag). */
export const shouldReturnHome = (saved: SavedHome | null, lastUse: number, now: number, busy: boolean): boolean =>
  Boolean(saved) && !busy && now - lastUse >= RETURN_HOME_MS;

/** Keep the cat fully on screen. */
export const clampToViewport = (p: Point, vp: Viewport, margin = 4): Point => ({
  x: Math.min(Math.max(margin, p.x), Math.max(margin, vp.width - CAT_SIZE - margin)),
  y: Math.min(Math.max(margin, p.y), Math.max(margin, vp.height - CAT_SIZE - margin)),
});

export const toSavedHome = (p: Point, vp: Viewport): SavedHome => ({
  right: Math.round(vp.width - CAT_SIZE - p.x),
  bottom: Math.round(vp.height - CAT_SIZE - p.y),
});

/** Resting spot: where the user dropped it, or the bottom-right corner. */
export const restingPosition = (vp: Viewport, saved: SavedHome | null): Point =>
  saved ? clampToViewport({ x: vp.width - CAT_SIZE - saved.right, y: vp.height - CAT_SIZE - saved.bottom }, vp) : homePosition(vp);

/** Swing angle while dangling: leans against the direction of travel, up to 25 degrees. */
export const swingFor = (vx: number): number => Math.max(-25, Math.min(25, -vx * 18));

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

/**
 * For walkthroughs: stand next to the element on the side with more room (below it, or above it), and open the
 * speech bubble on that same side, so it never covers what the cat is pointing at.
 */
export function guideSpot(box: Box, vp: Viewport): { point: Point; bubbleBelow: boolean } {
  // the bubble hangs left of the cat: keep the cat far enough right that the bubble is not squeezed
  const x = Math.min(Math.max(250, box.left + Math.min(box.width, 240) / 2 - CAT_SIZE / 2), vp.width - CAT_SIZE - 8);
  const roomBelow = vp.height - (box.top + box.height);
  const roomAbove = box.top;
  if (roomBelow >= roomAbove) return { point: { x, y: Math.min(box.top + box.height + 6, vp.height - CAT_SIZE - 8) }, bubbleBelow: true };
  return { point: { x, y: Math.max(8, box.top - CAT_SIZE - 6) }, bubbleBelow: false };
}

/** Walking time for a move: a brisk ~320 px/s, between 0.3 s and 1.8 s. */
export function walkDuration(from: Point, to: Point): number {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.round(Math.min(1800, Math.max(300, d / 0.32)));
}

/** Only re-target when the destination moved noticeably (avoids jitter while the page scrolls). */
export const movedEnough = (a: Point, b: Point, threshold = 24): boolean => Math.hypot(a.x - b.x, a.y - b.y) > threshold;
