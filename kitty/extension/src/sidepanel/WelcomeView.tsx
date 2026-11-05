// First-run welcome: Kitty is ready to use (hosted server), optional keys, and a quick "how to use" guide.
import { useEffect, useState } from 'preact/hooks';
import { DEFAULT_SERVER_URL } from '../shared/config';
import { ONBOARDED_KEY } from '../shared/onboarding';
import { getSettings, saveSettings, type Settings } from '../shared/settings';
import { ServerCheckButton } from './ServerCheck';

export function WelcomeView({ onDone }: { onDone: () => void }) {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => void getSettings().then(setS), []);
  if (!s) return null;
  const set = (k: 'kittyKey' | 'githubToken') => (e: Event) => setS({ ...s, [k]: (e.target as HTMLInputElement).value });

  const finish = async (): Promise<void> => {
    await saveSettings({ serverUrl: DEFAULT_SERVER_URL, kittyKey: s.kittyKey?.trim() || '', githubToken: s.githubToken?.trim() || '' });
    await chrome.storage.local.set({ [ONBOARDED_KEY]: true });
    onDone();
  };

  return (
    <section class="welcome">
      <h2>Hi, I'm Kitty</h2>
      <p>I walk around GitHub with you: I give guided tours of repositories, answer Git questions, and explain commands, diffs and pull requests.</p>

      <h3>1. You're all set</h3>
      <form class="settings" onSubmit={(e) => { e.preventDefault(); void finish(); }}>
        <p class="muted small">Kitty works out of the box: no account or setup needed.</p>
        <ServerCheckButton url={DEFAULT_SERVER_URL} />

        <h3>2. Optional</h3>
        <label>
          Your own BharatCode API key <span class="muted small">(skip to use the server's key)</span>
          <input type="password" autocomplete="off" value={s.kittyKey ?? ''} onInput={set('kittyKey')} />
        </label>
        <label>
          GitHub token <span class="muted small">(higher rate limits, private repos)</span>
          <input type="password" autocomplete="off" value={s.githubToken ?? ''} onInput={set('githubToken')} />
        </label>
        <p class="muted small">Keys stay in this browser and are only sent to the Kitty server.</p>

        <h3>3. How to use me</h3>
        <ul class="howto">
          <li><strong>Tour a repo:</strong> open any repository on github.com, click the cat, choose <em>Tour this repo</em>.</li>
          <li><strong>Ask a Git question:</strong> use the <em>Ask Kitty</em> tab here, or the cat's menu.</li>
          <li><strong>Explain something:</strong> select a command, diff or PR text on GitHub and click <em>Ask Kitty</em> (or right-click).</li>
        </ul>
        <div class="row"><button type="submit" data-kitty="finish-onboarding">Start using Kitty</button></div>
      </form>
    </section>
  );
}
