// POST /tutor: SSE stream of `sources`, then answer `delta`s, then `done` (or `error`).
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Env } from '../env.js';
import type { RateLimiter } from '../lib/rate-limit.js';
import { retrieve as defaultRetrieve, type RetrievedChunk } from '../rag/retrieve.js';
import { TutorRequestSchema } from '../tutor/history.js';
import { streamTutor } from '../tutor/service.js';
import { guard, sendEvent, withPings, type RouteDeps } from './common.js';

export interface TutorRouteDeps extends RouteDeps {
  retrieve?: (query: string, k: number) => RetrievedChunk[];
}

export function tutorRoute(env: Env, limiter: RateLimiter, deps: TutorRouteDeps = {}): Hono {
  const route = new Hono();
  route.post('/tutor', async (c) => {
    const body = TutorRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ code: 'bad_request', message: 'Expected {"question": string (1-2000 chars), "history"?: [...]}.' }, 400);
    const g = guard(c, env, limiter, deps);
    if (g instanceof Response) return g;
    const retrieve = deps.retrieve ?? ((q: string, k: number) => defaultRetrieve(q, k));

    return streamSSE(c, (stream) =>
      withPings(stream, deps.keepAliveMs ?? 10_000, async () => {
        for await (const ev of streamTutor({ provider: g.provider, retrieve }, body.data, c.req.raw.signal)) {
          if (ev.type === 'delta') await sendEvent(stream, 'delta', { text: ev.text });
          else await sendEvent(stream, ev.type, ev);
        }
      }),
    );
  });
  return route;
}
