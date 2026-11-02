import { describe, expect, it } from 'vitest';
import { createApp } from '../src/create-app.js';
import { loadEnv } from '../src/env.js';
import { fakeGitHubFetch, fixtureRepo } from './fixtures/repo.js';

const silent = () => {};
const post = (app: ReturnType<typeof createApp>, body: unknown, headers: Record<string, string> = {}) =>
  app.request('/tour', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

/** Parse an SSE body into [{event, data}] (pings skipped). */
async function events(res: Response): Promise<{ event: string; data: unknown }[]> {
  const text = await res.text();
  return text
    .split(/\n\n/)
    .map((block) => {
      const event = /^event: (.*)$/m.exec(block)?.[1] ?? 'message';
      const data = block.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6)).join('\n');
      return { event, data: data ? JSON.parse(data) : null };
    })
    .filter((e) => e.data !== null && e.event !== 'ping');
}

describe('POST /tour', () => {
  const f = fixtureRepo();
  const app = createApp(loadEnv({}), { githubFetch: fakeGitHubFetch(f), logger: silent });

  it('streams progress events and then a schema-valid result (mock provider)', async () => {
    const res = await post(app, { owner: f.owner, repo: f.repo });
    expect(res.headers.get('content-type')).toMatch(/text\/event-stream/);
    const evs = await events(res);
    expect(evs.filter((e) => e.event === 'progress').map((e) => (e.data as { stage: string }).stage)).toEqual(['fetching', 'ranking', 'thinking', 'writing']);
    const result = evs.at(-1);
    expect(result?.event).toBe('result');
    expect(result?.data).toMatchObject({ meta: { owner: 'acme', repo: 'todo-api', provider: 'mock', partial: false }, tour: { steps: expect.any(Array) } });
  });

  it('reports GitHub errors as an error event', async () => {
    const evs = await events(await post(app, { owner: 'acme', repo: 'missing' }));
    expect(evs.at(-1)).toEqual({ event: 'error', data: { code: 'github_not_found', message: expect.any(String) } });
  });

  it('rejects bad input with 400', async () => {
    expect((await post(app, { owner: 'a/b', repo: 'c' })).status).toBe(400);
    expect((await post(app, 'nope')).status).toBe(400);
  });

  it('rate-limits server-key requests per IP but not BYOK requests', async () => {
    const limited = createApp(loadEnv({ RATE_LIMIT_PER_MIN: '1' }), { githubFetch: fakeGitHubFetch(f), logger: silent });
    const ip = { 'x-forwarded-for': '203.0.113.7' };
    expect((await post(limited, { owner: f.owner, repo: f.repo }, ip)).status).toBe(200);
    const second = await post(limited, { owner: f.owner, repo: f.repo }, ip);
    expect(second.status).toBe(429);
    expect(second.headers.get('retry-after')).toBeTruthy();
    // BYOK skips the limiter (the model call itself is faked by a fetch that fails, so only the status matters here)
    const byok = await post(limited, { owner: f.owner, repo: f.repo }, { ...ip, 'x-kitty-key': 'sk-user' });
    expect(byok.status).toBe(200);
  });

  it('explains a missing server key instead of failing silently', async () => {
    const noKey = createApp(loadEnv({ LLM_PROVIDER: 'bharatcode' }), { githubFetch: fakeGitHubFetch(f), logger: silent });
    const res = await post(noKey, { owner: f.owner, repo: f.repo });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'key_required' });
  });

  it('allows CORS only for the extension origin', async () => {
    const pre = (origin: string) => app.request('/tour', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' } });
    expect((await pre('chrome-extension://abcdef')).headers.get('access-control-allow-origin')).toBe('chrome-extension://abcdef');
    expect((await pre('https://evil.example')).headers.get('access-control-allow-origin')).toBeNull();
  });
});
