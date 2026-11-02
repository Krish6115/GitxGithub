// Kitty's sprite sheet (assets/kitty-sprites.png): 96x96 cells, one row per animation, frames left to right.
import sheetUrl from './assets/kitty-sprites.png?inline';

export const SHEET_URL: string = sheetUrl;
export const CELL = 96;
export const SHEET_COLS = 8;

export const ANIMATIONS = {
  walk: { row: 0, frames: 8 },
  idle: { row: 1, frames: 6 },
  blink: { row: 2, frames: 3 },
  think: { row: 3, frames: 6 },
  sleep: { row: 4, frames: 6 },
  wave: { row: 5, frames: 4 },
} as const;

export type AnimationName = keyof typeof ANIMATIONS;

export interface Frame {
  anim: AnimationName;
  index: number;
}

export const SHEET_ROWS = Object.keys(ANIMATIONS).length;
