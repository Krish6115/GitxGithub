// Live tutor check against the real BharatCode model (key from kitty/server/.env, never printed).
// Usage: npm run live-tutor -w server [-- --show]
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../src/env.js';
import type { UsageEntry } from '../src/lib/usage-log.js';
import { KittyError } from '../src/llm/errors.js';
import { selectProvider } from '../src/llm/index.js';
import { retrieve } from '../src/rag/retrieve.js';
import type { TutorTurn } from '../src/tutor/history.js';
import { streamTutor } from '../src/tutor/service.js';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const env = loadEnv({ ...process.env, LLM_PROVIDER: 'bharatcode' });
const key = env.BHARATCODE_API_KEY ?? '';
const scrub = (s: string): string => (key ? s.split(key).join('[redacted]') : s);
const show = process.argv.includes('--show');

interface Case { kind: string; q: string; followUpOf?: number; expect?: RegExp }
const CASES: Case[] = [
  { kind: 'scenario', q: 'I pushed a bad commit to main and my teammates already pulled. How do I undo it?' },
  { kind: 'scenario', q: 'My fork is 30 commits behind the original repo. How do I sync it?' },
  { kind: 'scenario', q: 'How do I squash my last 3 commits into one before opening a PR?' },
  { kind: 'scenario', q: 'I got a conflict in the middle of git rebase. What do I do now?' },
  { kind: 'scenario', q: 'How do I stash my changes including new untracked files?' },
  { kind: 'scenario', q: 'How do I set up an SSH key so I can push to GitHub?' },
  { kind: 'correction', q: 'If I push a tag to GitHub, does it automatically create a release?', expect: /\bno\b|not|separate/i },
  { kind: 'fake flag', q: 'What does git commit --auto-squash-all do?', expect: /not (sure|find|exist|a real|a valid)|doesn.t exist|no such|isn.t a|not .*option/i },
  { kind: 'off-topic', q: 'How do I bake sourdough bread?', expect: /git|only|can.t help|outside|not able/i },
  { kind: 'follow-up', q: 'What about if the commit is only on my local branch?', followUpOf: 0 },
];

const answers: string[] = [];
let totalTokens = 0;
for (const [i, c] of CASES.entries()) {
  const calls: UsageEntry[] = [];
  const { provider } = selectProvider(env, undefined, { logger: (e) => calls.push(e) });
  const history: TutorTurn[] = c.followUpOf !== undefined
    ? [{ role: 'user', content: CASES[c.followUpOf]?.q ?? '' }, { role: 'assistant', content: answers[c.followUpOf] ?? '' }]
    : [];
  const t0 = performance.now();
  let first: number | null = null;
  let answer = '';
  let sources = 0;
  let weak = false;
  let unverified: string[] = [];
  try {
    for await (const ev of streamTutor({ provider, retrieve: (q, k) => retrieve(q, k) }, { question: c.q, history })) {
      if (ev.type === 'sources') { sources = ev.sources.length; weak = ev.weak; }
      else if (ev.type === 'delta') { first ??= performance.now() - t0; answer += ev.text; }
      else if (ev.type === 'done') unverified = ev.unverifiedFlags;
    }
    answers[i] = answer;
    const u = calls[0];
    totalTokens += u?.totalTokens ?? 0;
    const cited = /\[\d\]/.test(answer);
    const format = ['**Situation:**', '**Commands:**', '**Why:**'].filter((h) => answer.includes(h)).length;
    const ok = c.expect ? (c.expect.test(answer) ? 'expected behaviour: yes' : 'expected behaviour: NO') : '';
    console.log(`\n[${i + 1}] ${c.kind}: ${c.q}`);
    console.log(`    cited: ${cited}  format sections: ${format}/3  unverified flags: ${unverified.length ? unverified.join(' ') : 'none'}  sources: ${sources}${weak ? ' (weak)' : ''}  ${ok}`);
    console.log(`    tokens: ${u?.promptTokens}+${u?.completionTokens}=${u?.totalTokens}  finish: ${u?.finishReason}  first text: ${first ? (first / 1000).toFixed(1) : '?'}s  total: ${((performance.now() - t0) / 1000).toFixed(1)}s`);
    console.log(`    answer: ${answer.replace(/\s+/g, ' ').slice(0, show ? 4000 : 200)}`);
  } catch (e) {
    console.log(`\n[${i + 1}] ${c.kind}: FAILED (${e instanceof KittyError ? e.code : 'error'}): ${scrub(e instanceof Error ? e.message : String(e))}`);
  }
}
console.log(`\ntotal tokens across ${CASES.length} questions: ${totalTokens} (avg ${Math.round(totalTokens / CASES.length)})`);
