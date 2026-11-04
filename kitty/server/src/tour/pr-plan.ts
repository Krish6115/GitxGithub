// PR tours: walk a reviewer (or the author) through a pull request's changed files in a sensible reading order:
// the main code changes first (biggest first, one folder at a time), then tests, then config/CI, then docs.
// Planned by rules so the cat can start at once; the model only explains each file's diff.
import type { PullFile } from '../github/client.js';
import type { PlannedStep } from '../github/plan.js';

export const PR_MAX_STEPS = 10;

type Kind = 'code' | 'test' | 'data' | 'config' | 'ci' | 'docs';
const TEST = /(^|\/)(tests?|__tests__|spec|specs)\/|[._-](test|spec)\.[a-z]+$|_test\.(go|py)$|(^|\/)test_[^/]+\.py$/i;
const DOCS = /\.(md|mdx|rst|txt|adoc)$|(^|\/)docs?\//i;
const CI = /^\.github\/|(^|\/)\.gitlab-ci\.yml$|(^|\/)(azure-pipelines|\.travis|\.circleci)/i;
/** Build, tooling and dependency files (by name); other JSON/YAML/CSV files are data. */
const CONFIG = /(^|\/)(package\.json|tsconfig[\w.-]*\.json|pyproject\.toml|setup\.(py|cfg)|requirements[\w.-]*\.txt|cargo\.toml|go\.mod|pom\.xml|build\.gradle(\.kts)?|gemfile|composer\.json|dockerfile|docker-compose\.ya?ml|compose\.ya?ml|makefile|\.env\.example|\.gitignore|\.gitattributes|\.editorconfig|\.npmrc|\.nvmrc|\.eslintrc[\w.]*|\.prettierrc[\w.]*|[\w.-]+\.config\.\w+|vercel\.json|netlify\.toml)$/i;
const DATA = /\.(json|ya?ml|toml|csv|tsv|xml|ini|cfg)$/i;
const SKIP = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|cargo\.lock|poetry\.lock|go\.sum|composer\.lock|gemfile\.lock|uv\.lock)$|\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|zip|gz|pdf|exe|dll|so|bin|min\.js|map)$/i;

export function prKind(path: string): Kind {
  if (TEST.test(path)) return 'test';
  if (CI.test(path)) return 'ci';
  if (DOCS.test(path)) return 'docs';
  if (CONFIG.test(path)) return 'config';
  if (DATA.test(path)) return 'data';
  return 'code';
}

const ORDER: Record<Kind, number> = { code: 0, test: 1, data: 2, config: 3, ci: 4, docs: 5 };
const dir = (p: string): string => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.');

/** The files a PR tour visits (deleted, binary and lock files are skipped), and the ones left out. */
export function planPrSteps(files: PullFile[], max = PR_MAX_STEPS): { steps: PullFile[]; skipped: PullFile[] } {
  const visitable = files.filter((f) => f.status !== 'removed' && !SKIP.test(f.filename));
  const size = (f: PullFile): number => f.additions + f.deletions;
  // code: biggest change in each folder first, so the tour covers every area the PR touches
  const code = visitable.filter((f) => prKind(f.filename) === 'code').sort((a, b) => size(b) - size(a));
  const firstPerDir: PullFile[] = [];
  const seen = new Set<string>();
  for (const f of code) if (!seen.has(dir(f.filename))) (seen.add(dir(f.filename)), firstPerDir.push(f));
  const orderedCode = [...firstPerDir, ...code.filter((f) => !firstPerDir.includes(f))];
  const rest = visitable.filter((f) => prKind(f.filename) !== 'code').sort((a, b) => ORDER[prKind(a.filename)] - ORDER[prKind(b.filename)] || size(b) - size(a));
  // leave room for at least one test file when there is one
  const tests = rest.filter((f) => prKind(f.filename) === 'test');
  const codeRoom = tests.length ? max - 1 : max;
  const picked = [...orderedCode.slice(0, codeRoom), ...rest].slice(0, max);
  return { steps: picked, skipped: files.filter((f) => !picked.includes(f)) };
}

const STATUS: Record<string, string> = { added: 'new file', modified: 'changed', renamed: 'renamed', copied: 'copied' };

export function draftPrStep(f: PullFile): PlannedStep {
  const name = f.filename.split('/').at(-1) ?? f.filename;
  const lines = `+${f.additions} −${f.deletions} lines`;
  const what = `${STATUS[f.status] ?? f.status}, ${lines}.`;
  const why: Record<Kind, string> = {
    code: 'Part of the main change: read the diff to see what behaviour changes.',
    test: 'Tests show what the change is meant to do, and what must keep working.',
    data: 'Data, fixtures or settings changed: check the values are right and complete.',
    config: 'Configuration or dependencies changed: check it is needed and nothing unrelated slipped in.',
    ci: 'CI or repo automation changed: these affect every future pull request.',
    docs: 'Documentation for the change: check it matches what the code now does.',
  };
  return { path: f.filename, title: `${name}: ${STATUS[f.status] ?? f.status}`, what, why_it_matters: why[prKind(f.filename)], draft: true };
}

/** Exact commands to try the PR locally (from the base repo; works for forks too). */
export function prRunCommands(n: number): string {
  return [
    'Check the PR out locally:',
    '```bash',
    `git fetch origin pull/${n}/head:pr-${n}`,
    `git switch pr-${n}`,
    '```',
    `(origin is the main repository here; if you cloned a fork, use upstream instead.) Then run the project's tests as its README says.`,
  ].join('\n');
}
