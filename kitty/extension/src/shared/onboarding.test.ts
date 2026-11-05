import { describe, expect, it } from 'vitest';
import { checkServer, providerLabel } from './onboarding';

const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('checkServer', () => {
  it('accepts a Kitty /health response', async () => {
    let called = '';
    const r = await checkServer('https://kitty.example.app', (async (u: string) => { called = u; return res(200, { ok: true, provider: 'bharatcode', version: '0.1.0' }); }) as typeof fetch);
    expect(called).toBe('https://kitty.example.app/health');
    expect(r).toMatchObject({ ok: true, provider: 'bharatcode', version: '0.1.0' });
  });

  it('rejects bad URLs, non-Kitty servers, HTTP errors and network failures', async () => {
    expect(await checkServer('ftp://x', fetch)).toMatchObject({ ok: false, message: expect.stringMatching(/valid/) });
    expect(await checkServer('https://x.dev', (async () => res(200, { hello: 'world' })) as typeof fetch)).toMatchObject({ ok: false, message: expect.stringMatching(/not a Kitty server/) });
    expect(await checkServer('https://x.dev', (async () => res(502, {})) as typeof fetch)).toMatchObject({ ok: false, message: expect.stringMatching(/502/) });
    expect(await checkServer('https://x.dev', (async () => { throw new TypeError('fetch failed'); }) as typeof fetch)).toMatchObject({ ok: false, message: expect.stringMatching(/reach/) });
  });

  it('times out slow servers', async () => {
    const hang = ((_u: string, init?: RequestInit) => new Promise<Response>((_r, rej) => init?.signal?.addEventListener('abort', () => rej(init.signal?.reason)))) as typeof fetch;
    expect(await checkServer('https://x.dev', hang, 30)).toMatchObject({ ok: false, message: expect.stringMatching(/No answer/) });
  });

  it('labels providers in plain words', () => {
    expect(providerLabel('mock')).toMatch(/Mock/);
    expect(providerLabel('bharatcode')).toMatch(/BharatCode/);
  });
});

describe('tutor level', () => {
  it('follows the Git path on auto, or the chosen level', async () => {
    const { tutorLevel } = await import('./settings');
    expect(tutorLevel('auto', 0)).toBe('beginner');
    expect(tutorLevel(undefined, 5)).toBe('intermediate');
    expect(tutorLevel('auto', 12)).toBe('advanced');
    expect(tutorLevel('beginner', 12)).toBe('beginner');
  });
});

describe('server URL', () => {
  it('uses the hosted server by default and recognises local URLs', async () => {
    const { HOSTED_SERVER_URL, isLocalUrl } = await import('./config');
    expect(HOSTED_SERVER_URL).toBe('https://kitty-server.vercel.app');
    expect(isLocalUrl('http://localhost:8787')).toBe(true);
    expect(isLocalUrl('http://127.0.0.1:8787/')).toBe(true);
    expect(isLocalUrl('https://kitty-server.vercel.app')).toBe(false);
  });
});
