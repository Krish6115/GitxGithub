// The cat renders on github.com and survives GitHub's in-page navigation.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function catE2E(): Promise<void> {
  const { ctx } = await launch();
  const page = await ctx.newPage();
  const check = async (label: string): Promise<void> => {
    await page.waitForSelector('#kitty-root', { state: 'attached', timeout: 15_000 });
    const info = await page.evaluate(() => {
      const img = document.getElementById('kitty-root')?.shadowRoot?.querySelector('img');
      const r = img?.getBoundingClientRect();
      return { loaded: Boolean(img?.complete && img.naturalWidth > 0), w: r?.width, h: r?.height, right: r ? innerWidth - r.right : null, bottom: r ? innerHeight - r.bottom : null };
    });
    if (!info.loaded) throw new Error(`${label}: cat sprite not loaded`);
    log(`${label}:`, JSON.stringify(info));
  };
  await page.goto('https://github.com/git/git', { waitUntil: 'domcontentloaded' });
  await check('repo page');
  await page.screenshot({ path: join(OUT_DIR, 'cat.png') });
  await page.click('a[href="/git/git/pulls"]');
  await page.waitForURL('**/pulls');
  await check('after in-page navigation to /pulls');
  await ctx.close();
}
