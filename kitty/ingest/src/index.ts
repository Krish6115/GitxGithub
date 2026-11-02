import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, listPdfs } from './sources.js';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const outFile = join(repoRoot, 'kitty', 'server', 'data', 'index.json');

const sources = listPdfs(repoRoot, ['Git', 'Scenario-Based_Guide']);
for (const s of sources) console.log(`  found ${s.path} (${(s.bytes / 1024).toFixed(0)} KB)`);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(buildIndex(sources), null, 2)}\n`);
console.log(`Wrote ${sources.length} sources -> kitty/server/data/index.json`);
