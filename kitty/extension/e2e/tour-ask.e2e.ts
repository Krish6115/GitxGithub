// "Ask" on a tour step: the side panel chat opens pointed at that step, shows the tour, and the question carries the step.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function tourAskE2E(repo = 'Krish6115/GitKitty'): Promise<void> {
  const { ctx, sw, extId } = await launch();
  const page = await ctx.newPage();
  await page.goto(`https://github.com/${repo}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#kitty-root button.cat').click();
  await page.locator('#kitty-root [data-kitty="start-tour"]').click();
  await page.locator('#kitty-root [data-kitty="step"]').waitFor({ timeout: 120_000 });
  await page.locator('#kitty-root [data-kitty="step"] button', { hasText: 'Next' }).click();
  await page.locator('#kitty-root [data-kitty="step"] .meta', { hasText: 'Step 2' }).waitFor({ timeout: 30_000 });
  const buttons = await page.locator('#kitty-root [data-kitty="step"] .row button').allInnerTexts();
  log('step buttons:', buttons.join(' | '));
  if (!buttons.includes('Ask')) throw new Error('no Ask button on the tour step');
  await page.locator('#kitty-root [data-kitty="ask-step"]').click();
  await page.waitForTimeout(300);
  const st = await sw.evaluate(async () => chrome.storage.session.get(['kitty:chat-focus', 'kitty:sidepanel-tab']));
  log('focus:', JSON.stringify(st['kitty:chat-focus']), '| tab:', st['kitty:sidepanel-tab']);
  if ((st['kitty:chat-focus'] as { index?: number } | undefined)?.index !== 1) throw new Error('the Ask button did not point the chat at step 2');

  const panel = await ctx.newPage();
  await panel.goto(`chrome-extension://${extId}/src/sidepanel/index.html`);
  const tabs = await panel.getByRole('tab').allInnerTexts();
  log('side panel tabs:', tabs.join(' | '));
  if (tabs.includes('Tour')) throw new Error('the separate Tour tab is still there');
  await panel.locator('[data-kitty="tour-panel"]').waitFor({ timeout: 5000 });
  const chip = await panel.locator('[data-kitty="focus-chip"]').innerText();
  log('focus chip:', chip.replace(/\s+/g, ' '));
  if (!/step 2/i.test(chip)) throw new Error(`focus chip says: ${chip}`);
  await panel.locator('.composer textarea').fill('Why does this step matter?');
  await panel.locator('.composer button[type="submit"]').click();
  const about = await panel.locator('.msg.user .about').last().innerText();
  log('question tagged:', about);
  if (!/Step 2:/.test(about)) throw new Error('the question was not tagged with the step');
  await panel.locator('.msg.kitty[data-status="done"]').last().waitFor({ timeout: 60_000 });
  await panel.locator('[data-kitty="tour-panel"] > summary').click();
  await panel.setViewportSize({ width: 420, height: 860 });
  await panel.screenshot({ path: join(OUT_DIR, 'tour-ask-panel.png') });
  await page.bringToFront();
  await page.screenshot({ path: join(OUT_DIR, 'tour-ask-step.png') });
  await ctx.close();
}
