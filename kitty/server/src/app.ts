import { Hono } from 'hono';
import type { Env } from './env.js';
import { healthRoute } from './routes/health.js';

export function createApp(env: Env): Hono {
  const app = new Hono();
  app.route('/', healthRoute(env));
  return app;
}
