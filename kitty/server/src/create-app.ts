import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env.js';
import { createRateLimiter } from './lib/rate-limit.js';
import { healthRoute } from './routes/health.js';
import { contributeRoute } from './routes/contribute.js';
import { explainRoute } from './routes/explain.js';
import { tourRoute } from './routes/tour.js';
import { tutorRoute, type TutorRouteDeps } from './routes/tutor.js';

export type AppDeps = TutorRouteDeps;

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
  // one per-IP budget shared by all model-backed routes
  const limiter = createRateLimiter(env.RATE_LIMIT_PER_MIN);
  app.route('/', healthRoute(env));
  app.route('/', tourRoute(env, limiter, deps));
  app.route('/', tutorRoute(env, limiter, deps));
  app.route('/', explainRoute(env, limiter, deps));
  app.route('/', contributeRoute(env, limiter, deps));
  return app;
}
