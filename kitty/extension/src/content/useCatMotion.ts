// Drives Kitty's position and animation frames: walks to a target, thinks while loading, sleeps when idle,
// and can be picked up and dropped anywhere with the mouse (the spot is remembered).
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  clampToViewport,
  frameFor,
  HOME_KEY,
  movedEnough,
  restingPosition,
  SLEEP_AFTER_MS,
  swingFor,
  TICK_MS,
  toSavedHome,
  viewport,
  walkDuration,
  WAVE_TICKS,
  type CatMode,
  type Point,
  type SavedHome,
} from './cat-motion';
import type { Frame } from './sprite-sheet';

const reducedMotion = (): boolean => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const DRAG_THRESHOLD = 5;
const LANDED_MS = 450;

export interface CatMotion {
  pos: Point;
  frame: Frame;
  flip: boolean;
  mode: CatMode;
  /** CSS transition duration for the current move (ms). */
  moveMs: number;
  /** Swing angle (degrees) while held. */
  swing: number;
  onPointerDown: (e: PointerEvent) => void;
  /** True once if the last pointer press was a drag (so it shouldn't count as a click). */
  consumeDrag: () => boolean;
}

/** `target` null = go to the resting spot. `thinking` plays the think loop; the cat waves hello on arrival and when thinking ends. */
export function useCatMotion(target: Point | null, thinking: boolean): CatMotion {
  const [vp, setVp] = useState(viewport);
  const [saved, setSaved] = useState<SavedHome | null>(null);
  const [pos, setPos] = useState<Point>(() => restingPosition(viewport(), null));
  const [walkingUntil, setWalkingUntil] = useState(0);
  const [moveMs, setMoveMs] = useState(0);
  const [flip, setFlip] = useState(false);
  const [tick, setTick] = useState(0);
  const [asleep, setAsleep] = useState(false);
  const lastActivity = useRef(Date.now());
  const [waveUntil, setWaveUntil] = useState(() => Date.now() + WAVE_TICKS * TICK_MS);
  const wasThinking = useRef(thinking);
  const [held, setHeld] = useState(false);
  const [landedUntil, setLandedUntil] = useState(0);
  const [swing, setSwing] = useState(0);
  const [fast, setFast] = useState(false);
  const dragged = useRef(false);

  useEffect(() => {
    void chrome.storage.local.get(HOME_KEY).then((r) => {
      const h = r[HOME_KEY] as SavedHome | undefined;
      if (!h || !Number.isFinite(h.right) || !Number.isFinite(h.bottom)) return;
      // start at the saved spot instead of walking there from the corner
      const p = restingPosition(viewport(), h);
      walk.current = { from: p, start: 0, ms: 0 };
      setPos(p);
      setSaved(h);
    });
  }, []);

  useEffect(() => {
    if (wasThinking.current && !thinking) setWaveUntil(Date.now() + WAVE_TICKS * TICK_MS);
    wasThinking.current = thinking;
  }, [thinking]);

  useEffect(() => {
    const onResize = (): void => setVp(viewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Walk to the destination when it changes noticeably (not while the user is holding the cat).
  const dest = target ?? restingPosition(vp, saved);
  const walk = useRef({ from: pos, start: 0, ms: 0 });
  useEffect(() => {
    if (held || !movedEnough(pos, dest, target ? 24 : 2)) return;
    // where the cat is on screen right now (it may still be mid-walk towards the old target)
    const w = walk.current;
    const t = w.ms ? Math.min(1, (Date.now() - w.start) / w.ms) : 1;
    const here = { x: w.from.x + (pos.x - w.from.x) * t, y: w.from.y + (pos.y - w.from.y) * t };
    const ms = reducedMotion() ? 0 : walkDuration(here, dest);
    if (Math.abs(dest.x - here.x) > 8) setFlip(dest.x < here.x); // the sprite faces right; flip when walking left
    walk.current = { from: here, start: Date.now(), ms };
    setMoveMs(ms);
    setWalkingUntil(Date.now() + ms);
    setPos(dest);
  }, [dest.x, dest.y, held]);

  // Animation clock + idle detection (page activity wakes the cat).
  useEffect(() => {
    if (reducedMotion()) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setAsleep(Date.now() - lastActivity.current > SLEEP_AFTER_MS);
    }, TICK_MS);
    const wake = (): void => {
      lastActivity.current = Date.now();
    };
    for (const ev of ['mousemove', 'keydown', 'scroll', 'click']) window.addEventListener(ev, wake, { passive: true });
    return () => {
      clearInterval(id);
      for (const ev of ['mousemove', 'keydown', 'scroll', 'click']) window.removeEventListener(ev, wake);
    };
  }, []);

  /** Pick the cat up: it follows the pointer, swings with the motion and is dropped where the pointer is released. */
  const onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    const start = { x: e.clientX, y: e.clientY };
    const grab = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    let last = { x: e.clientX, t: performance.now() };
    let vx = 0;
    let moving = false;
    let current = pos;
    dragged.current = false;

    const move = (ev: PointerEvent): void => {
      if (!moving) {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_THRESHOLD) return;
        moving = true;
        dragged.current = true;
        el.setPointerCapture?.(ev.pointerId);
        setHeld(true);
        setMoveMs(0);
        setWalkingUntil(0);
      }
      const now = performance.now();
      const dt = Math.max(1, now - last.t);
      vx = vx * 0.6 + ((ev.clientX - last.x) / dt) * 0.4; // smoothed px/ms
      last = { x: ev.clientX, t: now };
      current = clampToViewport({ x: ev.clientX - grab.x, y: ev.clientY - grab.y }, viewport());
      setPos(current);
      setSwing(swingFor(vx));
      setFast(Math.abs(vx) > 1.2);
      if (Math.abs(vx) > 0.15) setFlip(vx < 0);
      lastActivity.current = Date.now();
    };
    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!moving) return;
      const home = toSavedHome(current, viewport());
      walk.current = { from: current, start: 0, ms: 0 };
      setHeld(false);
      setSwing(0);
      setFast(false);
      setSaved(home);
      void chrome.storage.local.set({ [HOME_KEY]: home });
      setLandedUntil(Date.now() + LANDED_MS);
      setWaveUntil(Date.now() + LANDED_MS + WAVE_TICKS * TICK_MS);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const consumeDrag = (): boolean => {
    const was = dragged.current;
    dragged.current = false;
    return was;
  };

  const now = Date.now();
  const walking = !held && now < walkingUntil;
  const landed = now < landedUntil;
  const waving = now < waveUntil;
  const mode: CatMode = held
    ? 'held'
    : landed
      ? 'landed'
      : walking
        ? 'walk'
        : thinking
          ? 'think'
          : waving
            ? 'wave'
            : asleep && !target
              ? 'sleep'
              : 'idle';
  // the sprite faces right: flip to face the way it moves, and to face into the page while it rests
  const facing = held || walking ? flip : true;
  return { pos, frame: frameFor(mode, tick, fast), flip: facing, mode, moveMs, swing, onPointerDown, consumeDrag };
}
