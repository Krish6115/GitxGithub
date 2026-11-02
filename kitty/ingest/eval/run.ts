// Retrieval eval: hit@k and MRR over eval/questions.json against kitty/server/data/index.json.
// Usage: npm run eval -w ingest  [-- --verbose]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { DEFAULT_INDEX_PATH, fromIndexFile } from '../../server/src/rag/load-index.js';
import { retrieveFrom } from '../../server/src/rag/retrieve.js';

const K = 6;
const TARGET = 0.85;
const verbose = process.argv.includes('--verbose');
// --no-synonyms: ablation to see how much the synonym table carries
const synonymWeight = process.argv.includes('--no-synonyms') ? 0 : undefined;

const Questions = z.array(z.object({ id: z.string(), question: z.string(), expected: z.array(z.string()).min(1) }));
const questions = Questions.parse(JSON.parse(readFileSync(fileURLToPath(new URL('./questions.json', import.meta.url)), 'utf8')));
const index = fromIndexFile(JSON.parse(readFileSync(DEFAULT_INDEX_PATH, 'utf8')));

const known = new Set(index.chunks.map((c) => c.sourceFile));
for (const q of questions) {
  for (const e of q.expected) if (!known.has(e)) throw new Error(`${q.id}: expected source not in index: ${e}`);
}

let hits = 0;
let rrSum = 0;
const short = (p: string): string => p.split('/').pop()?.replace(/\(.*\)/, '(…)') ?? p;
for (const q of questions) {
  const results = retrieveFrom(index, q.question, K, synonymWeight === undefined ? {} : { synonymWeight });
  const rank = results.findIndex((r) => q.expected.includes(r.sourceFile)) + 1;
  if (rank > 0) {
    hits++;
    rrSum += 1 / rank;
  }
  const mark = rank > 0 ? `hit@${rank}` : 'MISS ';
  console.log(`${mark.padEnd(6)} ${q.id}`);
  if (rank === 0 || verbose) {
    console.log(`         expected: ${q.expected.map(short).join(', ')}`);
    console.log(`         got:      ${results.map((r) => `${short(r.sourceFile)}${r.headingPath[0] ? ` › ${r.headingPath[0]}` : ''}`).join(' | ')}`);
  }
}

const hitRate = hits / questions.length;
console.log(`\nhit@${K}: ${hits}/${questions.length} = ${(hitRate * 100).toFixed(1)}%   MRR: ${(rrSum / questions.length).toFixed(3)}   target ≥ ${TARGET * 100}%`);
if (hitRate < TARGET) process.exitCode = 1;
