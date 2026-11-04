// POST /ci-explain: SSE stream of `meta` (which job and step failed), answer `delta`s, then `done` (or `error`).
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { CiRequestSchema, streamCiExplain } from '../ci/service.js';
import type { Env } from '../env.js';
import { createGitHubClient } from '../github/client.js';
import type { RateLimiter } from '../lib/rate-limit.js';
import { guard, sendEvent, withPings, type RouteDeps } from './common.js';

export function ciRoute(env: Env, limiter: RateLimiter, deps: RouteDeps = {}): Hono {
  const route = new Hono();
  route.post('/ci-explain', async (c) => {
    const body = CiRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ code: 'bad_request', message: 'Expected {"owner": string, "repo": string, "run": number, "job"?: number}.' }, 400);
    const g = guard(c, env, limiter, deps);
    if (g instanceof Response) return g;
    const token = c.req.header('x-kitty-github-token')?.trim() || env.GITHUB_TOKEN;
    const github = createGitHubClient({ token, ...(deps.githubFetch ? { fetchImpl: deps.githubFetch } : {}) });
    return streamSSE(c, (stream) =>
      withPings(stream, deps.keepAliveMs ?? 10_000, async () => {
        for await (const ev of streamCiExplain({ github, provider: g.provider }, body.data, c.req.raw.signal)) {
          if (ev.type === 'delta') await sendEvent(stream, 'delta', { text: ev.text });
          else await sendEvent(stream, ev.type, ev);
        }
      }),
    );
  });
  return route;
}
