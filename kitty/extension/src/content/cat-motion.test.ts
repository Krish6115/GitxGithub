import { describe, expect, it } from 'vitest';
import { besideBox, CAT_SIZE, frameFor, homePosition, movedEnough, walkDuration } from './cat-motion';
import { FRAMES, PALETTE } from './sprite-frames';

describe('sprite frames', () => {
  it('are all 16x16 and use only palette characters', () => {
    for (const [name, rows] of Object.entries(FRAMES)) {
      expect(rows, name).toHaveLength(16);
      for (const row of rows) {
        expect(row, name).toHaveLength(16);
        for (const ch of row) expect(ch === '.' || ch in PALETTE, `${name}: ${ch}`).toBe(true);
      }
    }
  });

  it('walk frames actually differ (legs move)', () => {
    expect(FRAMES.walkA.join()).not.toBe(FRAMES.walkB.join());
    expect(FRAMES.walkB.join()).not.toBe(FRAMES.walkC.join());
  });
});

describe('frameFor', () => {
  it('cycles walk frames, blinks and flicks the tail when idle, and sleeps', () => {
    expect([0, 1, 2, 3, 4].map((t) => frameFor('walk', t))).toEqual(['walkA', 'walkB', 'walkC', 'walkB', 'walkA']);
    expect(frameFor('idle', 0)).toBe('blink');
    expect(frameFor('idle', 21)).toBe('tail');
    expect(frameFor('idle', 30)).toBe('idle');
    expect(frameFor('think', 30)).toBe('idle');
    expect(frameFor('sleep', 7)).toBe('sleep');
  });
});

describe('positions', () => {
  const vp = { width: 1280, height: 800 };

  it('rests in the bottom-right corner', () => {
    expect(homePosition(vp)).toEqual({ x: 1280 - CAT_SIZE - 24, y: 800 - CAT_SIZE - 24 });
  });

  it('stands beside the highlighted header, inside the viewport', () => {
    expect(besideBox({ top: 180, left: 330, width: 260, height: 40 }, vp)).toEqual({ x: 602, y: 168 });
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

