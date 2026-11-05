// User settings in chrome.storage.local. Keys are only ever sent to the Kitty server, never to GitHub pages.
import { DEFAULT_SERVER_URL, isLocalUrl } from './config';

export interface Settings {
  serverUrl: string;
  /** Optional BharatCode key (BYOK), sent as X-Kitty-Key. */
  kittyKey?: string;
  /** Optional GitHub token for higher API limits, sent as X-Kitty-GitHub-Token. */
  githubToken?: string;
  /** Show the floating "Ask Kitty" button when text is selected on GitHub (default on). */
  explainPill?: boolean;
  /** Tutor depth: "auto" follows the learning path (beginner until a few skills are explored). */
  level?: 'auto' | 'beginner' | 'intermediate' | 'advanced';
  /** Explain what GitHub's own buttons do in Git terms when you hover them (default on). */
  explainButtons?: boolean;
}

/** The level sent to the tutor: the chosen one, or (auto) from how many skills the learner has explored. */
export function tutorLevel(setting: Settings['level'], explored: number): 'beginner' | 'intermediate' | 'advanced' {
  if (setting && setting !== 'auto') return setting;
  return explored < 4 ? 'beginner' : explored < 10 ? 'intermediate' : 'advanced';
}

const KEY = 'kitty:settings';

export async function getSettings(): Promise<Settings> {
  const stored = (await chrome.storage.local.get(KEY))[KEY] as Partial<Settings> | undefined;
  const s = { serverUrl: DEFAULT_SERVER_URL, ...stored };
  // a localhost URL saved by an earlier development build: use the hosted server instead
  if (isLocalUrl(s.serverUrl) && !isLocalUrl(DEFAULT_SERVER_URL)) s.serverUrl = DEFAULT_SERVER_URL;
  return s;
}

export async function saveSettings(s: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set({ [KEY]: { ...(await getSettings()), ...s } });
}
