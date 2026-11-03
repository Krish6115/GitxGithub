// Instant tour plan: Kitty picks and orders the tour's files itself (no model), so the cat can start walking right
// away. The model then only writes the explanations for these exact files, which stream in over the placeholders.
import type { RankedFile } from './rank.js';

export interface PlannedStep {
  path: string;
  title: string;
  what: string;
  why_it_matters: string;
  /** Written by Kitty's heuristics, not the model (yet). */
  draft: true;
}

type Kind = 'readme' | 'manifest' | 'entry' | 'core' | 'docs' | 'test' | 'ci' | 'config';

const name = (p: string): string => p.split('/').at(-1) ?? p;
const dir = (p: string): string => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.');

function kindOf(f: RankedFile): Kind {
  const r = new Set(f.reasons);
  if (/^readme(\.\w+)?$/i.test(name(f.path)) && !f.path.includes('/')) return 'readme';
  if (r.has('manifest')) return 'manifest';
  if (r.has('ci')) return 'ci';
  if (r.has('test')) return 'test';
  if (r.has('config')) return 'config'; // vite.config.ts and friends are code files, but config
  if (r.has('entry point')) return 'entry';
  if (r.has('code')) return 'core';
  if (r.has('docs') || r.has('docs folder') || r.has('document')) return 'docs';
  return 'config';
}

/**
 * Pick `steps` files from the ranked candidates and put them in reading order:
 * README, main manifest, entry point, core modules (spread across folders), docs, tests, CI, config.
 */
export function planSteps(ranked: RankedFile[], steps: number): RankedFile[] {
  const by = new Map<Kind, RankedFile[]>();
  for (const f of ranked) by.set(kindOf(f), [...(by.get(kindOf(f)) ?? []), f]);
  const take = (k: Kind, n: number): RankedFile[] => (by.get(k) ?? []).splice(0, n);

  const head = [...take('readme', 1), ...take('manifest', 1), ...take('entry', 1)];
  const tail = [...(steps >= 6 ? take('test', 1) : []), ...(steps >= 7 ? take('ci', 1) : [])];
  // core modules: one per folder first, so the tour covers the project's areas instead of one folder
  const core = by.get('core') ?? [];
  const spread: RankedFile[] = [];
  const seenDirs = new Set<string>();
  for (const f of core) if (!seenDirs.has(dir(f.path))) (seenDirs.add(dir(f.path)), spread.push(f));
  for (const f of core) if (!spread.includes(f)) spread.push(f);
  const extraEntries = by.get('entry') ?? [];
  const fill = [...spread, ...extraEntries, ...(by.get('docs') ?? []), ...(by.get('manifest') ?? []), ...(by.get('config') ?? []), ...(by.get('test') ?? []), ...(by.get('ci') ?? [])];

  const room = Math.max(0, steps - head.length - tail.length);
  const middle = fill.slice(0, room);
  const picked = [...head, ...middle, ...tail];
  // tiny repos: top up with whatever is left, keeping order
  for (const f of ranked) if (picked.length < steps && !picked.includes(f)) picked.push(f);
  return picked.slice(0, steps);
}

const MANIFEST_WHAT: [RegExp, string][] = [
  [/^package\.json$/i, 'The Node.js manifest: dependencies, and the scripts that build, test and run the project.'],
  [/^(pyproject\.toml|setup\.py|setup\.cfg|requirements\.txt)$/i, 'The Python project file: dependencies and how the package is built.'],
  [/^go\.mod$/i, 'The Go module file: the module path and its dependencies.'],
  [/^cargo\.toml$/i, 'The Rust crate manifest: dependencies and build settings.'],
  [/^(pom\.xml|build\.gradle(\.kts)?|settings\.gradle(\.kts)?)$/i, 'The Java/Kotlin build file: dependencies and build steps.'],
  [/^dockerfile$/i, 'How the app is packaged into a Docker image.'],
  [/^(docker-)?compose\.ya?ml$|^docker-compose\.ya?ml$/i, 'The services that run together with Docker Compose.'],
  [/^(makefile|cmakelists\.txt|kconfig|kbuild)$/i, 'The build rules: the commands used to compile, test and install.'],
];

/** Placeholder explanation shown until the model's version streams in. */
export function draftStep(f: RankedFile): PlannedStep {
  const file = name(f.path);
  const where = dir(f.path) === '.' ? 'the repo root' : `${dir(f.path)}/`;
  const step = (title: string, what: string, why: string): PlannedStep => ({ path: f.path, title, what, why_it_matters: why, draft: true });
  switch (kindOf(f)) {
    case 'readme':
      return step('Start with the README', 'The project overview: what it does, how to install it and how to use it.', 'Knowing what the project is for makes every other file easier to read.');
    case 'manifest':
      return step(`${file}: how it is built`, MANIFEST_WHAT.find(([re]) => re.test(file))?.[1] ?? 'The project manifest: dependencies and build settings.', 'Tells you the stack, the dependencies and the commands to build, run and test.');
    case 'entry':
      return step(`${file}: the entry point`, `Where the program starts (in ${where}).`, 'Follow it to see how the main pieces are wired together.');
    case 'core':
      return step(`${file}: core code`, `One of the main modules in ${where}.`, 'A central part of the codebase; it shows how this area of the project works.');
    case 'test':
      return step(`${file}: the tests`, `Tests in ${where}.`, 'Tests show how the code is meant to be used, and what your changes must keep working.');
    case 'ci':
      return step(`${file}: CI checks`, 'The continuous-integration workflow that runs on pushes and pull requests.', 'These are the checks your pull request has to pass.');
    case 'docs':
      return step(`${file}: documentation`, `Project documentation in ${where}.`, 'Explains design decisions or how to contribute.');
    default:
      return step(`${file}: configuration`, `Tooling or build configuration in ${where}.`, 'Controls how the project is built, linted or tested.');
  }
}
