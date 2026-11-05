// First-contribution guide: which steps the page you are on shows you have done (so you don't tick them by hand).

export interface FirstPrIssue {
  repo: string;
  number: number;
}

/** Steps the GitHub page at `href` proves are done. */
export function stepsDoneBy(href: string, issue: FirstPrIssue | undefined, login: string | undefined): string[] {
  if (!issue) return [];
  let path: string;
  try {
    const u = new URL(href);
    if (u.hostname !== 'github.com') return [];
    path = u.pathname.replace(/\/+$/, '').toLowerCase();
  } catch {
    return [];
  }
  const repo = issue.repo.toLowerCase();
  const name = repo.split('/')[1] ?? '';
  const done: string[] = [];
  if (path === `/${repo}/issues/${issue.number}`) done.push('pick');
  // your fork: github.com/<you>/<repo>
  if (login && path.startsWith(`/${login.toLowerCase()}/${name}`)) done.push('pick', 'fork');
  // a compare page or a pull request in the project means the branch was pushed
  if (path.startsWith(`/${repo}/compare/`) || (login && path.startsWith(`/${login.toLowerCase()}/${name}/compare/`))) done.push('pick', 'fork', 'branch', 'change', 'commit');
  if (new RegExp(`^/${repo.replace(/[.]/g, '\\.')}/pull/\\d+`).test(path)) done.push('pick', 'fork', 'branch', 'change', 'commit', 'push');
  return [...new Set(done)];
}
