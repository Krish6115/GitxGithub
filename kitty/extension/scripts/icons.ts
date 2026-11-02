// Renders the pixel-cat sprite to the PNG icon sizes Chrome needs (16/32/48/128), crisp at every size.
// Usage: npm run icons -w extension   (uses the same Playwright Chromium as the e2e suites)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { findChromium } from '../e2e/launch.js';

const sprite = fileURLToPath(new URL('../public/sprites/kitty.svg', import.meta.url));
const outDir = fileURLToPath(new URL('../public/icons/', import.meta.url));
const svg = readFileSync(sprite, 'utf8');

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  const scaled = svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
  await page.setContent(`<html><body style="margin:0;background:transparent">${scaled}</body></html>`);
  const png = await page.locator('svg').screenshot({ omitBackground: true });
  writeFileSync(`${outDir}icon-${size}.png`, png);
  console.log(`icon-${size}.png  ${png.length} bytes`);
}
await browser.close();
