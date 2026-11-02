// First run: the welcome tab opens on install, "Test connection" reaches the server, finishing shows the normal tabs.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function onboardingE2E(serverUrl = 'http://localhost:8787'): Promise<void> {
  const { ctx } = await launch({ width: 520, height: 900 }, false);
  const deadline = Date.now() + 10_000;
  let welcome = ctx.pages().find((p) => p.url().includes('?welcome'));
  while (!welcome && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 250));
    welcome = ctx.pages().find((p) => p.url().includes('?welcome'));
  }
  if (!welcome) throw new Error('welcome tab did not open on install');
  log('welcome tab opened on install');
  await welcome.getByLabel('Server URL').fill(serverUrl);
  await welcome.getByRole('button', { name: 'Test connection' }).click();
  const status = welcome.locator('[role="status"]');
  await status.waitFor({ timeout: 10_000 });
  const text = await status.innerText();
  if (!text.startsWith('Connected')) throw new Error(`connection check failed: ${text}`);
  log('test connection:', text);
  await welcome.screenshot({ path: join(OUT_DIR, 'onboarding.png'), fullPage: true });
  await welcome.locator('[data-kitty="finish-onboarding"]').click();
  await welcome.getByRole('tab', { name: 'Ask Kitty' }).waitFor({ timeout: 5000 });
  log('finished: normal tabs shown');
  await ctx.close();
}
