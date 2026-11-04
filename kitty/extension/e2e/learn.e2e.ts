// Learning features: Practice mode (solve a scenario), a guided lesson, the first-PR guide, pasted-error help in the
// chat, and the hover explanation of GitHub's own buttons.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function learnE2E(repo = 'honojs/hono'): Promise<void> {
  const { ctx, extId } = await launch();
  const panel = await ctx.newPage();
  await panel.setViewportSize({ width: 420, height: 900 });
  await panel.goto(`chrome-extension://${extId}/src/sidepanel/index.html`);

  // 1. Practice: undo a commit and keep the work
  await panel.locator('nav.tabs button', { hasText: 'Learn' }).click();
  await panel.locator('[data-kitty="learn-practice"]').click();
  await panel.locator('[data-kitty="practice"] select').selectOption('undo-commit');
  await panel.locator('[data-kitty="git-graph"] svg').waitFor({ timeout: 5000 });
  await panel.locator('.term-input input').fill('git reset --soft HEAD~1');
  await panel.locator('.term-input button').click();
  await panel.locator('[data-kitty="practice-solved"]').waitFor({ timeout: 5000 });
  await panel.locator('.term-input input').fill('git reset --hard HEAD~1');
  await panel.locator('.term-input button').click();
  const risk = await panel.locator('[data-kitty="practice-log"] .risk').last().innerText();
  log('practice: solved; reset --hard labelled:', risk);
  if (risk !== 'Can lose work') throw new Error('reset --hard not labelled');
  await panel.screenshot({ path: join(OUT_DIR, 'learn-practice.png') });

  // 2. a lesson: Repos and status, through to the check
  await panel.locator('[data-kitty="learn-lessons"]').click();
  await panel.locator('[data-kitty="lessons"] .lesson-list button').first().click();
  for (let i = 0; i < 3; i++) await panel.locator('[data-kitty="lesson-next"]').click();
  await panel.locator('[data-kitty="quiz-card"] button.choice', { hasText: /^git status$/ }).click();
  await panel.locator('[data-kitty="lesson-done"]').waitFor({ timeout: 5000 });
  log('lesson: done');
  await panel.screenshot({ path: join(OUT_DIR, 'learn-lesson.png') });

  // 3. first-PR guide
  await panel.locator('[data-kitty="learn-first-pr"]').click();
  const steps = await panel.locator('[data-kitty="first-pr"] .checklist li').count();
  log(`first PR guide: ${steps} steps`);
  if (steps !== 10) throw new Error('first-PR checklist missing');
  await panel.screenshot({ path: join(OUT_DIR, 'learn-first-pr.png') });

  // 4. chat: a pasted Git error is recognised instantly
  await panel.locator('nav.tabs button', { hasText: 'Ask Kitty' }).click();
  await panel.locator('.composer textarea').fill("To github.com:me/app.git\n ! [rejected]        main -> main (fetch first)\nerror: failed to push some refs to 'github.com:me/app.git'");
  await panel.locator('.composer button[type="submit"]').click();
  await panel.locator('[data-kitty="diagnosis"]').waitFor({ timeout: 15_000 });
  const answer = await panel.locator('.msg.kitty').last().innerText();
  log('diagnosis:', answer.split('\n')[0]);
  if (!answer.includes('git pull --rebase')) throw new Error('no recovery command');
  await panel.screenshot({ path: join(OUT_DIR, 'learn-diagnosis.png') });

  // 5. hover GitHub's Fork button
  const page = await ctx.newPage();
  await page.goto(`https://github.com/${repo}`, { waitUntil: 'domcontentloaded' });
  const fork = page.locator('a, button').filter({ hasText: /^\s*Fork\s*[\d.,]*k?/ }).first();
  log('fork button text:', JSON.stringify((await fork.textContent())?.replace(/\s+/g, ' ').trim()));
  await fork.hover();
  await page.locator('#kitty-root [data-kitty="button-hint"]').waitFor({ timeout: 5000 });
  log('button hint:', (await page.locator('#kitty-root [data-kitty="button-hint"] .meta').innerText()).replace(/\s+/g, ' '));
  await page.screenshot({ path: join(OUT_DIR, 'learn-button-hint.png') });
  await ctx.close();
}
