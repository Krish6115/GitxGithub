import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env.js';
import { healthRoute } from './routes/health.js';
import { tourRoute, type TourRouteDeps } from './routes/tour.js';

export type AppDeps = TourRouteDeps;

export function createApp(env: Env, deps: AppDeps = {}): Hono {
  const app = new Hono();
  // Only the Kitty extension calls this API from a browser.
  app.use(
    '*',
    cors({
      origin: (origin) => (origin.startsWith('chrome-extension://') ? origin : null),
      allowHeaders: ['Content-Type', 'X-Kitty-Key', 'X-Kitty-GitHub-Token'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
    }),
  );
  app.route('/', healthRoute(env));
  app.route('/', tourRoute(env, deps));
  return app;
}
