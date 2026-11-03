// Stream with one retry when the provider stalls or drops before any text was produced (seen live occasionally).
// With `deadline` (epoch ms) the retry only happens if there is still time, and it may only wait for the time that is
// left, so a busy model costs one bounded wait instead of two full ones.
import { KittyError } from './errors.js';
import type { ChatRequest, Provider, StreamEvent } from './types.js';

const TRANSIENT = new Set(['timeout', 'upstream_error', 'upstream_unavailable']);

export async function* streamWithEarlyRetry(provider: Provider, req: ChatRequest, deadline?: number): AsyncGenerator<StreamEvent> {
  let produced = false;
  for (let attempt = 0; ; attempt++) {
    const left = deadline === undefined ? undefined : deadline - Date.now();
    // the deadline bounds the wait for the first words; once text flows, the normal total limit applies
    const attemptReq = left === undefined ? req : { ...req, firstTokenMs: Math.max(1000, Math.min(req.firstTokenMs ?? Infinity, left)) };
    try {
      for await (const ev of provider.stream(attemptReq)) {
        if (ev.type === 'delta') produced = true;
        yield ev;
      }
      return;
    } catch (e) {
      const transient = e instanceof KittyError && TRANSIENT.has(e.code);
      const timeLeft = deadline === undefined || deadline - Date.now() > 15_000;
      if (attempt > 0 || produced || !transient || req.signal?.aborted || !timeLeft) throw e;
    }
  }
}
