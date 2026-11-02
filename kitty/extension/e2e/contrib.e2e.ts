// Contributor flow: find a good first issue -> "Help me fix this" walkthrough with git commands -> PR pre-flight check.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function contribE2E(repo = 'honojs/hono', pr = 'Krish6115/GitKitty/pull/4'): Promise<void> {
  const { ctx, extId } = await launch();
  const page = await ctx.newPage();
  const kitty = (sel: string) => page.locator(`#kitty-root ${sel}`);

  // 1. good first issues
  await page.goto(`https://github.com/${repo}`, { waitUntil: 'domcontentloaded' });
  await kitty('button.cat').click();
  const menu = await kitty('.bubble.menu .row button').allInnerTexts();
  log('repo menu:', menu.join(' | '));
  await kitty('[data-kitty="find-issues"]').click();
  await kitty('[data-kitty="issues"] h3').waitFor({ timeout: 30_000 });
  const issues = await kitty('[data-kitty="issues"] .issue-list li > a').allInnerTexts();
  log(`good first issues (${issues.length}):`, issues.slice(0, 3).join(' | '));
  await page.screenshot({ path: join(OUT_DIR, 'contrib-issues.png') });
  if (issues.length === 0) throw new Error('no issues listed');

  // 2. "Help me fix this" on the first one: an issue walkthrough
  await kitty('[data-kitty="fix-issue"]').first().click();
  await kitty('[data-kitty="step"]').waitFor({ timeout: 120_000 });
  const meta = await kitty('[data-kitty="step"] .meta').innerText();
  log('walkthrough step:', meta.replace(/\s+/g, ' '));
  if (!/Issue #\d+/.test(meta)) throw new Error('the step bubble does not show the issue');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(OUT_DIR, 'contrib-walkthrough.png') });

  const panel = await ctx.newPage();
  await panel.goto(`chrome-extension://${extId}/src/sidepanel/index.html`);
  await panel.locator('[data-kitty="fix-plan"]').waitFor({ timeout: 5000 });
  const commands = await panel.locator('[data-kitty="fix-plan"] pre').innerText();
  log('fix plan commands:\n' + commands);
  if (!/git switch -c fix\/\d+-/.test(commands)) throw new Error('no branch command in the fix plan');
  await panel.setViewportSize({ width: 420, height: 860 });
  await panel.screenshot({ path: join(OUT_DIR, 'contrib-fix-plan.png') });
  await panel.close();
  await page.locator('#kitty-root [data-kitty="step"] button', { hasText: 'Exit' }).click();

  // 3. PR pre-flight
  await page.goto(`https://github.com/${pr}`, { waitUntil: 'domcontentloaded' });
  await kitty('button.cat').click();
  await kitty('[data-kitty="preflight"]').click();
  await kitty('[data-kitty="preflight"] h3').waitFor({ timeout: 30_000 });
  const summary = await kitty('[data-kitty="preflight"] .meta').first().innerText();
  const titles = await kitty('[data-kitty="preflight"] .check-title').allInnerTexts();
  log('pre-flight:', summary, '|', titles.map((t) => t.trim()).join(' | '));
  await page.screenshot({ path: join(OUT_DIR, 'contrib-preflight.png') });
  await ctx.close();
}
