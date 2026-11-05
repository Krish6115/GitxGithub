// Settings: server URL, optional BharatCode key (BYOK) and GitHub token, selection button. Stored in chrome.storage.local.
import { useEffect, useState } from 'preact/hooks';
import { DEFAULT_SERVER_URL } from '../shared/config';
import { getSettings, saveSettings, type Settings } from '../shared/settings';
import { ServerCheckButton } from './ServerCheck';

type TextKey = 'serverUrl' | 'kittyKey' | 'githubToken';

export function SettingsView() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => void getSettings().then(setS), []);
  if (!s) return null;
  const field = (k: TextKey) => ({
    value: s[k] ?? '',
    onInput: (e: Event) => { setSaved(false); setS({ ...s, [k]: (e.target as HTMLInputElement).value }); },
  });
  return (
    <form
      class="settings"
      onSubmit={(e) => {
        e.preventDefault();
        void saveSettings({
          serverUrl: s.serverUrl.trim() || DEFAULT_SERVER_URL,
          kittyKey: s.kittyKey?.trim() || '',
          githubToken: s.githubToken?.trim() || '',
          explainPill: s.explainPill !== false,
          explainButtons: s.explainButtons !== false,
          level: s.level ?? 'auto',
        }).then(() => setSaved(true));
      }}
    >
      <ServerCheckButton url={s.serverUrl} />
      <label>
        BharatCode API key <span class="muted small">(optional: use your own key)</span>
        <input type="password" autocomplete="off" placeholder="Uses the server's key when empty" {...field('kittyKey')} />
      </label>
      <label>
        GitHub token <span class="muted small">(optional: higher rate limits, private repos)</span>
        <input type="password" autocomplete="off" placeholder="Read-only token" {...field('githubToken')} />
      </label>
      <label class="check">
        <input
          type="checkbox"
          checked={s.explainPill !== false}
          onChange={(e) => { setSaved(false); setS({ ...s, explainPill: (e.target as HTMLInputElement).checked }); }}
        />
        Show an “Ask Kitty” button when I select text on GitHub
      </label>
      <label>
        How Kitty explains things
        <select value={s.level ?? 'auto'} onChange={(e) => { setSaved(false); setS({ ...s, level: (e.target as HTMLSelectElement).value as Settings['level'] }); }}>
          <option value="auto">Automatic (follows your Git path)</option>
          <option value="beginner">Beginner: step by step, terms explained</option>
          <option value="intermediate">Intermediate: concise, tricky parts only</option>
          <option value="advanced">Advanced: just the commands and edge cases</option>
        </select>
      </label>
      <label class="check">
        <input
          type="checkbox"
          checked={s.explainButtons !== false}
          onChange={(e) => { setSaved(false); setS({ ...s, explainButtons: (e.target as HTMLInputElement).checked }); }}
        />
        Explain GitHub buttons (Sync fork, Squash and merge…) when I hover them
      </label>
      <p class="muted small">The right-click menu “Ask Kitty about this” always works. Keys stay in this browser and are only sent to the Kitty server above, never to web pages.</p>
      <details class="advanced">
        <summary class="muted small">Advanced: use a different Kitty server (for developers)</summary>
        <label>Kitty server URL<input type="url" required {...field('serverUrl')} /></label>
        <button type="button" class="ghost small" onClick={() => { setSaved(false); setS({ ...s, serverUrl: DEFAULT_SERVER_URL }); }}>Use the default server</button>
      </details>
      <div class="row">
        <button type="submit">Save</button>
        {saved && <span class="muted small" role="status">Saved.</span>}
      </div>
    </form>
  );
}
