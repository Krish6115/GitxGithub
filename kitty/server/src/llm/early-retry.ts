// Stream with one retry when the provider stalls or drops before any text was produced (seen live occasionally).
import { KittyError } from './errors.js';
import type { ChatRequest, Provider, StreamEvent } from './types.js';

const TRANSIENT = new Set(['timeout', 'upstream_error', 'upstream_unavailable']);

export async function* streamWithEarlyRetry(provider: Provider, req: ChatRequest): AsyncGenerator<StreamEvent> {
  let produced = false;
  for (let attempt = 0; ; attempt++) {
    try {
      for await (const ev of provider.stream(req)) {
        if (ev.type === 'delta') produced = true;
        yield ev;
      }
      return;
    } catch (e) {
      const transient = e instanceof KittyError && TRANSIENT.has(e.code);
      if (attempt > 0 || produced || !transient || req.signal?.aborted) throw e;
    }
  }
}
