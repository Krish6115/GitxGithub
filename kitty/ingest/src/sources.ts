import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export interface SourceFile {
  /** Repo-relative POSIX path, e.g. "Git/Git_GitHub_101.pdf". */
  path: string;
  bytes: number;
}

export interface KnowledgeIndex {
  version: 1;
  sources: SourceFile[];
  chunks: unknown[];
}

/** Recursively list PDFs under the given repo-relative dirs, sorted for deterministic output. */
export function listPdfs(repoRoot: string, dirs: string[]): SourceFile[] {
  const found: SourceFile[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.toLowerCase().endsWith('.pdf')) {
        found.push({ path: relative(repoRoot, full).split(sep).join('/'), bytes: statSync(full).size });
      }
    }
  };
  for (const d of dirs) walk(join(repoRoot, d));
  return found.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** Phase 0 stub: records sources only. Chunking + MiniSearch come in a later phase. */
export function buildIndex(sources: SourceFile[]): KnowledgeIndex {
  return { version: 1, sources, chunks: [] };
}
