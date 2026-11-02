// Shared route plumbing: provider selection (BYOK), per-IP rate limit for server-key requests, SSE helpers.
import type { Context } from 'hono';
import type { SSEStreamingApi } from 'hono/streaming';
import type { Env } from '../env.js';
import { clientIp, type RateLimiter } from '../lib/rate-limit.js';
import type { UsageLogger } from '../lib/usage-log.js';
import { KittyError, toKittyError } from '../llm/errors.js';
import { selectProvider } from '../llm/index.js';
import type { Provider } from '../llm/types.js';

export interface RouteDeps {
  githubFetch?: typeof fetch;
  llmFetch?: typeof fetch;
  logger?: UsageLogger;
  keepAliveMs?: number;
}

/** Pick the provider for this request and apply the rate limit, or return the error response to send. */
export function guard(c: Context, env: Env, limiter: RateLimiter, deps: RouteDeps): { provider: Provider } | Response {
  let selected;
  try {
    selected = selectProvider(env, c.req.header('x-kitty-key'), {
      ...(deps.llmFetch ? { fetchImpl: deps.llmFetch } : {}),
      ...(deps.logger ? { logger: deps.logger } : {}),
    });
  } catch (e) {
    const err = toKittyError(e);
    return c.json({ code: err.code, message: err.message }, err.status as 401);
  }
  if (!selected.byok) {
    const rl = limiter.take(clientIp(c.req.raw.headers));
    if (!rl.ok) {
      c.header('Retry-After', String(rl.retryAfterSec));
      return c.json({ code: 'rate_limited', message: `Too many requests. Try again in ${rl.retryAfterSec}s or add your own key.` }, 429);
    }
  }
  return { provider: selected.provider };
}

export const sendEvent = (stream: SSEStreamingApi, event: string, data: unknown): Promise<void> =>
  stream.writeSSE({ event, data: JSON.stringify(data) });

/** Run `work` with keep-alive pings; any thrown error becomes an `error` event. */
export async function withPings(stream: SSEStreamingApi, keepAliveMs: number, work: () => Promise<void>): Promise<void> {
  const ping = setInterval(() => void stream.writeSSE({ event: 'ping', data: '{}' }), keepAliveMs);
  try {
    await work();
  } catch (e) {
    const err = e instanceof KittyError ? e : toKittyError(e);
    await sendEvent(stream, 'error', { code: err.code, message: err.message });
  } finally {
    clearInterval(ping);
  }
}
