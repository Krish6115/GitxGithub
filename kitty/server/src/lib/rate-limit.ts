// Fixed-window per-key rate limiter (in-memory; on serverless each instance counts separately).

export interface RateLimiter {
  /** Count one request for `key`. */
  take(key: string): { ok: true } | { ok: false; retryAfterSec: number };
}

export function createRateLimiter(perMinute: number, now: () => number = Date.now): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    take(key) {
      const t = now();
      if (windows.size > 10_000) {
        for (const [k, w] of windows) if (t - w.start >= 60_000) windows.delete(k);
      }
      const w = windows.get(key);
      if (!w || t - w.start >= 60_000) {
        windows.set(key, { start: t, count: 1 });
        return { ok: true };
      }
      if (w.count >= perMinute) return { ok: false, retryAfterSec: Math.ceil((w.start + 60_000 - t) / 1000) };
      w.count++;
      return { ok: true };
    },
  };
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for), falling back to a fixed key. */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'local';
}
