// Three-stage timeout for streamed calls: first chunk, silence between chunks, and a total cap.
import type { StreamTimeouts } from './budgets.js';
import { KittyError } from './errors.js';

export interface Watchdog {
  signal: AbortSignal;
  /** Call on every received chunk (content or reasoning) to switch to / reset the idle timer. */
  activity(): void;
  /** Stop now with this error (e.g. a caller's own "no answer text yet" limit). */
  abortWith(reason: unknown): void;
  dispose(): void;
}

const MESSAGES = {
  first_token: 'Kitty is still waiting in the model queue. Please try again in a moment.',
  idle: 'The model stopped responding mid-answer. Please try again.',
  total: 'Kitty took too long to finish this answer. Please try again.',
} as const;

export function createWatchdog(t: StreamTimeouts, parent?: AbortSignal): Watchdog {
  const ctrl = new AbortController();
  const fail = (stage: keyof typeof MESSAGES): void => {
    if (!ctrl.signal.aborted) ctrl.abort(new KittyError('timeout', MESSAGES[stage]));
  };
  const total = setTimeout(() => fail('total'), t.totalMs);
  let stageTimer = setTimeout(() => fail('first_token'), t.firstTokenMs);
  const onParentAbort = (): void => ctrl.abort(parent?.reason);
  if (parent?.aborted) onParentAbort();
  else parent?.addEventListener('abort', onParentAbort, { once: true });
  return {
    signal: ctrl.signal,
    activity() {
      clearTimeout(stageTimer);
      stageTimer = setTimeout(() => fail('idle'), t.idleMs);
    },
    abortWith(reason) {
      if (!ctrl.signal.aborted) ctrl.abort(reason);
    },
    dispose() {
      clearTimeout(total);
      clearTimeout(stageTimer);
      parent?.removeEventListener('abort', onParentAbort);
    },
  };
}
