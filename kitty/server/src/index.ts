import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { loadEnv } from './env.js';

// Local dev: read kitty/server/.env if present. In production, env comes from the host.
const dotEnvPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(dotEnvPath)) process.loadEnvFile(dotEnvPath);

const env = loadEnv();
const app = createApp(env);

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Kitty server on http://localhost:${info.port} (provider: ${env.LLM_PROVIDER})`);
});
