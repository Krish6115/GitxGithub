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
  useEffect(() => {
    if (!movedEnough(pos, dest, target ? 24 : 2)) return;
    const ms = reducedMotion() ? 0 : walkDuration(pos, dest);
    setFlip(dest.x < pos.x); // the sprite faces right; flip when walking left
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
  return { pos, frame: frameFor(mode, tick), flip: walking ? flip : false, mode, moveMs };
}
