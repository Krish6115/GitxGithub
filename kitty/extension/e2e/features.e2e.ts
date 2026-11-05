// New contributor features: "Why did this fail?" on a CI run, a PR tour, the context pack, the PR draft and the
// learning-path quiz. Works with the mock model (answers are canned) or the real one.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function featuresE2E(ciRun = 'honojs/hono/actions/runs/41812305883', pr = 'Krish6115/GitKitty/pull/10'): Promise<void> {
  const { ctx, extId } = await launch();
  const page = await ctx.newPage();
  const kitty = (sel: string) => page.locator(`#kitty-root ${sel}`);

  // 1. CI run: the cat explains why it failed
  await page.goto(`https://github.com/${ciRun}`, { waitUntil: 'domcontentloaded' });
  await kitty('button.cat').click();
  await kitty('[data-kitty="ci-explain"]').click();
  await page.waitForFunction(() => {
    const b = document.getElementById('kitty-root')?.shadowRoot?.querySelector('[data-kitty="explain"] .explain-body');
    return Boolean(b && (b.textContent ?? '').length > 40 && !b.querySelector('.thinking'));
  }, null, { timeout: 90_000 });
  const ciTitle = await kitty('[data-kitty="ci-title"]').innerText();
  const ciText = await kitty('[data-kitty="explain"] .explain-body').innerText();
  log('ci:', ciTitle, '|', ciText.slice(0, 160).replace(/\s+/g, ' '));
  await page.screenshot({ path: join(OUT_DIR, 'features-ci.png') });
  if (!ciTitle) throw new Error('no failed job/step shown');
  await page.locator('#kitty-root [data-kitty="explain"] button', { hasText: 'Close' }).click();

  // 2. PR tour: changed files at the PR head commit
  await page.goto(`https://github.com/${pr}`, { waitUntil: 'domcontentloaded' });
  await kitty('button.cat').click();
  await kitty('[data-kitty="pr-tour"]').click();
  await kitty('[data-kitty="step"]').waitFor({ timeout: 90_000 });
  const meta = await kitty('[data-kitty="step"] .meta').innerText();
  log('pr tour step:', meta.replace(/\s+/g, ' '), '|', page.url());
  if (!/PR #\d+/.test(meta)) throw new Error('step bubble does not show the PR');
  if (!/\/blob\/[0-9a-f]{40}\//.test(page.url())) throw new Error('step did not open the file at the PR head commit');
  await page.screenshot({ path: join(OUT_DIR, 'features-pr-tour.png') });

  // 3. side panel: PR tour header and the context pack
  const panel = await ctx.newPage();
  await panel.setViewportSize({ width: 420, height: 900 });
  await panel.goto(`chrome-extension://${extId}/src/sidepanel/index.html`);
  const summary = await panel.locator('[data-kitty="tour-panel"] > summary').innerText({ timeout: 10_000 });
  log('panel:', summary);
  if (!/PR #\d+/.test(summary)) throw new Error('tour panel does not show the PR');
  await panel.locator('[data-kitty="tour-panel"] > summary').click();
  await panel.locator('[data-kitty="context-pack"] button:not([disabled])').first().waitFor({ timeout: 90_000 });
  log('context pack:', (await panel.locator('[data-kitty="context-pack"] button').allInnerTexts()).join(' | '));
  await panel.screenshot({ path: join(OUT_DIR, 'features-context-pack.png') });
  await page.bringToFront();
  await page.locator('#kitty-root [data-kitty="step"] button', { hasText: 'Exit' }).click();

  // 4. PR check: draft a description
  await page.goto(`https://github.com/${pr}`, { waitUntil: 'domcontentloaded' });
  await kitty('button.cat').click();
  await kitty('[data-kitty="preflight"]').click();
  await kitty('[data-kitty="draft-pr"]').click({ timeout: 30_000 });
  await kitty('[data-kitty="draft"]').waitFor({ timeout: 90_000 });
  const draft = await kitty('[data-kitty="draft"] .draft-text').first().innerText();
  log('draft title:', draft);
  await page.screenshot({ path: join(OUT_DIR, 'features-draft.png') });

  // 5. learning path: quiz
  await panel.bringToFront();
  await panel.reload();
  await panel.locator('[data-kitty="path-summary"]').waitFor({ timeout: 10_000 });
  log('path:', (await panel.locator('[data-kitty="path-summary"]').innerText()).replace(/\s+/g, ' ').trim());
  await panel.locator('[data-kitty="open-learn"]').click();
  await panel.locator('[data-kitty="quiz-me"]').click();
  const qs = panel.locator('[data-kitty="quiz"] .quiz-q');
  const n = await qs.count();
  for (let i = 0; i < n; i++) await qs.nth(i).locator('button.choice').first().click();
  const result = await panel.locator('[data-kitty="quiz"] > p strong').innerText();
  log(`quiz: ${n} questions, ${result}`);
  await panel.screenshot({ path: join(OUT_DIR, 'features-quiz.png') });
  if (n !== 3 || !/of 3 right/.test(result)) throw new Error('quiz did not run');
  await ctx.close();
}
