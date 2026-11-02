// BharatCode provider: OpenAI-compatible /chat/completions over fetch (no SDK).
import { z } from 'zod';
import { withRetry, type Sleep } from '../lib/retry.js';
import { KittyError, toKittyError } from './errors.js';
import { readSseData } from './sse.js';
import type { ChatRequest, ChatResult, Provider, StreamEvent, Usage } from './types.js';

export interface BharatCodeConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  /** Overall deadline per request, retries included (free-tier queueing can be slow). */
  timeoutMs: number;
  fetchImpl?: typeof fetch;
  sleep?: Sleep;
  retryDelaysMs?: number[];
}

const UsageSchema = z
  .object({ prompt_tokens: z.number(), completion_tokens: z.number(), total_tokens: z.number() })
  .nullish();
const ChatResponseSchema = z.object({
  model: z.string().optional(),
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullish() }).passthrough(), finish_reason: z.string().nullish() }))
    .min(1),
  usage: UsageSchema,
});
const StreamChunkSchema = z.object({
  model: z.string().optional(),
  choices: z
    .array(z.object({ delta: z.object({ content: z.string().nullish() }).passthrough().optional(), finish_reason: z.string().nullish() }))
    .optional(),
  usage: UsageSchema,
});

const toUsage = (u: z.infer<typeof UsageSchema>): Usage | null =>
  u ? { promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens } : null;

/** Map a non-2xx response to a typed error. Only 503 is retried. */
export async function errorFromResponse(res: Response): Promise<KittyError> {
  const body = await res.text().catch(() => '');
  if (/subscription_required/i.test(body)) {
    return new KittyError('subscription_required', 'This BharatCode account needs an active subscription for this model.');
  }
  if (res.status === 503) return new KittyError('upstream_unavailable', 'BharatCode is busy right now.', { retryable: true });
  if (res.status === 429) return new KittyError('rate_limited', 'BharatCode rate limit reached. Please wait a moment.');
  if (res.status === 401 || res.status === 403) return new KittyError('auth_failed', 'The BharatCode API key was rejected.');
  return new KittyError('upstream_error', `BharatCode returned HTTP ${res.status}.`);
}

export function createBharatCodeProvider(cfg: BharatCodeConfig): Provider {
  const doFetch = cfg.fetchImpl ?? fetch;
  const url = `${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const body = (req: ChatRequest, stream: boolean): string =>
    JSON.stringify({
      model: cfg.model,
      messages: req.messages,
      max_tokens: req.maxTokens,
      stream,
      ...(stream ? { stream_options: { include_usage: true } } : {}),
      ...(req.reasoningEffort ? { reasoning_effort: req.reasoningEffort } : {}),
      ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
    });

  const post = async (req: ChatRequest, stream: boolean, signal: AbortSignal): Promise<Response> =>
    withRetry(
      async () => {
        const res = await doFetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
          body: body(req, stream),
          signal,
        });
        if (!res.ok) throw await errorFromResponse(res);
        return res;
      },
      { signal, ...(cfg.sleep ? { sleep: cfg.sleep } : {}), ...(cfg.retryDelaysMs ? { delaysMs: cfg.retryDelaysMs } : {}) },
    );

  const deadline = (req: ChatRequest): AbortSignal => {
    const t = AbortSignal.timeout(cfg.timeoutMs);
    return req.signal ? AbortSignal.any([req.signal, t]) : t;
  };

  return {
    name: 'bharatcode',

    async chat(req) {
      try {
        const res = await post(req, false, deadline(req));
        const parsed = ChatResponseSchema.safeParse(await res.json());
        if (!parsed.success) throw new KittyError('upstream_error', 'BharatCode returned an unexpected response shape.');
        const choice = parsed.data.choices[0];
        const finishReason = choice?.finish_reason ?? 'unknown';
        // We never send tools, so any tool_calls in the reply (complete or cut off) are ignored, never executed.
        return {
          text: choice?.message.content ?? '',
          finishReason,
          truncated: finishReason === 'length',
          usage: toUsage(parsed.data.usage),
          model: parsed.data.model ?? cfg.model,
        };
      } catch (e) {
        throw toKittyError(e);
      }
    },

    async *stream(req): AsyncGenerator<StreamEvent> {
      let text = '';
      let finishReason = 'unknown';
      let usage: Usage | null = null;
      let model = cfg.model;
      try {
        const res = await post(req, true, deadline(req));
        if (!res.body) throw new KittyError('upstream_error', 'BharatCode returned an empty stream.');
        for await (const data of readSseData(res.body)) {
          const chunk = StreamChunkSchema.safeParse(JSON.parse(data));
          if (!chunk.success) continue;
          model = chunk.data.model ?? model;
          usage = toUsage(chunk.data.usage) ?? usage;
          const choice = chunk.data.choices?.[0];
          if (choice?.finish_reason) finishReason = choice.finish_reason;
          const delta = choice?.delta?.content;
          if (delta) {
            text += delta;
            yield { type: 'delta', text: delta };
          }
        }
      } catch (e) {
        throw toKittyError(e);
      }
      const result: ChatResult = { text, finishReason, truncated: finishReason === 'length', usage, model };
      yield { type: 'done', result };
    },
  };
}
