// One-shot server calls from the content script, relayed by the service worker (good first issues, PR pre-flight).
import { useCallback, useState } from 'preact/hooks';
import { errorText, type ApiMessage, type ApiPath, type ApiReply } from '../shared/messages';

export type ApiState<T> = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'done'; data: T };

export function useApi<T>(path: ApiPath): { state: ApiState<T>; run: (body: unknown) => void; reset: () => void } {
  const [state, setState] = useState<ApiState<T>>({ kind: 'idle' });
  const run = useCallback(
    (body: unknown) => {
      setState({ kind: 'loading' });
      const msg: ApiMessage = { type: 'api', path, body };
      chrome.runtime
        .sendMessage(msg)
        .then((r: ApiReply<T> | undefined) => {
          if (!r) setState({ kind: 'error', message: 'Kitty did not answer. Reload the page and try again.' });
          else if (r.ok) setState({ kind: 'done', data: r.data });
          else setState({ kind: 'error', message: errorText(r.code, r.message) });
        })
        .catch(() => setState({ kind: 'error', message: 'Kitty was just updated. Reload the page and try again.' }));
    },
    [path],
  );
  const reset = useCallback(() => setState({ kind: 'idle' }), []);
  return { state, run, reset };
}
