// GitHub URL helpers: which repo is this page, which file is shown, and where a tour step lives.

/** First path segments that are GitHub features, not user or org names. */
const RESERVED = new Set([
  'about', 'account', 'apps', 'blog', 'business', 'codespaces', 'collections', 'contact', 'copilot', 'customer-stories',
  'dashboard', 'enterprise', 'events', 'explore', 'features', 'github-copilot', 'issues', 'login', 'logout', 'marketplace',
  'new', 'notifications', 'orgs', 'organizations', 'pricing', 'pulls', 'readme', 'search', 'security', 'sessions',
  'settings', 'signup', 'site', 'sponsors', 'stars', 'team', 'topics', 'trending', 'users', 'watching',
]);
const NAME = /^[A-Za-z0-9_.-]{1,100}$/;

export interface RepoRef {
  owner: string;
  repo: string;
}

/** owner/repo for any page inside a repository, else null. */
export function repoFromUrl(href: string): RepoRef | null {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  if (u.hostname !== 'github.com') return null;
  const [owner, repo] = u.pathname.split('/').filter(Boolean);
  if (!owner || !repo || RESERVED.has(owner.toLowerCase()) || !NAME.test(owner) || !NAME.test(repo)) return null;
  return { owner, repo: repo.replace(/\.git$/, '') };
}

/**
 * The file or folder path shown by a /blob/<ref>/<path> or /tree/<ref>/<path> URL, for a ref we know
 * (a tour pins files to a commit sha). Returns null for other pages.
 */
export function pathFromUrl(href: string, ref: RepoRef, sha: string): string | null {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  const prefix = `/${ref.owner}/${ref.repo}/`.toLowerCase();
  if (!u.pathname.toLowerCase().startsWith(prefix)) return null;
  const rest = u.pathname.slice(prefix.length).split('/');
  const [kind, at, ...path] = rest;
  if ((kind !== 'blob' && kind !== 'tree') || !at || path.length === 0) return null;
  if (at !== sha && at !== sha.slice(0, 7)) return null;
  return path.map(decodeURIComponent).join('/');
}

/** URL of a tour step's file at the tour's commit. */
export function stepUrl(ref: RepoRef, sha: string, path: string): string {
  return `https://github.com/${ref.owner}/${ref.repo}/blob/${sha}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/** The number in /<owner>/<repo>/issues/<n> or /pull/<n> URLs, else null. */
function numberAt(href: string, section: 'issues' | 'pull'): number | null {
  if (!repoFromUrl(href)) return null;
  const [, , kind, n] = new URL(href).pathname.split('/').filter(Boolean);
  return kind === section && n && /^\d{1,9}$/.test(n) ? Number(n) : null;
}
export const issueNumberFromUrl = (href: string): number | null => numberAt(href, 'issues');
export const pullNumberFromUrl = (href: string): number | null => numberAt(href, 'pull');

/** The signed-in GitHub user, read from github.com's own <meta name="user-login"> (empty when signed out). */
export const signedInLogin = (doc: Document = document): string | undefined =>
  doc.querySelector<HTMLMetaElement>('meta[name="user-login"]')?.content?.trim() || undefined;
