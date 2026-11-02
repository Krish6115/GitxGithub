// Discovers the learning sources Kitty indexes, with their citation metadata.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

export const REPO_BLOB = 'https://github.com/Krish6115/GitxGithub/blob/main/';
export const SOURCE_DIRS = ['Git', 'Scenario-Based_Guide'];
export const AUTHOR_LICENSE = 'Repository author';

/** Per-file citation overrides for PDFs that are not the repository author's own text. */
const PDF_LICENSES: Record<string, string> = {
  'Git/git-cheat-sheet-education.pdf': 'CC BY 4.0 (GitHub Education cheat sheet, github/training-kit)',
};

export interface SourceFile {
  /** Repo-relative POSIX path, e.g. "Git/Git_GitHub_101.pdf". */
  path: string;
  kind: 'pdf' | 'md';
  bytes: number;
  url: string;
  license: string;
  /** For image-only PDFs: repo-relative path of the transcript used instead of the PDF text. */
  transcript?: string;
}

const toPosix = (p: string): string => p.split(sep).join('/');
export const blobUrl = (path: string): string => REPO_BLOB + path.split('/').map(encodeURIComponent).join('/');

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

/**
 * All PDFs under SOURCE_DIRS plus every Markdown file in a `references/` folder (except SOURCES.md).
 * Sorted for deterministic output.
 */
export function listSources(repoRoot: string, dirs: string[] = SOURCE_DIRS, transcriptDir?: string): SourceFile[] {
  const found: SourceFile[] = [];
  for (const d of dirs) {
    for (const full of walk(join(repoRoot, d))) {
      const path = toPosix(relative(repoRoot, full));
      const lower = path.toLowerCase();
      const bytes = statSync(full).size;
      if (lower.endsWith('.pdf')) {
        const t = transcriptDir ? join(transcriptDir, basename(full).replace(/\.pdf$/i, '.md')) : '';
        found.push({
          path,
          kind: 'pdf',
          bytes,
          url: blobUrl(path),
          license: PDF_LICENSES[path] ?? AUTHOR_LICENSE,
          ...(t && existsSync(t) ? { transcript: toPosix(relative(repoRoot, t)) } : {}),
        });
      } else if (lower.endsWith('.md') && path.split('/').includes('references') && basename(path) !== 'SOURCES.md') {
        found.push({ path, kind: 'md', bytes, url: blobUrl(path), license: 'See per-excerpt source' });
      }
    }
  }
  return found.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

export const CORRECTIONS_PATH = 'kitty/ingest/corrections.md';
export const CORRECTIONS_LICENSE = 'Kitty project (corrections; links official docs)';

/** Kitty's own corrections file (AUDIT.md §5), indexed alongside the learning sources. */
export function correctionsSource(repoRoot: string): SourceFile | null {
  const full = join(repoRoot, CORRECTIONS_PATH);
  if (!existsSync(full)) return null;
  return { path: CORRECTIONS_PATH, kind: 'md', bytes: statSync(full).size, url: blobUrl(CORRECTIONS_PATH), license: CORRECTIONS_LICENSE };
}
