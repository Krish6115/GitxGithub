// POST /tour: streamed progress events (SSE) followed by a result or error event.
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Env } from '../env.js';
import { createGitHubClient } from '../github/client.js';
import { LruCache } from '../lib/lru.js';
import { clientIp, createRateLimiter } from '../lib/rate-limit.js';
import type { UsageLogger } from '../lib/usage-log.js';
import { KittyError, toKittyError } from '../llm/errors.js';
import { selectProvider } from '../llm/index.js';
import { TourRequestSchema, type TourResult } from '../tour/schema.js';
import { getTour } from '../tour/service.js';

export interface TourRouteDeps {
  githubFetch?: typeof fetch;
  llmFetch?: typeof fetch;
  logger?: UsageLogger;
  keepAliveMs?: number;
}

export function tourRoute(env: Env, deps: TourRouteDeps = {}): Hono {
  const route = new Hono();
  const cache = new LruCache<TourResult>(100, env.TOUR_CACHE_TTL_MIN * 60_000);
  const limiter = createRateLimiter(env.RATE_LIMIT_PER_MIN);

  route.post('/tour', async (c) => {
    const body = TourRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ code: 'bad_request', message: 'Expected {"owner": string, "repo": string}.' }, 400);
    const userKey = c.req.header('x-kitty-key');
    const githubToken = c.req.header('x-kitty-github-token')?.trim() || env.GITHUB_TOKEN;

    let selected;
    try {
      selected = selectProvider(env, userKey, { ...(deps.llmFetch ? { fetchImpl: deps.llmFetch } : {}), ...(deps.logger ? { logger: deps.logger } : {}) });
    } catch (e) {
      const err = toKittyError(e);
      return c.json({ code: err.code, message: err.message }, err.status as 401);
    }
    if (!selected.byok) {
      const rl = limiter.take(clientIp(c.req.raw.headers));
      if (!rl.ok) {
        c.header('Retry-After', String(rl.retryAfterSec));
        return c.json({ code: 'rate_limited', message: `Too many tours. Try again in ${rl.retryAfterSec}s or add your own key.` }, 429);
      }
    }
    const github = createGitHubClient({ token: githubToken, ...(deps.githubFetch ? { fetchImpl: deps.githubFetch } : {}) });

    return streamSSE(c, async (stream) => {
      const ping = setInterval(() => void stream.writeSSE({ event: 'ping', data: '{}' }), deps.keepAliveMs ?? 10_000);
      try {
        const result = await getTour(
          { github, provider: selected.provider, cache, maxSteps: env.TOUR_MAX_STEPS },
          {
            owner: body.data.owner,
            repo: body.data.repo,
            signal: c.req.raw.signal,
            onProgress: (stage, message) => void stream.writeSSE({ event: 'progress', data: JSON.stringify({ stage, message }) }),
          },
        );
        await stream.writeSSE({ event: 'result', data: JSON.stringify(result) });
      } catch (e) {
        const err = e instanceof KittyError ? e : toKittyError(e);
        await stream.writeSSE({ event: 'error', data: JSON.stringify({ code: err.code, message: err.message }) });
      } finally {
        clearInterval(ping);
      }
    });
  });
  return route;
}
