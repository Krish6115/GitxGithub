import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/env.js';
import { VERSION } from '../src/version.js';

describe('GET /health', () => {
  it('reports ok with the mock provider by default', async () => {
    const app = createApp(loadEnv({}));
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, provider: 'mock', version: VERSION });
  });

  it('returns 404 for unknown routes', async () => {
    const app = createApp(loadEnv({}));
    expect((await app.request('/nope')).status).toBe(404);
  });
});
