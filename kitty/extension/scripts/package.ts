// Builds kitty-extension-v<version>.zip from dist/ for "Load unpacked" or the Chrome Web Store.
// Usage: VITE_KITTY_SERVER_URL=https://your-server npm run package -w extension
// (no zip dependency: a minimal deflate zip writer on top of node:zlib)
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string };

if (!process.argv.includes('--no-build')) execSync('npm run build', { cwd: root, stdio: 'inherit' });
const server = process.env.VITE_KITTY_SERVER_URL;
console.log(server ? `default server: ${server}` : 'default server: http://localhost:8787 (set VITE_KITTY_SERVER_URL for a release)');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (const b of buf) c = (CRC_TABLE[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

const local: Buffer[] = [];
const central: Buffer[] = [];
let offset = 0;
const files = walk(dist).sort();
for (const file of files) {
  const name = Buffer.from(relative(dist, file).split(sep).join('/'));
  const data = readFileSync(file);
  const deflated = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6); head.writeUInt16LE(8, 8);
  head.writeUInt32LE(0x00210000, 10); // fixed DOS time (1980-01-01) for reproducible zips
  head.writeUInt32LE(crc, 14); head.writeUInt32LE(deflated.length, 18); head.writeUInt32LE(data.length, 22);
  head.writeUInt16LE(name.length, 26);
  local.push(head, name, deflated);
  const cen = Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8); cen.writeUInt16LE(8, 10);
  cen.writeUInt32LE(0x00210000, 12); cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(deflated.length, 20); cen.writeUInt32LE(data.length, 24);
  cen.writeUInt16LE(name.length, 28); cen.writeUInt32LE(offset, 42);
  central.push(cen, name);
  offset += head.length + name.length + deflated.length;
}
const cenSize = central.reduce((n, b) => n + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(cenSize, 12); end.writeUInt32LE(offset, 16);
const out = join(root, `kitty-extension-v${pkg.version}.zip`);
writeFileSync(out, Buffer.concat([...local, ...central, end]));
console.log(`${relative(process.cwd(), out)}: ${files.length} files, ${(statSync(out).size / 1024).toFixed(0)} KB`);
