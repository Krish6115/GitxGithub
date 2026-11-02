// Retry with fixed backoff (default 2s / 4s / 8s), abortable.
import { KittyError } from '../llm/errors.js';

export type Sleep = (ms: number, signal?: AbortSignal) => Promise<void>;

export const sleep: Sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

export interface RetryOptions {
  delaysMs?: number[];
  shouldRetry?: (e: unknown) => boolean;
  sleep?: Sleep;
  signal?: AbortSignal;
  onRetry?: (attempt: number, delayMs: number, e: unknown) => void;
}

export const isRetryable = (e: unknown): boolean => e instanceof KittyError && e.retryable;

/** Run `fn`; on a retryable error wait `delaysMs[i]` and try again, up to `delaysMs.length` retries. */
export async function withRetry<T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { delaysMs = [2000, 4000, 8000], shouldRetry = isRetryable, sleep: wait = sleep, signal, onRetry } = opts;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      const delay = delaysMs[attempt];
      if (delay === undefined || !shouldRetry(e) || signal?.aborted) throw e;
      onRetry?.(attempt + 1, delay, e);
      await wait(delay, signal);
    }
  }
}
