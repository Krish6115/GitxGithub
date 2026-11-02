import { describe, expect, it } from 'vitest';
import { besideBox, CAT_SIZE, frameFor, homePosition, movedEnough, walkDuration, WAVE_TICKS } from './cat-motion';
import { ANIMATIONS, SHEET_COLS } from './sprite-sheet';

describe('sprite sheet', () => {
  it('fits every animation in the 8-column sheet', () => {
    for (const [name, a] of Object.entries(ANIMATIONS)) expect(a.frames, name).toBeLessThanOrEqual(SHEET_COLS);
    expect(new Set(Object.values(ANIMATIONS).map((a) => a.row)).size).toBe(Object.keys(ANIMATIONS).length);
  });
});

describe('frameFor', () => {
  it('loops each animation through all of its frames', () => {
    expect([0, 1, 2, 7, 8].map((t) => frameFor('walk', t).index)).toEqual([0, 1, 2, 7, 0]);
    expect(frameFor('sleep', 4)).toEqual({ anim: 'sleep', index: 1 });
    expect(frameFor('think', 13)).toEqual({ anim: 'think', index: 0 });
    expect([0, 2, 4, 6].map((t) => frameFor('wave', t).index)).toEqual([0, 1, 2, 3]);
  });

  it('blinks at the start of each idle loop, then breathes', () => {
    expect([0, 1, 2].map((t) => frameFor('idle', t))).toEqual([0, 1, 2].map((index) => ({ anim: 'blink', index })));
    expect(frameFor('idle', 3).anim).toBe('idle');
    expect(frameFor('idle', 48).anim).toBe('blink');
    for (let t = 0; t < 200; t++) expect(frameFor('idle', t).index).toBeLessThan(ANIMATIONS[frameFor('idle', t).anim].frames);
  });

  it('waves twice', () => {
    expect(WAVE_TICKS).toBe(16);
  });
});

describe('positions', () => {
  const vp = { width: 1280, height: 800 };

  it('rests in the bottom-right corner', () => {
    expect(homePosition(vp)).toEqual({ x: 1280 - CAT_SIZE - 24, y: 800 - CAT_SIZE - 24 });
  });

  it('stands beside the highlighted header, inside the viewport', () => {
    expect(besideBox({ top: 180, left: 330, width: 260, height: 40 }, vp)).toEqual({ x: 602, y: 200 - CAT_SIZE / 2 });
    expect(besideBox({ top: 180, left: 900, width: 400, height: 40 }, vp).x).toBe(1280 - CAT_SIZE - 8);
    expect(besideBox({ top: -200, left: 10, width: 100, height: 40 }, vp).y).toBe(8);
  });

  it('walks at a sane speed and ignores tiny moves', () => {
    expect(walkDuration({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(300);
    expect(walkDuration({ x: 0, y: 0 }, { x: 350, y: 0 })).toBe(1000);
    expect(walkDuration({ x: 0, y: 0 }, { x: 5000, y: 0 })).toBe(1500);
    expect(movedEnough({ x: 0, y: 0 }, { x: 10, y: 10 })).toBe(false);
    expect(movedEnough({ x: 0, y: 0 }, { x: 30, y: 0 })).toBe(true);
  });
});

