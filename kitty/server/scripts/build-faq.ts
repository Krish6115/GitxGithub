// Builds data/faq.json: each canonical question in scripts/faq-questions.json goes through the normal tutor pipeline
// (retrieval + sources + flag check) on the real BharatCode model. Answers that fail Kitty's checks are left out.
// Usage: npm run build-faq -w server   (key from kitty/server/.env, never printed)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { loadEnv } from '../src/env.js';
import { selectProvider } from '../src/llm/index.js';
import { retrieve } from '../src/rag/retrieve.js';
import { FaqFileSchema, type FaqEntry } from '../src/tutor/faq.js';
import { streamTutor, type TutorSource } from '../src/tutor/service.js';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const env = loadEnv({ ...process.env, LLM_PROVIDER: 'bharatcode' });
const key = env.BHARATCODE_API_KEY ?? '';
const scrub = (s: string): string => (key ? s.split(key).join('[redacted]') : s);

const Questions = z.array(z.object({ id: z.string(), questions: z.array(z.string()).min(1) }));
const list = Questions.parse(JSON.parse(readFileSync(fileURLToPath(new URL('./faq-questions.json', import.meta.url)), 'utf8')));
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const outPath = fileURLToPath(new URL('../data/faq.json', import.meta.url));
const previous = existsSync(outPath) ? FaqFileSchema.parse(JSON.parse(readFileSync(outPath, 'utf8'))).entries : [];

const entries: FaqEntry[] = [];
let tokens = 0;
for (const item of list) {
  const old = previous.find((e) => e.id === item.id);
  if (only && !only.includes(item.id)) {
    if (old) entries.push({ ...old, questions: item.questions });
    continue;
  }
  const { provider } = selectProvider(env, undefined);
  let answer = '';
  let sources: TutorSource[] = [];
  let weak = false;
  let flags: string[] = [];
  let truncated = false;
  try {
    for await (const ev of streamTutor({ provider, retrieve: (q, k) => retrieve(q, k) }, { question: item.questions[0] ?? '', history: [] })) {
      if (ev.type === 'sources') ({ sources, weak } = ev);
      else if (ev.type === 'delta') answer += ev.text;
      else if (ev.type === 'done') {
        flags = ev.unverifiedFlags;
        truncated = ev.truncated;
        tokens += ev.usage?.totalTokens ?? 0;
      }
    }
  } catch (e) {
    console.log(`SKIP ${item.id}: ${scrub(e instanceof Error ? e.message : String(e))}`);
    if (old) entries.push(old);
    continue;
  }
  const problems = [weak && 'weak sources', flags.length > 0 && `unverified flags ${flags.join(' ')}`, truncated && 'truncated', /ACTION:/.test(answer) && 'action line', !/\[\d+\]/.test(answer) && 'no citations'].filter(Boolean);
  if (problems.length > 0) {
    console.log(`SKIP ${item.id}: ${problems.join(', ')}`);
    if (old) entries.push(old);
    continue;
  }
  entries.push({ id: item.id, questions: item.questions, answer: answer.trim(), sources });
  console.log(`ok   ${item.id} (${answer.length} chars, ${sources.length} sources)`);
}
writeFileSync(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), model: env.BHARATCODE_MODEL, entries }, null, 2)}\n`);
console.log(`\n${entries.length}/${list.length} answers written to data/faq.json, ${tokens} tokens`);
