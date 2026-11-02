// CLI: npm run ingest  ->  kitty/server/data/index.json
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex } from './build-index.js';
import { estimateTokens } from './chunk.js';
import { correctionsSource, listSources } from './sources.js';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const transcriptDir = fileURLToPath(new URL('../transcripts/', import.meta.url));
const outFile = join(repoRoot, 'kitty', 'server', 'data', 'index.json');

const corrections = correctionsSource(repoRoot);
const sources = [...listSources(repoRoot, undefined, transcriptDir), ...(corrections ? [corrections] : [])];
const { file, report } = await buildIndex(repoRoot, sources);

for (const r of report) console.log(`  ${String(r.chunks).padStart(3)} chunks  ${r.via.padEnd(10)}  ${r.path}`);
const skipped = report.filter((r) => r.via === 'skipped');
if (skipped.length) console.warn(`WARNING: no text for ${skipped.map((s) => s.path).join(', ')}`);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(file));

const sizes = file.chunks.map((c) => estimateTokens(c.text)).sort((a, b) => a - b);
const pct = (p: number): number => sizes[Math.min(sizes.length - 1, Math.floor((p / 100) * sizes.length))] ?? 0;
console.log(
  `\n${file.chunks.length} chunks from ${sources.length} sources; tokens p10/p50/p90/max = ` +
    `${pct(10)}/${pct(50)}/${pct(90)}/${sizes.at(-1) ?? 0}`,
);
console.log(`Wrote kitty/server/data/index.json (${(statSync(outFile).size / 1024).toFixed(0)} KB)`);
