// "Where is X handled in this repo?": find the few files that answer a question about the repo's code.
// Paths from the repo tree are matched against the question's words; GitHub code search (token only) adds files
// whose contents match. The top files are fetched and cut so the tutor prompt stays small.
import type { CodeHit, GitHubClient, TreeEntry } from './client.js';
import { scoreFile } from './rank.js';

export interface RepoFile {
  path: string;
  url: string;
  text: string;
}
export interface RepoFiles {
  repo: string;
  sha: string;
  files: RepoFile[];
}

/** owner/repo from a github.com URL (or "owner/repo"), else null. */
export function repoOf(urlOrName: string | undefined): { owner: string; repo: string } | null {
  if (!urlOrName) return null;
  const m = /^(?:https:\/\/github\.com\/)?([A-Za-z0-9_.-]{1,100})\/([A-Za-z0-9_.-]{1,100})(?:[/?#]|$)/.exec(urlOrName);
  if (!m?.[1] || !m[2]) return null;
  const reserved = /^(orgs|users|settings|search|explore|topics|marketplace|notifications|login|features|pricing|sponsors|trending|collections)$/i;
  return reserved.test(m[1]) ? null : { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

/** Questions about the code in the repo, not about Git itself. */
const CODE_QUESTION = /\b(where|which files?|what files?|find|locate|implement\w*|defin\w*|handl\w*|configur\w*|function|method|class|module|component|endpoint|route|logic|code ?base|codebase|in (this|the) (repo|project|code))\b/i;
const GIT_ONLY = /\b(git (commit|push|pull|rebase|merge|reset|revert|stash|clone|fetch|checkout|switch|branch|log|status|cherry-pick|tag|remote)|undo (my|the|a) (last )?commit|force push|detached head|merge conflict)\b/i;
export const isRepoCodeQuestion = (q: string): boolean => CODE_QUESTION.test(q) && !GIT_ONLY.test(q);

const STOP = new Set('the a an is are was were be of to in on for and or with this that these those where which what how does do did can could should would will i my me we our you your it its from into by at as about file files code repo repository project find locate handled defined implemented please show tell'.split(' '));
/** Distinctive words of the question: identifiers and nouns ("auth", "rate limit", "useTour"). */
export function questionTerms(q: string): string[] {
  const words = q.replace(/[^A-Za-z0-9_\-. ]/g, ' ').split(/\s+/).map((w) => w.replace(/^[.-]+|[.-]+$/g, ''));
  const out: string[] = [];
  for (const w of words) {
    const l = w.toLowerCase();
    if (l.length < 3 || STOP.has(l) || out.includes(l)) continue;
    out.push(l);
  }
  return out.slice(0, 6);
}

/** Score tree paths by how many question words appear in them (path parts weigh more than substrings). */
export function rankPaths(tree: TreeEntry[], terms: string[], hits: CodeHit[] = [], limit = 4): string[] {
  const hitRank = new Map(hits.map((h, i) => [h.path, i]));
  const scored: { path: string; score: number }[] = [];
  for (const e of tree) {
    if (e.type !== 'blob' || (e.size ?? 0) > 200_000) continue;
    const base = scoreFile(e);
    if (!base && !hitRank.has(e.path)) continue; // skip lockfiles, images, vendored code
    const p = e.path.toLowerCase();
    const parts = p.split(/[/._-]/);
    let score = 0;
    for (const t of terms) {
      const stem = t.replace(/(ing|ed|es|s)$/, '');
      if (parts.includes(t) || (stem.length >= 3 && parts.some((x) => x.startsWith(stem)))) score += 6;
      else if (p.includes(stem)) score += 3;
    }
    const h = hitRank.get(e.path);
    if (h !== undefined) score += 10 - h; // code search found the words inside the file
    if (score === 0) continue;
    if (/(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\./.test(p)) score -= 2; // prefer the code over its tests
    scored.push({ path: e.path, score: score + (base?.score ?? 0) / 100 });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.path);
}

/** Show the part of a file around the question's words, not just its first lines. */
export function focusText(text: string, terms: string[], maxChars: number): string {
  if (text.length <= maxChars) return text;
  const lower = text.toLowerCase();
  const at = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (at === undefined || at < maxChars / 2) return `${text.slice(0, maxChars)}\n[…truncated]`;
  const start = text.lastIndexOf('\n', Math.max(0, at - maxChars / 3)) + 1;
  return `[…]\n${text.slice(start, start + maxChars)}\n[…truncated]`;
}

export interface FindOptions {
  /** Code search needs a GitHub token; without one only file paths are matched. */
  canSearchCode: boolean;
  maxFiles?: number;
  maxCharsPerFile?: number;
}

const treeCache = new Map<string, { at: number; sha: string; tree: TreeEntry[] }>();
const TREE_TTL_MS = 10 * 60_000;

async function repoTree(github: GitHubClient, owner: string, repo: string): Promise<{ sha: string; tree: TreeEntry[] }> {
  const key = `${owner}/${repo}`.toLowerCase();
  const hit = treeCache.get(key);
  if (hit && Date.now() - hit.at < TREE_TTL_MS) return hit;
  const info = await github.getRepo(owner, repo);
  if (info.private) throw new Error('private'); // never cache or answer from private trees without the user's own token flow
  const sha = await github.getHeadSha(owner, repo, info.default_branch);
  const tree = (await github.getTree(owner, repo, sha)).tree;
  if (treeCache.size > 50) treeCache.delete(treeCache.keys().next().value as string);
  const entry = { at: Date.now(), sha, tree };
  treeCache.set(key, entry);
  return entry;
}

/** The files most likely to answer `question`, with their text. Null when nothing matches. */
export async function findRepoFiles(github: GitHubClient, owner: string, repo: string, question: string, opts: FindOptions): Promise<RepoFiles | null> {
  const terms = questionTerms(question);
  if (terms.length === 0) return null;
  const { sha, tree } = await repoTree(github, owner, repo);
  const hits = opts.canSearchCode ? await github.searchCode(owner, repo, terms.slice(0, 4).join(' ')).catch(() => []) : [];
  const paths = rankPaths(tree, terms, hits, opts.maxFiles ?? 4);
  if (paths.length === 0) return null;
  const max = opts.maxCharsPerFile ?? 3500;
  const texts = await Promise.all(paths.map((p) => github.getText(owner, repo, sha, p, 60_000).catch(() => null)));
  const files = paths.flatMap((path, i) => {
    const t = texts[i];
    return t ? [{ path, url: `https://github.com/${owner}/${repo}/blob/${sha}/${path.split('/').map(encodeURIComponent).join('/')}`, text: focusText(t, terms, max) }] : [];
  });
  return files.length ? { repo: `${owner}/${repo}`, sha, files } : null;
}

/** For tests. */
export const clearRepoTreeCache = (): void => treeCache.clear();
