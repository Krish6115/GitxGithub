// Vercel entry: the platform runs the default-exported Hono app (no listen()). Local dev uses src/local.ts.
// Vercel's Hono preset only accepts an entry file that imports hono itself.
import { Hono } from 'hono';
import { createApp } from './create-app.js';
import { loadEnv } from './env.js';

const app = createApp(loadEnv());
if (!(app instanceof Hono)) throw new Error('createApp must return a Hono app');

export default app;
