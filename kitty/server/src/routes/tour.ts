// POST /tour: streamed progress events (SSE) followed by a result or error event.
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Env } from '../env.js';
import { createGitHubClient } from '../github/client.js';
import { LruCache } from '../lib/lru.js';
import type { RateLimiter } from '../lib/rate-limit.js';
import { TourRequestSchema, type TourResult } from '../tour/schema.js';
import { getTour } from '../tour/service.js';
import { guard, sendEvent, withPings, type RouteDeps } from './common.js';

export type TourRouteDeps = RouteDeps;

export function tourRoute(env: Env, limiter: RateLimiter, deps: RouteDeps = {}): Hono {
  const route = new Hono();
  const cache = new LruCache<TourResult>(100, env.TOUR_CACHE_TTL_MIN * 60_000);

  route.post('/tour', async (c) => {
    const body = TourRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ code: 'bad_request', message: 'Expected {"owner": string, "repo": string}.' }, 400);
    const g = guard(c, env, limiter, deps);
    if (g instanceof Response) return g;
    const githubToken = c.req.header('x-kitty-github-token')?.trim() || env.GITHUB_TOKEN;
    const github = createGitHubClient({ token: githubToken, ...(deps.githubFetch ? { fetchImpl: deps.githubFetch } : {}) });

    return streamSSE(c, (stream) =>
      withPings(stream, deps.keepAliveMs ?? 10_000, async () => {
        const result = await getTour(
          { github, provider: g.provider, cache, maxSteps: env.TOUR_MAX_STEPS },
          {
            owner: body.data.owner,
            repo: body.data.repo,
            issue: body.data.issue,
            signal: c.req.raw.signal,
            onProgress: (stage, message) => void sendEvent(stream, 'progress', { stage, message }),
            onStart: (start) => void sendEvent(stream, 'start', start),
            onStep: (step, index) => void sendEvent(stream, 'step', { index, step }),
          },
        );
        await sendEvent(stream, 'result', result);
      }),
    );
  });
  return route;
}
