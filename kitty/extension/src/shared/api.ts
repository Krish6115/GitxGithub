// POST to the Kitty server and read its SSE response. Used from extension pages (side panel, service worker).
import { getSettings } from './settings';
import { readSse } from './sse';

export class ApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

/** Calls `onEvent` for each SSE event (pings skipped). Throws ApiError for HTTP errors and network failures. */
export async function postStream(path: string, body: unknown, onEvent: (event: string, data: unknown) => void, signal?: AbortSignal): Promise<void> {
  const s = await getSettings();
  let res: Response;
  try {
    res = await fetch(`${s.serverUrl.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(s.kittyKey ? { 'X-Kitty-Key': s.kittyKey } : {}),
        ...(s.githubToken ? { 'X-Kitty-GitHub-Token': s.githubToken } : {}),
      },
      body: JSON.stringify(body),
      ...(signal ? { signal } : {}),
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ApiError('network', 'Could not reach the Kitty server.');
  }
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    throw new ApiError(err.code ?? 'upstream_error', err.message ?? `Server returned HTTP ${res.status}.`);
  }
  for await (const ev of readSse(res.body)) {
    if (ev.event === 'ping') continue;
    onEvent(ev.event, JSON.parse(ev.data));
  }
}
