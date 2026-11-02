// E2E runner. Needs: a built extension (npm run build -w extension) and the Kitty server on localhost:8787.
// Usage: npm run e2e -w extension -- <cat|tour|chat|explain|all> [--repo owner/name] [--question "..."]
import { catE2E } from './cat.e2e.js';
import { chatE2E } from './chat.e2e.js';
import { explainE2E } from './explain.e2e.js';
import { tourE2E } from './tour.e2e.js';

const args = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const which = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')) ?? 'all';

const suites: Record<string, () => Promise<void>> = {
  cat: () => catE2E(),
  tour: () => tourE2E(opt('repo')),
  chat: () => chatE2E(opt('question')),
  explain: () => explainE2E(),
};

const health = await fetch('http://localhost:8787/health').then((r) => r.json() as Promise<{ provider?: string }>).catch(() => null);
if (!health && which !== 'cat') {
  console.error('Kitty server is not running on localhost:8787 (start it with: npm run dev -w server).');
  process.exit(1);
}
if (health) console.log(`server provider: ${health.provider}`);

let failed = false;
for (const [name, run] of Object.entries(suites)) {
  if (which !== 'all' && which !== name) continue;
  console.log(`\n=== ${name}`);
  try {
    await run();
    console.log(`=== ${name}: passed`);
  } catch (e) {
    failed = true;
    console.error(`=== ${name}: FAILED - ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`);
  }
}
process.exit(failed ? 1 : 0);
