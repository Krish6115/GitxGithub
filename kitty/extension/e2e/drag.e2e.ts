// Drag the cat: it follows the pointer while held, lands where it's dropped, and stays there after a reload.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function dragE2E(): Promise<void> {
  const { ctx } = await launch();
  const page = await ctx.newPage();
  const state = () =>
    page.evaluate(() => {
      const root = document.getElementById('kitty-root')?.shadowRoot;
      const r = root?.querySelector('.cat')?.getBoundingClientRect();
      return { mode: root?.querySelector('.kitty')?.getAttribute('data-kitty-mode'), x: Math.round(r?.left ?? -1), y: Math.round(r?.top ?? -1), menu: !!root?.querySelector('[data-kitty="start-tour"]') };
    });
  await page.goto('https://github.com/Krish6115/GitKitty', { waitUntil: 'domcontentloaded' });
  await page.locator('#kitty-root button.cat').waitFor();
  await page.waitForTimeout(2500); // let the hello wave finish
  const start = await state();
  const cx = start.x + 48;
  const cy = start.y + 30;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) await page.mouse.move(cx - i * 30, cy - i * 15, { steps: 2 });
  const held = await state();
  await page.screenshot({ path: join(OUT_DIR, 'drag-held.png') });
  await page.mouse.up();
  await page.waitForTimeout(150);
  const landed = await state();
  await page.waitForTimeout(3000);
  const after = await state();
  if (held.mode !== 'held') throw new Error(`while dragging, mode was ${held.mode}`);
  if (Math.abs(after.x - (start.x - 600)) > 10 || Math.abs(after.y - (start.y - 300)) > 10) throw new Error(`dropped at ${after.x},${after.y}, expected about ${start.x - 600},${start.y - 300}`);
  if (after.menu) throw new Error('a drag opened the menu');
  log(`start ${start.x},${start.y} -> held (${held.mode}) -> ${landed.mode} -> rests at ${after.x},${after.y} (${after.mode})`);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#kitty-root button.cat').waitFor();
  await page.waitForTimeout(800);
  const reloaded = await state();
  if (Math.abs(reloaded.x - after.x) > 10 || Math.abs(reloaded.y - after.y) > 10) throw new Error(`after reload the cat is at ${reloaded.x},${reloaded.y}`);
  log(`after reload: ${reloaded.x},${reloaded.y}`);
  // a plain click still opens the menu
  await page.locator('#kitty-root button.cat').click();
  if (!(await state()).menu) throw new Error('click no longer opens the menu');
  log('click still opens the menu');
  // left alone for a minute (menu closed), the cat walks back to its corner
  await page.locator('#kitty-root button.cat').click();
  await page.mouse.move(200, 400);
  await page.waitForTimeout(64_000);
  const back = await state();
  log(`after a minute unused: ${back.x},${back.y} (start was ${start.x},${start.y})`);
  if (Math.abs(back.x - start.x) > 10 || Math.abs(back.y - start.y) > 10) throw new Error('the cat did not walk back home');
  await page.screenshot({ path: join(OUT_DIR, 'drag-dropped.png') });
  await ctx.close();
}
