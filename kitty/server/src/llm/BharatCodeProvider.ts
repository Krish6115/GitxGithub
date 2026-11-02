// BharatCode provider via the openai SDK. Every call streams, so first-token / idle / total timeouts always apply.
import OpenAI, { APIConnectionError, APIConnectionTimeoutError, APIError, APIUserAbortError } from 'openai';
import { withRetry, type Sleep } from '../lib/retry.js';
import { CALL_BUDGETS, type StreamTimeouts } from './budgets.js';
import { KittyError, toKittyError } from './errors.js';
import type { ChatRequest, ChatResult, Provider, StreamEvent, Usage } from './types.js';
import { createWatchdog } from './watchdog.js';

export interface BharatCodeConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  firstTokenMs: number;
  idleMs: number;
  /** Tests: inject fetch so nothing touches the network. */
  fetchImpl?: typeof fetch;
  sleep?: Sleep;
  retryDelaysMs?: number[];
  /** Tests: override the per-kind total cap. */
  totalMsOverride?: number;
}

/** Map SDK / network errors to typed Kitty errors. Only 503 and connection failures are retried. */
export function mapError(e: unknown): KittyError {
  if (e instanceof KittyError) return e;
  if (e instanceof APIUserAbortError || e instanceof APIConnectionTimeoutError) return toKittyError(Object.assign(new Error('aborted'), { name: 'TimeoutError' }));
  if (e instanceof APIError) {
    const detail = `${e.message} ${JSON.stringify(e.error ?? '')}`;
    if (/subscription_required/i.test(detail)) {
      return new KittyError('subscription_required', 'This BharatCode account needs an active subscription for this model.');
    }
    if (e.status === 503) return new KittyError('upstream_unavailable', 'BharatCode is busy right now.', { retryable: true, cause: e });
    if (e.status === 429) return new KittyError('rate_limited', 'BharatCode rate limit reached. Please wait a moment.');
    if (e.status === 401 || e.status === 403) return new KittyError('auth_failed', 'The BharatCode API key was rejected.');
    if (e instanceof APIConnectionError) return new KittyError('upstream_unavailable', 'Could not reach BharatCode.', { retryable: true, cause: e });
    const why = e.message.replace(/\s+/g, ' ').slice(0, 200);
    return new KittyError('upstream_error', `BharatCode error${e.status ? ` (HTTP ${e.status})` : ''}: ${why}`, { cause: e });
  }
  return toKittyError(e);
}

const toUsage = (u: OpenAI.CompletionUsage | null | undefined): Usage | null =>
  u ? { promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens } : null;

export function createBharatCodeProvider(cfg: BharatCodeConfig): Provider {
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseUrl,
    maxRetries: 0, // our own 503 backoff applies instead
    ...(cfg.fetchImpl ? { fetch: cfg.fetchImpl } : {}),
  });

  async function* stream(req: ChatRequest): AsyncGenerator<StreamEvent> {
    const budget = CALL_BUDGETS[req.kind];
    const timeouts: StreamTimeouts = { firstTokenMs: cfg.firstTokenMs, idleMs: cfg.idleMs, totalMs: cfg.totalMsOverride ?? budget.totalMs };
    const effort = req.reasoningEffort ?? budget.reasoningEffort;
    const wd = createWatchdog(timeouts, req.signal);
    let text = '';
    let finishReason = 'unknown';
    let usage: Usage | null = null;
    let model = cfg.model;
    try {
      const s = await withRetry(
        () =>
          client.chat.completions
            .create(
              {
                model: cfg.model,
                messages: req.messages,
                max_tokens: req.maxTokens ?? budget.maxTokens,
                stream: true,
                stream_options: { include_usage: true },
                ...(effort ? { reasoning_effort: effort } : {}),
                ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
              },
              { signal: wd.signal, timeout: timeouts.totalMs },
            )
            .catch((e: unknown) => {
              throw mapError(e);
            }),
        { signal: wd.signal, ...(cfg.sleep ? { sleep: cfg.sleep } : {}), ...(cfg.retryDelaysMs ? { delaysMs: cfg.retryDelaysMs } : {}) },
      );
      for await (const chunk of s) {
        wd.activity(); // any chunk counts, including reasoning-only deltas
        model = chunk.model || model;
        usage = toUsage(chunk.usage) ?? usage;
        const choice = chunk.choices[0];
        if (choice?.finish_reason) finishReason = choice.finish_reason;
        const delta = choice?.delta?.content;
        if (delta) {
          text += delta;
          yield { type: 'delta', text: delta };
        }
      }
      // An abort mid-stream can end the SDK iterator quietly; never return partial text as if complete.
      if (wd.signal.aborted) throw wd.signal.reason instanceof KittyError ? wd.signal.reason : mapError(wd.signal.reason);
    } catch (e) {
      if (wd.signal.aborted && wd.signal.reason instanceof KittyError) throw wd.signal.reason;
      throw mapError(e);
    } finally {
      wd.dispose();
    }
    if (finishReason === 'length' && text.trim() === '') {
      throw new KittyError('reasoning_budget_exhausted', 'The model spent its whole output budget reasoning and produced no answer.');
    }
    // We never send tools, so tool_calls (complete or cut off) are ignored, never executed.
    const result: ChatResult = { text, finishReason, truncated: finishReason === 'length', usage, model };
    yield { type: 'done', result };
  }

  return {
    name: 'bharatcode',
    stream,
    async chat(req) {
      for await (const ev of stream(req)) if (ev.type === 'done') return ev.result;
      throw new KittyError('upstream_error', 'BharatCode stream ended without a result.');
    },
  };
}
