// Shared helpers: launch Chromium with the unpacked extension in a throwaway profile.
import { existsSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext, type Worker } from 'playwright-core';

export const EXT_DIST = fileURLToPath(new URL('../dist', import.meta.url));
export const OUT_DIR = fileURLToPath(new URL('./out', import.meta.url));

/**
 * Branded Chrome no longer loads unpacked extensions from the command line, so a Playwright Chromium build is used.
 * Set KITTY_E2E_CHROME to a chrome executable, or install one with `npx playwright install chromium`.
 */
export function findChromium(): string {
  const fromEnv = process.env.KITTY_E2E_CHROME;
  if (fromEnv) return fromEnv;
  const cache = process.platform === 'win32'
    ? join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'ms-playwright')
    : process.platform === 'darwin' ? join(homedir(), 'Library', 'Caches', 'ms-playwright') : join(homedir(), '.cache', 'ms-playwright');
  const builds = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1])) : [];
  for (const b of builds) {
    for (const rel of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      const p = join(cache, b, rel);
      if (existsSync(p)) return p;
    }
  }
  throw new Error('No Chromium found. Run `npx playwright install chromium` or set KITTY_E2E_CHROME.');
}

export interface Launched {
  ctx: BrowserContext;
  sw: Worker;
  extId: string;
}

export async function launch(viewport = { width: 1280, height: 860 }): Promise<Launched> {
  if (!existsSync(join(EXT_DIST, 'manifest.json'))) throw new Error('Build the extension first: npm run build -w extension');
  mkdirSync(OUT_DIR, { recursive: true });
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'kitty-e2e-')), {
    executablePath: findChromium(),
    headless: false, // extensions need a headed browser
    args: [`--disable-extensions-except=${EXT_DIST}`, `--load-extension=${EXT_DIST}`, '--window-position=-2400,0'],
    viewport,
  });
  const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'));
  return { ctx, sw, extId: new URL(sw.url()).host };
}

export const log = (...a: unknown[]): void => console.log(...a);
