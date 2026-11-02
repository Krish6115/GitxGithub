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
const BINARY = /\.(png|jpe?g|gif|webp|ico|svg|bmp|tiff?|mp[34]|mov|avi|wav|ogg|woff2?|ttf|otf|eot|pdf|zip|tar|gz|tgz|7z|rar|jar|war|class|exe|dll|so|dylib|bin|dat|db|sqlite|wasm|pyc|lock)$/i;
const LOCKFILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'cargo.lock', 'poetry.lock', 'go.sum', 'composer.lock', 'gemfile.lock', 'bun.lockb', 'uv.lock']);
const MANIFESTS = /^(package\.json|pyproject\.toml|setup\.py|setup\.cfg|requirements\.txt|go\.mod|cargo\.toml|pom\.xml|build\.gradle(\.kts)?|settings\.gradle(\.kts)?|gemfile|composer\.json|.*\.csproj|cmakelists\.txt|makefile|dockerfile|docker-compose\.ya?ml|compose\.ya?ml|deno\.json)$/i;
const ENTRY = /^(main|index|app|server|cli|__main__|manage|program|lib|mod)\.[a-z]+$|^.*application\.(java|kt)$/i;
const CONFIG = /^(tsconfig.*\.json|vite\.config\.\w+|webpack\.config\.\w+|next\.config\.\w+|nuxt\.config\.\w+|rollup\.config\.\w+|babel\.config\.\w+|jest\.config\.\w+|vitest\.config\.\w+|eslint\.config\.\w+|\.eslintrc.*|tox\.ini|pytest\.ini|\.env\.example|turbo\.json|nx\.json|lerna\.json|pnpm-workspace\.yaml)$/i;
const DOCS = /^(readme|contributing|architecture|development|hacking|code_of_conduct)(\.\w+)?$/i;
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|php|cs|cpp|cc|c|h|hpp|swift|scala|ex|exs|dart|vue|svelte)$/i;
const SRC_ROOTS = /^(src|lib|app|cmd|pkg|internal|server|client|packages|apps|core)$/i;
const TEST = /(^|\/)(tests?|__tests__|spec)\/|[._-](test|spec)\.[a-z]+$|_test\.go$/i;

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
  const reasons: string[] = [];
  let score = -1.5 * Math.max(0, depth - 1);
  const add = (n: number, why: string): void => {
    score += n;
    reasons.push(why);
  };

  if (DOCS.test(lower)) add(depth === 0 ? 7 : 2, 'docs');
  if (MANIFESTS.test(lower)) add(depth === 0 ? 8 : 4, 'manifest');
  if (CONFIG.test(lower)) add(depth === 0 ? 3 : 1.5, 'config');
  if (/^\.github\/workflows\/.+\.ya?ml$/i.test(e.path)) add(5 + 1.5, 'ci'); // offsets its depth penalty
  if (CODE.test(lower)) {
    add(2, 'code');
    if (ENTRY.test(name)) add(depth <= 2 ? 7 : 4, 'entry point');
    if (SRC_ROOTS.test(parts[0] ?? '')) add(1, 'source root');
  }
  if (TEST.test(e.path)) add(-1, 'test');
  if (/^docs?\//i.test(e.path) && /\.(md|mdx|rst)$/i.test(lower)) add(1, 'docs folder');
  if (reasons.length === 0) return null; // nothing interesting about it
  return { path: e.path, score: Math.round(score * 10) / 10, reasons };
}

const CAPS: Record<string, number> = { ci: 2, test: 2, 'docs folder': 2 };

/**
 * Top `limit` files, deterministic (score desc, then path), with diversity caps:
 * at most 3 files per directory and small caps for CI / tests / docs-folder files.
 */
export function rankFiles(tree: TreeEntry[], limit = 25): RankedFile[] {
  const scored = tree.map(scoreFile).filter((f): f is RankedFile => f !== null);
  scored.sort((a, b) => b.score - a.score || (a.path < b.path ? -1 : 1));
  const perDir = new Map<string, number>();
  const perKind = new Map<string, number>();
  const out: RankedFile[] = [];
  for (const f of scored) {
    const dir = f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/')) : '.';
    if ((perDir.get(dir) ?? 0) >= 3) continue;
    const capped = f.reasons.find((r) => CAPS[r] !== undefined && (perKind.get(r) ?? 0) >= (CAPS[r] ?? 0));
    if (capped) continue;
    perDir.set(dir, (perDir.get(dir) ?? 0) + 1);
    for (const r of f.reasons) if (CAPS[r] !== undefined) perKind.set(r, (perKind.get(r) ?? 0) + 1);
    out.push(f);
    if (out.length >= limit) break;
  }
  return out;
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
