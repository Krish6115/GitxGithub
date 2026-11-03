// Heuristic ranking of a repo's files: which ~25 files should a newcomer read first?
import type { TreeEntry } from './client.js';

export interface RankedFile {
  path: string;
  score: number;
  reasons: string[];
}

const IGNORED_DIRS = new Set([
  'node_modules', 'vendor', 'dist', 'build', 'out', 'target', '.git', '__pycache__', '.next', '.nuxt', 'coverage',
  'third_party', 'third-party', '.venv', 'venv', 'bower_components', '.yarn', '.idea', '.vscode', 'fixtures', '__snapshots__',
]);
const BINARY = /\.(png|jpe?g|gif|webp|ico|svg|bmp|tiff?|mp[34]|mov|avi|wav|ogg|woff2?|ttf|otf|eot|zip|tar|gz|tgz|7z|rar|jar|war|class|exe|dll|so|dylib|bin|dat|db|sqlite|wasm|pyc|lock)$/i;
const LOCKFILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'cargo.lock', 'poetry.lock', 'go.sum', 'composer.lock', 'gemfile.lock', 'bun.lockb', 'uv.lock']);
const MANIFESTS = /^(package\.json|pyproject\.toml|setup\.py|setup\.cfg|requirements\.txt|go\.mod|cargo\.toml|pom\.xml|build\.gradle(\.kts)?|settings\.gradle(\.kts)?|gemfile|composer\.json|.*\.csproj|cmakelists\.txt|makefile|kconfig|kbuild|dockerfile|docker-compose\.ya?ml|compose\.ya?ml|deno\.json)$/i;
const ENTRY = /^(main|index|app|server|cli|__main__|manage|program|lib|mod)\.[a-z]+$|^.*application\.(java|kt)$/i;
const CONFIG = /^(tsconfig.*\.json|vite\.config\.\w+|webpack\.config\.\w+|next\.config\.\w+|nuxt\.config\.\w+|rollup\.config\.\w+|babel\.config\.\w+|jest\.config\.\w+|vitest\.config\.\w+|eslint\.config\.\w+|\.eslintrc.*|tox\.ini|pytest\.ini|\.env\.example|turbo\.json|nx\.json|lerna\.json|pnpm-workspace\.yaml)$/i;
const DOCS = /^(readme|contributing|architecture|development|hacking|code_of_conduct)(\.\w+)?$/i;
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|php|cs|cpp|cc|c|h|hpp|swift|scala|ex|exs|dart|vue|svelte)$/i;
const SRC_ROOTS = /^(src|lib|app|cmd|pkg|internal|server|client|packages|apps|core)$/i;
const DOCUMENT = /.pdf$/i;
const TEST = /(^|\/)(tests?|__tests__|spec)\/|[._-](test|spec)\.[a-z]+$|_test\.go$/i;

const AUX_DIRS = /^(playgrounds?|examples?|demos?|samples?|benchmarks?|bench|perf|e2e|scripts|tools|website|site|stories|storybook|templates?|test-utils|mocks?|__mocks__|sandbox|integration)$/i;

/** Score one file; returns null for files a tour should never show. */
export function scoreFile(e: TreeEntry): RankedFile | null {
  if (e.type !== 'blob') return null;
  const parts = e.path.split('/');
  const name = parts.at(-1) ?? '';
  const lower = name.toLowerCase();
  if (parts.slice(0, -1).some((d) => IGNORED_DIRS.has(d.toLowerCase()))) return null;
  if (BINARY.test(lower) || LOCKFILES.has(lower) || /\.min\.(js|css)$|\.map$/.test(lower)) return null;
  if ((e.size ?? 0) > 200_000) return null; // usually generated

  const depth = parts.length - 1;
  // monorepos: packages/<name>/src/... is the real source, so those leading folders don't count as depth
  const mono = /^(packages|apps|crates|libs|modules|services)\/[^/]+\/((src|lib)\/)?/i.exec(e.path)?.[0] ?? '';
  const effectiveDepth = depth - (mono ? mono.split('/').filter(Boolean).length : 0);
  const reasons: string[] = [];
  let score = -1.5 * Math.max(0, effectiveDepth - 1);
  const add = (n: number, why: string): void => {
    score += n;
    reasons.push(why);
  };
  // demos, examples, benchmarks and scripts are not where a project's core lives
  if (parts.slice(0, -1).some((d) => AUX_DIRS.test(d))) add(-6, 'aux');
  if (mono && /^(packages|crates|libs)\//i.test(e.path)) add(1, 'package source');

  if (DOCS.test(lower)) add(depth === 0 ? 7 : 2, 'docs');
  if (DOCUMENT.test(lower)) add(depth <= 1 ? 3 : 1.5, 'document'); // contents not shown, but a tour can point at it
  if (MANIFESTS.test(lower)) add(depth === 0 ? 8 : 4, 'manifest');
  if (CONFIG.test(lower)) add(depth === 0 ? 3 : 1.5, 'config');
  if (/^\.github\/workflows\/.+\.ya?ml$/i.test(e.path)) add(5 + 1.5, 'ci'); // offsets its depth penalty
  if (/^\.github\/workflows\/(ci|test|tests|build|main|check|checks)\.ya?ml$/i.test(e.path)) add(2, 'main ci');
  // any "<tool>.config.<ext>" (rollup, tailwind, playwright, ...) is config, not core code
  if (!CONFIG.test(lower) && /\.config\.[a-z]+$/i.test(lower)) add(depth === 0 ? 3 : 1.5, 'config');
  if (CODE.test(lower)) {
    add(2, 'code');
    if (lower.endsWith('.d.ts')) add(-3, 'type declarations');
    if (/^docs?$/i.test(parts[0] ?? '') && depth > 0) add(-4, 'docs tooling');
    if (ENTRY.test(name)) add(depth <= 2 ? 7 : 4, 'entry point');
    if (SRC_ROOTS.test(parts[0] ?? '')) add(1, 'source root');
    // substantial modules beat tiny helpers: +0..2 for 1 KB..100 KB, -1 for near-empty files
    const size = e.size ?? 0;
    if (size > 0 && size < 300) add(-1, 'tiny');
    else if (size >= 1000) add(Math.min(2, Math.round(Math.log10(size / 1000) * 10) / 10), 'size');
  }
  if (TEST.test(e.path)) add(-1, 'test');
  if (/^docs?\//i.test(e.path) && /\.(md|mdx|rst)$/i.test(lower)) add(1, 'docs folder');
  if (reasons.length === 0) return null; // nothing interesting about it
  return { path: e.path, score: Math.round(score * 10) / 10, reasons };
}

// caps per kind of file; entry points are capped because big trees (e.g. Linux drivers/*/main.c) have dozens
const CAPS: Record<string, number> = { ci: 2, test: 2, 'docs folder': 2, 'entry point': 4 };

/**
 * Top `limit` files, deterministic (score desc, then path), with diversity caps:
 * at most 3 files per directory (4 under source roots) and small caps for CI / tests / docs-folder files.
 */
export function rankFiles(tree: TreeEntry[], limit = 25, issue?: IssueHints): RankedFile[] {
  const scored = tree
    .map(scoreFile)
    .filter((f): f is RankedFile => f !== null)
    .map((f) => (issue ? boostForIssue(f, issue) : f));
  scored.sort((a, b) => b.score - a.score || (a.path < b.path ? -1 : 1));
  const perDir = new Map<string, number>();
  const perKind = new Map<string, number>();
  const out: RankedFile[] = [];
  for (const f of scored) {
    const dir = f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/')) : '.';
    const dirCap = SRC_ROOTS.test(f.path.split('/')[0] ?? '') ? 4 : 3;
    if ((perDir.get(dir) ?? 0) >= dirCap) continue;
    const capped = f.reasons.find((r) => CAPS[r] !== undefined && (perKind.get(r) ?? 0) >= (CAPS[r] ?? 0));
    if (capped) continue;
    perDir.set(dir, (perDir.get(dir) ?? 0) + 1);
    for (const r of f.reasons) if (CAPS[r] !== undefined) perKind.set(r, (perKind.get(r) ?? 0) + 1);
    out.push(f);
    if (out.length >= limit) break;
  }
  return out;
}

/** What an issue mentions (words, identifiers, file names), used to pull matching files up the ranking. */
export interface IssueHints {
  keywords: Set<string>;
  text: string;
}

const STOP = new Set(
  ('this that with from have when what which there their they then than them were will would should could about after before ' +
    'into only also just like make made does doesn using used user users more some other error errors issue issues file files ' +
    'line lines code work works working expected actual behavior behaviour version versions steps step reproduce repro please ' +
    'thanks thank sure need needs want wants able because while where here same each every').split(' '),
);

/** Split "src/userProfile_api.ts" into ["src", "user", "profile", "api"] (words of 3+ letters). */
const pathWords = (p: string): string[] =>
  p
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);

export function issueHints(title: string, body: string): IssueHints {
  const text = `${title}\n${body.slice(0, 6000)}`;
  const counts = new Map<string, number>();
  for (const w of pathWords(text)) if (w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
  // title words count extra: they usually name the thing that is broken
  for (const w of pathWords(title)) if (counts.has(w)) counts.set(w, (counts.get(w) ?? 0) + 2);
  const keywords = new Set([...counts].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([w]) => w));
  return { keywords, text: text.toLowerCase() };
}

/** +3 per issue keyword in the file's path (max +12); +15 when the issue names the file itself. */
export function boostForIssue(f: RankedFile, hints: IssueHints): RankedFile {
  const name = (f.path.split('/').at(-1) ?? '').toLowerCase();
  const matches = new Set(pathWords(f.path).filter((w) => hints.keywords.has(w)));
  let score = f.score;
  const reasons = [...f.reasons];
  if (matches.size > 0) {
    score += Math.min(12, matches.size * 3);
    reasons.push(`issue mentions ${[...matches].slice(0, 3).join(', ')}`);
  }
  if (name.length >= 5 && hints.text.includes(name)) {
    score += 15;
    reasons.push('named in the issue');
  }
  return { ...f, score: Math.round(score * 10) / 10, reasons };
}

/** Locate README / CONTRIBUTING at the root (or .github/, docs/). */
export function findDoc(tree: TreeEntry[], name: 'readme' | 'contributing'): string | undefined {
  const re = new RegExp(`^(\\.github/|docs/)?${name}(\\.(md|markdown|rst|txt))?$`, 'i');
  return tree
    .filter((e) => e.type === 'blob' && re.test(e.path))
    .sort((a, b) => a.path.split('/').length - b.path.split('/').length)[0]?.path;
}

/** Top-level layout: directories with file counts, then root files. */
export function topLevelLayout(tree: TreeEntry[], maxLines = 40): string[] {
  const dirs = new Map<string, number>();
  const files: string[] = [];
  for (const e of tree) {
    const [first, ...rest] = e.path.split('/');
    if (!first) continue;
    if (rest.length === 0) {
      if (e.type === 'blob') files.push(first);
      else if (!dirs.has(first)) dirs.set(first, 0);
    } else if (e.type === 'blob') dirs.set(first, (dirs.get(first) ?? 0) + 1);
  }
  const lines = [...[...dirs].sort().map(([d, n]) => `${d}/ (${n} files)`), ...files.sort()];
  return lines.length > maxLines ? [...lines.slice(0, maxLines), `… ${lines.length - maxLines} more entries`] : lines;
}
