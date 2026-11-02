// "Explain this": select a git command block -> pill -> streamed explanation; follow-up; right-click path; Esc.
import { join } from 'node:path';
import type { Page } from 'playwright-core';
import { launch, log, OUT_DIR } from './launch.js';

const explanationDone = (page: Page) =>
  page.waitForFunction(() => {
    const b = document.getElementById('kitty-root')?.shadowRoot?.querySelector('[data-kitty="explain"]');
    return Boolean(b && [...b.querySelectorAll('button')].some((x) => x.textContent === 'Ask a follow-up' && !x.disabled));
  }, null, { timeout: 90_000 });

export async function explainE2E(): Promise<void> {
  const { ctx, sw } = await launch();
  const page = await ctx.newPage();
  await page.goto('https://github.com/Krish6115/GitKitty/blob/main/CONTRIBUTING.md', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const pre = page.locator('article.markdown-body pre', { hasText: 'git checkout -b' }).first();
  await pre.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await pre.selectText();
  await page.locator('#kitty-root [data-kitty="ask-pill"]').waitFor({ timeout: 5000 });
  log('pill: shown');
  await page.locator('#kitty-root [data-kitty="ask-pill"]').click();
  const t0 = Date.now();
  await page.locator('#kitty-root [data-kitty="explain"] .md').waitFor({ timeout: 60_000 });
  const first = Date.now() - t0;
  await explanationDone(page);
  log(`explanation: first text ${(first / 1000).toFixed(1)}s, done ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await page.screenshot({ path: join(OUT_DIR, 'explain-pill.png') });

  await page.locator('#kitty-root [data-kitty="explain"] button', { hasText: 'Ask a follow-up' }).click();
  await page.waitForTimeout(500);
  const st = await sw.evaluate(async () => chrome.storage.session.get(['kitty:chat-draft', 'kitty:sidepanel-tab']));
  log('follow-up: side panel tab =', st['kitty:sidepanel-tab'], '| draft pending =', st['kitty:chat-draft'] ? 'yes' : 'consumed by the side panel');

  // Chrome's native context menu can't be automated: send the message its handler sends.
  await page.locator('#kitty-root [data-kitty="explain"] button', { hasText: 'Close' }).click();
  await page.evaluate(() => getSelection()?.removeAllRanges());
  await sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.id !== undefined) await chrome.tabs.sendMessage(tab.id, { type: 'explain-selection', text: 'git rebase -i HEAD~3' });
  });
  await page.locator('#kitty-root [data-kitty="explain"] .md').waitFor({ timeout: 60_000 });
  await explanationDone(page);
  const risk = await page.locator('#kitty-root [data-kitty="risk"]').innerText().catch(() => 'none');
  if (risk !== 'Rewrites history') throw new Error(`unexpected risk badge for git rebase -i: ${risk}`);
  log('context-menu path: risk badge =', risk);
  await page.screenshot({ path: join(OUT_DIR, 'explain-context-menu.png') });

  await page.keyboard.press('Escape');
  log('after Esc, bubbles open:', await page.locator('#kitty-root [data-kitty="explain"]').count());
  await ctx.close();
}
