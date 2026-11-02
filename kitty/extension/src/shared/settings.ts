// User settings in chrome.storage.local. Keys are only ever sent to the Kitty server, never to GitHub pages.
import { DEFAULT_SERVER_URL } from './config';

export interface Settings {
  serverUrl: string;
  /** Optional BharatCode key (BYOK), sent as X-Kitty-Key. */
  kittyKey?: string;
  /** Optional GitHub token for higher API limits, sent as X-Kitty-GitHub-Token. */
  githubToken?: string;
  /** Show the floating "Ask Kitty" button when text is selected on GitHub (default on). */
  explainPill?: boolean;
}

const KEY = 'kitty:settings';

export async function getSettings(): Promise<Settings> {
  const stored = (await chrome.storage.local.get(KEY))[KEY] as Partial<Settings> | undefined;
  return { serverUrl: DEFAULT_SERVER_URL, ...stored };
}

export async function saveSettings(s: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set({ [KEY]: { ...(await getSettings()), ...s } });
}
