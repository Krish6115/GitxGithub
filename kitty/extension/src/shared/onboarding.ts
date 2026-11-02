// First-run onboarding: has the user finished setup, and can we reach their Kitty server?

export const ONBOARDED_KEY = 'kitty:onboarded';

export type ServerCheck =
  | { ok: true; provider: string; version: string; ms: number }
  | { ok: false; message: string };

/** GET <url>/health with a timeout; validates the response shape. */
export async function checkServer(url: string, fetchImpl: typeof fetch = fetch, timeoutMs = 6000): Promise<ServerCheck> {
  let base: URL;
  try {
    base = new URL(url);
    if (base.protocol !== 'https:' && base.protocol !== 'http:') throw new Error('protocol');
  } catch {
    return { ok: false, message: 'That is not a valid http(s) URL.' };
  }
  const t0 = Date.now();
  try {
    const res = await fetchImpl(new URL('/health', base).href, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return { ok: false, message: `The server answered with HTTP ${res.status}.` };
    const body = (await res.json()) as { ok?: unknown; provider?: unknown; version?: unknown };
    if (body.ok !== true || typeof body.provider !== 'string') return { ok: false, message: 'That URL answered, but it is not a Kitty server.' };
    return { ok: true, provider: body.provider, version: typeof body.version === 'string' ? body.version : '?', ms: Date.now() - t0 };
  } catch (e) {
    const timeout = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
    return { ok: false, message: timeout ? 'No answer within a few seconds. Is the server running?' : 'Could not reach that server.' };
  }
}

/** Plain-language label for the server's model provider. */
export const providerLabel = (p: string): string =>
  p === 'bharatcode' ? 'BharatCode model (live answers)' : p === 'mock' ? 'Mock model (canned answers for testing)' : p;
