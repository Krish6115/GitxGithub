// Chat drives the cat: ask the side panel to find an issue -> results card -> "Show me" -> the tab goes to the
// issue and the cat explains it on the page.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function chatActionE2E(question = 'Find me an issue about docker'): Promise<void> {
  const { ctx, extId } = await launch();
  // in the test the side panel runs as a tab, so it is also the "active tab" the action navigates
  const panel = await ctx.newPage();
  await panel.goto(`chrome-extension://${extId}/src/sidepanel/index.html`);
  await panel.locator('.composer textarea').fill(question);
  await panel.locator('.composer button[type="submit"]').click();
  await panel.locator('[data-kitty="action"]').waitFor({ timeout: 60_000 });
  log('action card:', (await panel.locator('[data-kitty="action"] p').first().innerText()).trim());
  await panel.locator('[data-kitty="found"] li').first().waitFor({ timeout: 30_000 });
  const found = await panel.locator('[data-kitty="found"] li > a').allInnerTexts();
  log(`found ${found.length}:`, found.slice(0, 3).join(' | '));
  await panel.setViewportSize({ width: 420, height: 860 });
  await panel.screenshot({ path: join(OUT_DIR, 'chat-action-found.png') });

  await panel.locator('[data-kitty="show-issue"]').first().click();
  await panel.waitForURL(/github\.com\/.+\/issues\/\d+/, { timeout: 15_000 });
  log('tab went to:', panel.url());
  await panel.locator('#kitty-root [data-kitty="explain"] .md').waitFor({ timeout: 60_000 });
  const explanation = await panel.locator('#kitty-root [data-kitty="explain"] .md').innerText();
  log('cat explains:', explanation.slice(0, 120).replace(/\s+/g, ' '));
  await panel.setViewportSize({ width: 1280, height: 860 });
  await panel.screenshot({ path: join(OUT_DIR, 'chat-action-explain.png') });
  await ctx.close();
}
