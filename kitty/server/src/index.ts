// Vercel entry: the platform runs the default-exported Hono app (no listen()). Local dev uses src/local.ts.
import { createApp } from './create-app.js';
import { loadEnv } from './env.js';

export default createApp(loadEnv());
