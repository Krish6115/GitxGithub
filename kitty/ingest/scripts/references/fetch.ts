// Downloads the pinned upstream files needed by SPEC into the local cache.
// Usage: npm run refs:fetch -w ingest
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import { CACHE_DIR, cachePath, rawUrl, UPSTREAM } from './pins.js';
import { SPEC, type SourceKind } from './spec.js';

async function get(kind: SourceKind, path: string): Promise<string> {
  const dest = cachePath(kind, path);
  if (existsSync(dest)) return readFileSync(dest, 'utf8');
  const res = await fetch(rawUrl(kind, path));
  if (!res.ok) throw new Error(`${res.status} ${UPSTREAM[kind].repo}@${UPSTREAM[kind].sha.slice(0, 7)}:${path}`);
  const text = await res.text();
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, text);
  return text;
}

const wanted = new Map<SourceKind, Set<string>>([
  ['progit', new Set(['LICENSE.asc'])],
  ['ghdocs', new Set(['LICENSE', 'data/variables/product.yml', 'data/variables/actions.yml', 'data/variables/copilot.yml'])],
  ['git', new Set(['COPYING'])],
]);
for (const file of SPEC) {
  for (const part of file.parts) wanted.get(part.kind)?.add(`${UPSTREAM[part.kind].base}/${part.file}`);
}

let count = 0;
for (const [kind, paths] of wanted) {
  for (const path of paths) {
    const text = await get(kind, path);
    count++;
    if (kind !== 'ghdocs') continue;
    // GitHub Docs pages pull in shared snippets ("reusables"); fetch them recursively.
    const queue = [...text.matchAll(/\{%-?\s*data\s+reusables\.([\w.-]+)\s*-?%\}/g)].map((m) => m[1] ?? '');
    while (queue.length) {
      const key = queue.shift() ?? '';
      const p = `data/reusables/${key.replaceAll('.', '/')}.md`;
      if (paths.has(p)) continue;
      paths.add(p);
      const snippet = await get('ghdocs', p);
      count++;
      for (const m of snippet.matchAll(/\{%-?\s*data\s+reusables\.([\w.-]+)\s*-?%\}/g)) queue.push(m[1] ?? '');
    }
  }
}
console.log(`${count} files ready in ${relative(process.cwd(), CACHE_DIR) || CACHE_DIR}`);
