import { Hono } from 'hono';
import type { Env } from '../env.js';
import { VERSION } from '../version.js';

export function healthRoute(env: Pick<Env, 'LLM_PROVIDER'>): Hono {
  const route = new Hono();
  route.get('/health', (c) => c.json({ ok: true, provider: env.LLM_PROVIDER, version: VERSION }));
  return route;
}
