// Side panel chat (opened as a page) + the cat's "Ask Kitty" menu item.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function chatE2E(question = 'How do I undo a commit I already pushed?', label = 'chat'): Promise<void> {
  const { ctx, sw, extId } = await launch({ width: 420, height: 900 });

  const gh = await ctx.newPage();
  await gh.setViewportSize({ width: 1280, height: 800 });
  await gh.goto('https://github.com/honojs/hono', { waitUntil: 'domcontentloaded' });
  await gh.locator('#kitty-root button.cat').click();
  await gh.locator('#kitty-root [data-kitty="ask"]').click();
  await gh.waitForTimeout(1500);
  log(`cat menu "Ask Kitty": ${(await gh.locator('#kitty-root .hint').count()) ? 'side panel blocked -> toolbar hint shown' : 'side panel opened'}`);
  log('side panel tab requested:', await sw.evaluate(async () => (await chrome.storage.session.get('kitty:sidepanel-tab'))['kitty:sidepanel-tab']));

  const panel = await ctx.newPage();
  await panel.goto(`chrome-extension://${extId}/src/sidepanel/index.html`);
  await panel.getByRole('tab', { name: 'Ask Kitty' }).click();
  await panel.getByLabel('Your question').fill(question);
  const t0 = Date.now();
  await panel.keyboard.press('Enter');
  await panel.locator('.msg.kitty .md').first().waitFor({ timeout: 120_000 });
  const first = Date.now() - t0;
  await panel.locator('.msg.kitty[data-status="done"], .msg.kitty[data-status="error"]').waitFor({ timeout: 180_000 });
  const total = Date.now() - t0;
  const status = await panel.locator('.msg.kitty').last().getAttribute('data-status');
  if (status !== 'done') throw new Error(`answer status: ${status}`);
  log(`answer: first text ${(first / 1000).toFixed(1)}s, total ${(total / 1000).toFixed(1)}s`);
  log(`inline citations: ${await panel.locator('.msg.kitty a.cite').count()}  sources: ${await panel.locator('.msg.kitty .sources li').count()}  code blocks: ${await panel.locator('.msg.kitty .code pre').count()}`);
  await panel.evaluate(() => document.querySelectorAll('details.sources').forEach((d) => d.setAttribute('open', '')));
  await panel.screenshot({ path: join(OUT_DIR, `${label}.png`), fullPage: true });
  await ctx.close();
}
