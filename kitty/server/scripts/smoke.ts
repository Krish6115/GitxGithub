// One real BharatCode call to check the key and endpoint. Usage: npm run smoke -w server [-- --stream]
// Reads kitty/server/.env. Never prints the key.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../src/env.js';
import { createBharatCodeProvider } from '../src/llm/BharatCodeProvider.js';
import { KittyError } from '../src/llm/errors.js';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (!existsSync(envPath)) {
  console.error('No kitty/server/.env found. Copy server/.env.example to server/.env and add BHARATCODE_API_KEY.');
  process.exit(1);
}
process.loadEnvFile(envPath);
const env = loadEnv();
const key = env.BHARATCODE_API_KEY?.trim() ?? '';
if (!key || /PASTE|YOUR_KEY|placeholder/i.test(key)) {
  console.error('BHARATCODE_API_KEY in kitty/server/.env is missing or still the placeholder.');
  process.exit(1);
}
const scrub = (s: string): string => s.split(key).join('[redacted]');
const useStream = process.argv.includes('--stream');

console.log(`endpoint: ${env.BHARATCODE_BASE_URL}  model: ${env.BHARATCODE_MODEL}  key: set  mode: ${useStream ? 'stream (deltas)' : 'chat'}`);
const provider = createBharatCodeProvider({
  baseUrl: env.BHARATCODE_BASE_URL,
  model: env.BHARATCODE_MODEL,
  apiKey: key,
  firstTokenMs: env.LLM_FIRST_TOKEN_MS,
  idleMs: env.LLM_IDLE_MS,
});
// --reasoning-check: a 20-token budget with high reasoning effort. Shows how a tiny budget ends:
// partial text -> truncated: true; reasoning only (empty content) -> reasoning_budget_exhausted error.
const reasoningCheck = process.argv.includes('--reasoning-check');
const req = reasoningCheck
  ? { kind: 'tutor' as const, maxTokens: 20, reasoningEffort: 'high' as const, messages: [{ role: 'user' as const, content: 'Explain git rebase in one paragraph.' }] }
  : {
      kind: 'explain' as const,
      maxTokens: 200,
      reasoningEffort: 'none' as const,
      messages: [{ role: 'user' as const, content: 'Reply with exactly: pong' }],
    };

const t0 = performance.now();
let firstChunkMs: number | null = null;
try {
  let result;
  if (useStream) {
    for await (const ev of provider.stream(req)) {
      if (ev.type === 'delta') firstChunkMs ??= performance.now() - t0;
      else result = ev.result;
    }
  } else {
    result = await provider.chat(req);
  }
  if (!result) throw new Error('no result');
  const ms = Math.round(performance.now() - t0);
  console.log(`OK  reply: ${JSON.stringify(scrub(result.text.trim()).slice(0, 80))}`);
  console.log(`    finish_reason: ${result.finishReason}  truncated: ${result.truncated}  model: ${result.model}`);
  console.log(`    tokens: prompt ${result.usage?.promptTokens ?? '?'}  completion ${result.usage?.completionTokens ?? '?'}  total ${result.usage?.totalTokens ?? '?'}`);
  console.log(`    time: total ${ms} ms${firstChunkMs !== null ? `, first content chunk ${Math.round(firstChunkMs)} ms` : ''}`);
} catch (e) {
  const code = e instanceof KittyError ? e.code : 'error';
  console.error(`FAILED (${code}): ${scrub(e instanceof Error ? e.message : String(e))}`);
  process.exit(1);
}
