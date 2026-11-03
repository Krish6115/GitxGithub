// Records the README demo: GitHub on the left, Kitty's side panel on the right (like Chrome with the panel open).
// Frames go to e2e/out/demo-v2/ with a manifest; scripts/make-promo-video.py turns them into docs/kitty-promo.mp4 and .gif.
// Usage: start the server with the real model (LLM_PROVIDER=bharatcode npm run dev -w server), then
//        npx tsx e2e/demo.ts
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from 'playwright-core';
import { launch, OUT_DIR } from './launch.js';

const DIR = join(OUT_DIR, 'demo-v2');
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
const frames: { n: number; label: string; t: number }[] = [];
const t0 = Date.now();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const { ctx, extId } = await launch({ width: 860, height: 800 });
const page = await ctx.newPage();
const panel = await ctx.newPage();
await panel.setViewportSize({ width: 420, height: 800 });
await panel.goto(`chrome-extension://${extId}/src/sidepanel/index.html`);
await page.bringToFront();
const kitty = (sel: string) => page.locator(`#kitty-root ${sel}`);

let n = 0;
async function snap(label: string): Promise<void> {
  const id = n++;
  await Promise.all([
    page.screenshot({ path: join(DIR, `${String(id).padStart(4, '0')}-page.png`) }).catch(() => {}),
    panel.screenshot({ path: join(DIR, `${String(id).padStart(4, '0')}-panel.png`) }).catch(() => {}),
  ]);
  frames.push({ n: id, label, t: Date.now() - t0 });
}
/** Keep filming while `action` runs. */
async function film(label: string, action: () => Promise<unknown>, every = 500): Promise<void> {
  let done = false;
  const p = action().finally(() => (done = true));
  while (!done) {
    await snap(label);
    await sleep(every);
  }
  await p;
  await snap(label);
}
const hold = (label: string, ms: number) => film(label, () => sleep(ms));
const typeAndAsk = async (p: Page, q: string) => {
  await p.locator('.composer textarea').fill(q);
  await p.locator('.composer button[type="submit"]').click();
};

// 1. Instant repo tour
const T = '1 · Tour any repo: Kitty starts walking in seconds';
await page.goto('https://github.com/honojs/hono', { waitUntil: 'domcontentloaded' });
await hold(T, 1500);
await kitty('button.cat').click();
await hold(T, 1200);
await kitty('[data-kitty="start-tour"]').click();
await film(T, () => kitty('[data-kitty="step"]').waitFor({ timeout: 60_000 }));
await hold(T, 2500);
// wait for the model's explanation of the current step to replace Kitty's placeholder
await film(T, () => page.waitForFunction(() => !document.getElementById('kitty-root')?.shadowRoot?.querySelector('[data-kitty="writing-step"]'), null, { timeout: 90_000 }), 1500);
await hold(T, 2500);
for (let i = 0; i < 2; i++) {
  await kitty('[data-kitty="step"] button:has-text("Next")').click();
  await film(T, () => kitty('[data-kitty="step"]').waitFor({ timeout: 30_000 }));
  await hold(T, 3500);
}

// 2. Instant answers in the side panel
const A = '2 · Ask Kitty: common questions are answered instantly, with sources';
await typeAndAsk(panel, 'how do i sync my fork');
await film(A, () => panel.locator('.msg.kitty[data-status="done"]').last().waitFor({ timeout: 60_000 }));
await hold(A, 3500);
await kitty('[data-kitty="step"] button:has-text("Exit")').click().catch(() => {});

// 3. The chat sends the cat: find an issue and explain it on the page
const C = '3 · "Find me a Docker issue": Kitty finds one and explains it on the page';
await typeAndAsk(panel, 'Find me a good first issue about docker');
await film(C, () => panel.locator('[data-kitty="found"] li').first().waitFor({ timeout: 90_000 }), 1000);
await hold(C, 3000);
await page.bringToFront(); // the action opens in the active tab
await panel.locator('[data-kitty="show-issue"]').first().click();
await film(C, () => page.waitForURL(/\/issues\/\d+/, { timeout: 20_000 }));
await film(C, () => page.waitForFunction(() => {
  const b = document.getElementById('kitty-root')?.shadowRoot?.querySelector('[data-kitty="explain"]');
  return Boolean(b && [...b.querySelectorAll('button')].some((x) => x.textContent === 'Ask a follow-up' && !x.disabled));
}, null, { timeout: 90_000 }), 800);
await hold(C, 4500);

// 4. PR pre-flight check
const P = '4 · Check my PR: what maintainers would send back, with fixes (no AI tokens)';
await page.goto('https://github.com/cli/cli/pull/14908', { waitUntil: 'domcontentloaded' });
await hold(P, 1500);
await kitty('button.cat').click();
await hold(P, 1000);
await kitty('[data-kitty="preflight"]').click();
await film(P, () => kitty('[data-kitty="preflight"] h3').waitFor({ timeout: 30_000 }));
await hold(P, 5000);

writeFileSync(join(DIR, 'manifest.json'), JSON.stringify(frames, null, 2));
console.log(`${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${DIR}`);
await ctx.close();
