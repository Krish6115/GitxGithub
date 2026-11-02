import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../src/env.js';
import { withRetry } from '../src/lib/retry.js';
import { createBharatCodeProvider } from '../src/llm/bharatcode.js';
import { KittyError } from '../src/llm/errors.js';
import { selectProvider } from '../src/llm/index.js';
import { createMockProvider } from '../src/llm/mock.js';
import { readSseData } from '../src/llm/sse.js';
import type { ChatRequest } from '../src/llm/types.js';

const req: ChatRequest = { kind: 'explain', messages: [{ role: 'user', content: 'hi' }], maxTokens: 100 };
const json = (status: number, body: unknown): Response =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const ok = (content: string, finish = 'stop') =>
  json(200, { model: 'qwen-3.8-27b', choices: [{ message: { content }, finish_reason: finish }], usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 } });
const stream = (chunks: string[]): Response =>
  new Response(new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(new TextEncoder().encode(ch)); c.close(); } }), { status: 200 });

function provider(fetchImpl: typeof fetch, sleep = vi.fn(async () => {})) {
  return { p: createBharatCodeProvider({ baseUrl: 'https://bc.test/v1/', model: 'qwen-3.8-27b', apiKey: 'sk-test', timeoutMs: 5000, fetchImpl, sleep }), sleep };
}

describe('withRetry', () => {
  it('retries retryable errors with 2s/4s/8s backoff, then gives up', async () => {
    const sleep = vi.fn(async () => {});
    const fn = vi.fn(async () => { throw new KittyError('upstream_unavailable', 'busy', { retryable: true }); });
    await expect(withRetry(fn, { sleep })).rejects.toMatchObject({ code: 'upstream_unavailable' });
    expect(fn).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls.map((c) => (c as unknown[])[0])).toEqual([2000, 4000, 8000]);
  });

  it('does not retry other errors', async () => {
    const fn = vi.fn(async () => { throw new KittyError('auth_failed', 'no'); });
    await expect(withRetry(fn, { sleep: async () => {} })).rejects.toMatchObject({ code: 'auth_failed' });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('readSseData', () => {
  it('handles events split across chunks, CRLF, multi-line data and [DONE]', async () => {
    const body = stream(['data: {"a":', '1}\r\n\r\n', 'event: x\ndata: line1\ndata: line2\n\n', 'data: [DONE]\n\n', 'data: ignored\n\n']).body!;
    const out: string[] = [];
    for await (const d of readSseData(body)) out.push(d);
    expect(out).toEqual(['{"a":1}', 'line1\nline2']);
  });
});

describe('BharatCode provider', () => {
  it('sends an OpenAI-compatible request with Bearer auth', async () => {
    const fetchImpl = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => ok('hello'));
    const { p } = provider(fetchImpl as unknown as typeof fetch);
    const r = await p.chat({ ...req, reasoningEffort: 'none' });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('https://bc.test/v1/chat/completions');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer sk-test');
    expect(JSON.parse(String(init?.body))).toMatchObject({ model: 'qwen-3.8-27b', max_tokens: 100, stream: false, reasoning_effort: 'none' });
    expect(r).toMatchObject({ text: 'hello', truncated: false, usage: { totalTokens: 8 } });
  });

  it('retries 503 three times and then succeeds', async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => (++n < 4 ? json(503, 'busy') : ok('finally')));
    const { p, sleep } = provider(fetchImpl as unknown as typeof fetch);
    expect((await p.chat(req)).text).toBe('finally');
    expect(sleep).toHaveBeenCalledTimes(3);
  });

  it('maps subscription_required, 401 and 429 without retrying', async () => {
    for (const [res, code] of [
      [json(403, { error: { code: 'subscription_required' } }), 'subscription_required'],
      [json(401, 'bad key'), 'auth_failed'],
      [json(429, 'slow down'), 'rate_limited'],
    ] as const) {
      const fetchImpl = vi.fn(async () => res);
      const { p } = provider(fetchImpl as unknown as typeof fetch);
      await expect(p.chat(req)).rejects.toMatchObject({ code });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
  });

  it('keeps partial output and flags truncation on finish_reason "length"', async () => {
    const { p } = provider((async () => ok('{"summary": "half', 'length')) as unknown as typeof fetch);
    expect(await p.chat(req)).toMatchObject({ text: '{"summary": "half', truncated: true, finishReason: 'length' });
  });

  it('streams deltas and reports usage from the final chunk', async () => {
    const fetchImpl = async () =>
      stream([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"lo"},"finish_reason":"stop"}]}\n\n',
        'data: {"choices":[],"usage":{"prompt_tokens":2,"completion_tokens":2,"total_tokens":4}}\n\n',
        'data: [DONE]\n\n',
      ]);
    const { p } = provider(fetchImpl as unknown as typeof fetch);
    const deltas: string[] = [];
    let done;
    for await (const ev of p.stream(req)) ev.type === 'delta' ? deltas.push(ev.text) : (done = ev.result);
    expect(deltas.join('')).toBe('Hello');
    expect(done).toMatchObject({ text: 'Hello', finishReason: 'stop', usage: { totalTokens: 4 } });
  });

  it('turns an abort into a timeout error', async () => {
    const fetchImpl = (async (_u: unknown, init?: RequestInit) =>
      new Promise((_r, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)))) as unknown as typeof fetch;
    const p = createBharatCodeProvider({ baseUrl: 'https://bc.test', model: 'm', apiKey: 'k', timeoutMs: 20, fetchImpl });
    await expect(p.chat(req)).rejects.toMatchObject({ code: 'timeout' });
  });
});

describe('mock provider and selection', () => {
  it('is deterministic and builds a tour from "### File:" sections', async () => {
    const m = createMockProvider();
    const tourReq: ChatRequest = { kind: 'tour', maxTokens: 10, messages: [{ role: 'user', content: 'Repository: a/b\n### File: package.json\n### File: src/index.ts' }] };
    const a = await m.chat(tourReq);
    expect(a.text).toBe((await m.chat(tourReq)).text);
    expect(JSON.parse(a.text).steps.map((s: { path: string }) => s.path)).toEqual(['package.json', 'src/index.ts']);
  });

  it('selects providers: BYOK > mock > server key; bharatcode without a key is a setup error', () => {
    const log = vi.fn();
    expect(selectProvider(loadEnv({}), undefined, { logger: log }).provider.name).toBe('mock');
    expect(selectProvider(loadEnv({}), 'sk-user', { logger: log })).toMatchObject({ byok: true, provider: { name: 'bharatcode' } });
    expect(selectProvider(loadEnv({ LLM_PROVIDER: 'bharatcode', BHARATCODE_API_KEY: 'sk' }), undefined).provider.name).toBe('bharatcode');
    expect(() => selectProvider(loadEnv({ LLM_PROVIDER: 'bharatcode' }), undefined)).toThrow(KittyError);
  });

  it('logs one usage line per request', async () => {
    const logger = vi.fn();
    await selectProvider(loadEnv({}), undefined, { logger }).provider.chat(req);
    expect(logger).toHaveBeenCalledWith(expect.objectContaining({ kind: 'explain', provider: 'mock', totalTokens: expect.any(Number) }));
  });
});
