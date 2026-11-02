// "Test connection" button + result, shared by onboarding and settings.
import { useState } from 'preact/hooks';
import { checkServer, providerLabel, type ServerCheck } from '../shared/onboarding';

export function ServerCheckButton({ url }: { url: string }) {
  const [state, setState] = useState<ServerCheck | 'checking' | null>(null);
  return (
    <div class="row">
      <button type="button" class="ghost" disabled={state === 'checking'} onClick={() => { setState('checking'); void checkServer(url.trim()).then(setState); }}>
        {state === 'checking' ? 'Checking…' : 'Test connection'}
      </button>
      {state && state !== 'checking' && (
        <span class={state.ok ? 'ok small' : 'error small'} role="status">
          {state.ok ? `Connected: ${providerLabel(state.provider)}, ${state.ms} ms` : state.message}
        </span>
      )}
    </div>
  );
}
