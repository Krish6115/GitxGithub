// The cat renders on github.com and survives GitHub's in-page navigation.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function catE2E(): Promise<void> {
  const { ctx } = await launch();
  const page = await ctx.newPage();
  const check = async (label: string): Promise<void> => {
    await page.waitForSelector('#kitty-root', { state: 'attached', timeout: 15_000 });
    const info = await page.evaluate(() => {
      const root = document.getElementById('kitty-root')?.shadowRoot;
      const svg = root?.querySelector('.cat svg');
      const r = svg?.getBoundingClientRect();
      return {
        drawn: (svg?.querySelectorAll('rect').length ?? 0) > 100,
        mode: root?.querySelector('.kitty')?.getAttribute('data-kitty-mode'),
        w: r?.width, h: r?.height, right: r ? Math.round(innerWidth - r.right) : null, bottom: r ? Math.round(innerHeight - r.bottom) : null,
      };
    });
    if (!info.drawn) throw new Error(`${label}: cat not drawn`);
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
