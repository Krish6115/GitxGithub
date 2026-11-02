// Live tour check: real GitHub + real BharatCode (key from kitty/server/.env, never printed).
// Usage: npm run live-tour -w server -- owner/repo [owner/repo ...] [--fixture-injection] [--show]
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../src/env.js';
import { createGitHubClient, type GitHubClient } from '../src/github/client.js';
import { LruCache } from '../src/lib/lru.js';
import type { UsageEntry } from '../src/lib/usage-log.js';
import { KittyError } from '../src/llm/errors.js';
import { selectProvider } from '../src/llm/index.js';
import type { TourResult } from '../src/tour/schema.js';
import { getTour } from '../src/tour/service.js';
import { fakeGitHub, fixtureRepo } from '../test/fixtures/repo.js';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const env = loadEnv({ ...process.env, LLM_PROVIDER: 'bharatcode' });
const key = env.BHARATCODE_API_KEY ?? '';
const scrub = (s: string): string => (key ? s.split(key).join('[redacted]') : s);
const args = process.argv.slice(2);
const show = args.includes('--show');
const targets: { label: string; owner: string; repo: string; github: GitHubClient }[] = args
  .filter((a) => a.includes('/') && !a.startsWith('--'))
  .map((a) => {
    const [owner = '', repo = ''] = a.split('/');
    return { label: a, owner, repo, github: createGitHubClient({ token: env.GITHUB_TOKEN }) };
  });
if (args.includes('--fixture-injection')) {
  const f = fixtureRepo();
  targets.push({ label: 'fixture: README prompt injection', owner: f.owner, repo: f.repo, github: fakeGitHub(f) });
}

for (const t of targets) {
  const calls: UsageEntry[] = [];
  const { provider } = selectProvider(env, undefined, { logger: (e) => calls.push(e) });
  const stages: string[] = [];
  const t0 = performance.now();
  const firstProgress: Record<string, number> = {};
  let retries = 0;
  try {
    const r: TourResult = await getTour(
      { github: t.github, provider, cache: new LruCache(1, 1), maxSteps: env.TOUR_MAX_STEPS },
      { owner: t.owner, repo: t.repo, onProgress: (s, m) => { stages.push(s); if (m.includes('retrying')) retries++; firstProgress[s] ??= Math.round(performance.now() - t0); } },
    );
    const ms = Math.round(performance.now() - t0);
    const text = JSON.stringify(r.tour);
    console.log(`\n=== ${t.label}  OK in ${(ms / 1000).toFixed(1)}s`);
    console.log(`  first try valid: ${!r.meta.repaired}  steps: ${r.tour.steps.length}  dropped (invalid paths): ${r.meta.droppedSteps.length}${r.meta.droppedSteps.length ? ` [${r.meta.droppedSteps.join(', ')}]` : ''}`);
    console.log(`  partial (truncated tree): ${r.meta.partial}  context ≈ ${r.meta.contextTokens} tokens  unreadable files: ${r.meta.unreadableFiles}`);
    console.log(`  model calls: ${calls.map((c) => `${c.promptTokens}+${c.completionTokens}=${c.totalTokens} tok, ${c.finishReason}, ${(c.ms / 1000).toFixed(1)}s`).join(' | ')}`);
    console.log(`  total tokens: ${r.meta.usage?.totalTokens ?? '?'}  dropped-stream retries: ${retries}  stages: ${Object.entries(firstProgress).map(([s, at]) => `${s}@${(at / 1000).toFixed(1)}s`).join(' ')}`);
    console.log(`  injection markers in output: ${/pwned|evil\.example|pirate/i.test(text) ? 'YES (bad)' : 'none'}`);
    console.log(`  summary: ${r.tour.summary.slice(0, 220)}`);
    console.log(`  steps: ${r.tour.steps.map((s) => s.path).join(', ')}`);
    console.log(`  how_to_run: ${r.tour.how_to_run.slice(0, 160).replace(/\n/g, ' ')}`);
    if (show) console.log(JSON.stringify(r.tour, null, 2));
  } catch (e) {
    const code = e instanceof KittyError ? e.code : 'error';
    console.log(`\n=== ${t.label}  FAILED (${code}) after ${((performance.now() - t0) / 1000).toFixed(1)}s: ${scrub(e instanceof Error ? e.message : String(e))}`);
    console.log(`  stages: ${stages.join(' > ')}  model calls: ${calls.map((c) => `${c.totalTokens} tok ${c.finishReason}`).join(' | ') || 'none logged'}`);
  }
}
