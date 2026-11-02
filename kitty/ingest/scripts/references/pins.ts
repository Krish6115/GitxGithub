// Pinned upstream commits and local paths for regenerating the knowledge references.
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { SourceKind } from './spec.js';

export interface Upstream {
  repo: string;
  sha: string;
  /** Directory inside the repo that `Part.file` paths are relative to. */
  base: string;
  license: { name: string; url: string };
  attribution: string;
}

export const UPSTREAM: Record<SourceKind, Upstream> = {
  progit: {
    repo: 'progit/progit2',
    sha: 'a013e3230a1207cfa5ae94d28ba7d2021063c337',
    base: 'book',
    license: { name: 'CC BY-NC-SA 3.0', url: 'https://creativecommons.org/licenses/by-nc-sa/3.0/' },
    attribution: 'Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress)',
  },
  ghdocs: {
    repo: 'github/docs',
    sha: 'b8fe41031dc00ff247641ca75bd7e6d25267d6e1',
    base: 'content',
    license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
    attribution: 'GitHub, Inc., GitHub Docs',
  },
  git: {
    repo: 'git/git',
    sha: 'ebdc087dc99d68bb340c282b2ba5f722def28d19',
    base: 'Documentation',
    license: { name: 'GPL-2.0', url: 'https://github.com/git/git/blob/master/COPYING' },
    attribution: 'The Git Project, Git documentation',
  },
};

/** Date the pinned commits were retrieved; printed in every generated file. */
export const RETRIEVED = '2026-11-02';

export const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
/** Downloaded upstream files (gitignored). */
export const CACHE_DIR = join(REPO_ROOT, 'kitty', 'ingest', '.cache', 'references');

export const rawUrl = (kind: SourceKind, path: string): string =>
  `https://raw.githubusercontent.com/${UPSTREAM[kind].repo}/${UPSTREAM[kind].sha}/${path}`;
export const cachePath = (kind: SourceKind, path: string): string => join(CACHE_DIR, kind, path);
