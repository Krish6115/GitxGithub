// Settings: server URL, optional BharatCode key (BYOK) and GitHub token. Stored in chrome.storage.local.
import { useEffect, useState } from 'preact/hooks';
import { DEFAULT_SERVER_URL } from '../shared/config';
import { getSettings, saveSettings, type Settings } from '../shared/settings';

export function SettingsView() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => void getSettings().then(setS), []);
  if (!s) return null;
  const field = (k: keyof Settings) => ({
    value: s[k] ?? '',
    onInput: (e: Event) => { setSaved(false); setS({ ...s, [k]: (e.target as HTMLInputElement).value }); },
  });
  return (
    <form
      class="settings"
      onSubmit={(e) => {
        e.preventDefault();
        void saveSettings({ serverUrl: s.serverUrl.trim() || DEFAULT_SERVER_URL, kittyKey: s.kittyKey?.trim() || '', githubToken: s.githubToken?.trim() || '' }).then(() => setSaved(true));
      }}
    >
      <label>Kitty server URL<input type="url" required {...field('serverUrl')} /></label>
      <label>
        BharatCode API key <span class="muted small">(optional: use your own key)</span>
        <input type="password" autocomplete="off" placeholder="Uses the server's key when empty" {...field('kittyKey')} />
      </label>
      <label>
        GitHub token <span class="muted small">(optional: higher rate limits, private repos)</span>
        <input type="password" autocomplete="off" placeholder="Read-only token" {...field('githubToken')} />
      </label>
      <p class="muted small">Keys stay in this browser and are only sent to the Kitty server above, never to web pages.</p>
      <div class="row">
        <button type="submit">Save</button>
        {saved && <span class="muted small" role="status">Saved.</span>}
      </div>
    </form>
  );
}
