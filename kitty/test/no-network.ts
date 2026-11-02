// Vitest setup: any real network call fails the test. Inject a fake fetch instead.
import { beforeAll } from 'vitest';

beforeAll(() => {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    throw new Error(`Network access is disabled in tests (tried ${url}). Inject a fake fetch.`);
  }) as typeof fetch;
});
