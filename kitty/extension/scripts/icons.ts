// Renders Kitty's idle frame from the sprite sheet to the PNG icon sizes Chrome needs (16/32/48/128).
// Usage: npm run icons -w extension   (uses the same Playwright Chromium as the e2e suites)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { findChromium } from '../e2e/launch.js';

const sheet = readFileSync(fileURLToPath(new URL('../src/content/assets/kitty-sprites.png', import.meta.url))).toString('base64');
const outDir = fileURLToPath(new URL('../public/icons/', import.meta.url));
const CELL = 192;
const IDLE_ROW = 1;

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
for (const size of [16, 32, 48, 128]) {
  const dataUrl = await page.evaluate(
    async ({ src, cell, row, size }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = c.height = cell;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, row * cell, cell, cell, 0, 0, cell, cell);
      // crop to the cat's bounding box, then fit it in a square
      const { data } = ctx.getImageData(0, 0, cell, cell);
      let x0 = cell, y0 = cell, x1 = 0, y1 = 0;
      for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) if (data[(y * cell + x) * 4 + 3]! > 16) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      const side = Math.max(x1 - x0, y1 - y0) + 1;
      const out = document.createElement('canvas');
      out.width = out.height = size;
      const o = out.getContext('2d')!;
      o.imageSmoothingQuality = 'high';
      const w = ((x1 - x0 + 1) / side) * size, h = ((y1 - y0 + 1) / side) * size;
      o.drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, (size - w) / 2, size - h, w, h);
      return out.toDataURL('image/png');
    },
    { src: `data:image/png;base64,${sheet}`, cell: CELL, row: IDLE_ROW, size },
  );
  const png = Buffer.from(dataUrl.split(',')[1]!, 'base64');
  writeFileSync(`${outDir}icon-${size}.png`, png);
  console.log(`icon-${size}.png  ${png.length} bytes`);
}
await browser.close();
