// POST /explain: SSE stream of `meta`, optional `sources`, answer `delta`s, then `done` (or `error`).
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Env } from '../env.js';
import { streamExplain, ExplainRequestSchema } from '../explain/service.js';
import type { RateLimiter } from '../lib/rate-limit.js';
import { retrieve as defaultRetrieve } from '../rag/retrieve.js';
import { guard, sendEvent, withPings } from './common.js';
import type { TutorRouteDeps } from './tutor.js';

export function explainRoute(env: Env, limiter: RateLimiter, deps: TutorRouteDeps = {}): Hono {
  const route = new Hono();
  route.post('/explain', async (c) => {
    const body = ExplainRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ code: 'bad_request', message: 'Expected {"text": string, "page"?: {...}}.' }, 400);
    const g = guard(c, env, limiter, deps);
    if (g instanceof Response) return g;
    const retrieve = deps.retrieve ?? ((q: string, k: number) => defaultRetrieve(q, k));
    return streamSSE(c, (stream) =>
      withPings(stream, deps.keepAliveMs ?? 10_000, async () => {
        for await (const ev of streamExplain({ provider: g.provider, retrieve }, body.data, c.req.raw.signal)) {
          if (ev.type === 'delta') await sendEvent(stream, 'delta', { text: ev.text });
          else await sendEvent(stream, ev.type, ev);
        }
      }),
    );
  });
  return route;
}
