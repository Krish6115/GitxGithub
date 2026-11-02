// Typed errors shared by the LLM layer, the GitHub client and routes. `code` is what the extension shows a message for.

export type KittyErrorCode =
  | 'bad_request'
  | 'key_required'
  | 'subscription_required'
  | 'auth_failed'
  | 'rate_limited'
  | 'upstream_unavailable'
  | 'upstream_error'
  | 'timeout'
  | 'invalid_model_output'
  | 'reasoning_budget_exhausted'
  | 'github_not_found'
  | 'github_rate_limited';

const STATUS: Record<KittyErrorCode, number> = {
  bad_request: 400,
  key_required: 401,
  subscription_required: 402,
  auth_failed: 401,
  rate_limited: 429,
  upstream_unavailable: 503,
  upstream_error: 502,
  timeout: 504,
  invalid_model_output: 502,
  reasoning_budget_exhausted: 502,
  github_not_found: 404,
  github_rate_limited: 429,
};

export class KittyError extends Error {
  readonly code: KittyErrorCode;
  readonly status: number;
  readonly retryable: boolean;

  constructor(code: KittyErrorCode, message: string, opts: { retryable?: boolean; cause?: unknown } = {}) {
    super(message, { cause: opts.cause });
    this.name = 'KittyError';
    this.code = code;
    this.status = STATUS[code];
    this.retryable = opts.retryable ?? false;
  }
}

/** Normalize anything thrown into a KittyError (aborts become timeouts). */
export function toKittyError(e: unknown): KittyError {
  if (e instanceof KittyError) return e;
  if (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
    return new KittyError('timeout', 'Kitty took too long to answer. Please try again.', { cause: e });
  }
  return new KittyError('upstream_error', e instanceof Error ? e.message : 'Unexpected error', { cause: e });
}
