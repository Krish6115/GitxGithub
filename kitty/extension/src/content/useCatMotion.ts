// Drives Kitty's position and animation frames: walks to a target, thinks while loading, sleeps when idle.
import { useEffect, useRef, useState } from 'preact/hooks';
import { frameFor, homePosition, movedEnough, SLEEP_AFTER_MS, TICK_MS, viewport, walkDuration, WAVE_TICKS, type CatMode, type Point } from './cat-motion';
import type { Frame } from './sprite-sheet';

const reducedMotion = (): boolean => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export interface CatMotion {
  pos: Point;
  frame: Frame;
  flip: boolean;
  mode: CatMode;
  /** CSS transition duration for the current move (ms). */
  moveMs: number;
}

/** `target` null = go home (bottom-right). `thinking` plays the think loop; the cat waves hello on arrival and when thinking ends. */
export function useCatMotion(target: Point | null, thinking: boolean): CatMotion {
  const [vp, setVp] = useState(viewport);
  const [pos, setPos] = useState<Point>(() => homePosition(viewport()));
  const [walkingUntil, setWalkingUntil] = useState(0);
  const [moveMs, setMoveMs] = useState(0);
  const [flip, setFlip] = useState(false);
  const [tick, setTick] = useState(0);
  const [asleep, setAsleep] = useState(false);
  const lastActivity = useRef(Date.now());
  const [waveUntil, setWaveUntil] = useState(() => Date.now() + WAVE_TICKS * TICK_MS);
  const wasThinking = useRef(thinking);

  useEffect(() => {
    if (wasThinking.current && !thinking) setWaveUntil(Date.now() + WAVE_TICKS * TICK_MS);
    wasThinking.current = thinking;
  }, [thinking]);

  useEffect(() => {
    const onResize = (): void => setVp(viewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Walk to the destination when it changes noticeably.
  const dest = target ?? homePosition(vp);
  const walk = useRef({ from: pos, start: 0, ms: 0 });
  useEffect(() => {
    if (!movedEnough(pos, dest, target ? 24 : 2)) return;
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
  }, [dest.x, dest.y]);

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

  const walking = Date.now() < walkingUntil;
  const waving = Date.now() < waveUntil;
  const mode: CatMode = walking ? 'walk' : thinking ? 'think' : waving ? 'wave' : asleep && !target ? 'sleep' : 'idle';
  // the sprite faces right: flip to face the way it walks, and to face into the page while it rests
  return { pos, frame: frameFor(mode, tick), flip: walking ? flip : true, mode, moveMs };
}
