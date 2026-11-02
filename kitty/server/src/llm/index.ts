// Picks the provider for a request and wraps it with usage logging.
import type { Env } from '../env.js';
import { consoleUsageLogger, usageEntry, type UsageLogger } from '../lib/usage-log.js';
import { createBharatCodeProvider } from './bharatcode.js';
import { KittyError } from './errors.js';
import { createMockProvider } from './mock.js';
import type { Provider, StreamEvent } from './types.js';

export interface ProviderDeps {
  fetchImpl?: typeof fetch;
  logger?: UsageLogger;
}

/**
 * A user-supplied key (X-Kitty-Key) always means BharatCode with that key.
 * Otherwise LLM_PROVIDER decides; "bharatcode" without a server key is a setup error the UI can explain.
 */
export function selectProvider(env: Env, userKey: string | undefined, deps: ProviderDeps = {}): { provider: Provider; byok: boolean } {
  const key = userKey?.trim();
  const make = (apiKey: string): Provider =>
    createBharatCodeProvider({
      baseUrl: env.BHARATCODE_BASE_URL,
      model: env.BHARATCODE_MODEL,
      apiKey,
      timeoutMs: env.LLM_TIMEOUT_MS,
      ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
    });
  let provider: Provider;
  if (key) provider = make(key);
  else if (env.LLM_PROVIDER === 'mock') provider = createMockProvider();
  else if (env.BHARATCODE_API_KEY) provider = make(env.BHARATCODE_API_KEY);
  else throw new KittyError('key_required', 'This Kitty server has no BharatCode key. Add your own key in Kitty settings.');
  return { provider: withUsageLogging(provider, deps.logger ?? consoleUsageLogger), byok: Boolean(key) };
}

export function withUsageLogging(p: Provider, log: UsageLogger): Provider {
  return {
    name: p.name,
    async chat(req) {
      const t0 = performance.now();
      const result = await p.chat(req);
      log(usageEntry(req.kind, p.name, result, performance.now() - t0));
      return result;
    },
    async *stream(req): AsyncGenerator<StreamEvent> {
      const t0 = performance.now();
      for await (const ev of p.stream(req)) {
        if (ev.type === 'done') log(usageEntry(req.kind, p.name, ev.result, performance.now() - t0));
        yield ev;
      }
    },
  };
}
