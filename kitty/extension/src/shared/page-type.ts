// What kind of GitHub page a URL is (context for "Explain this").
import { repoFromUrl } from './github-page';

export type PageType = 'pull_request_diff' | 'pull_request' | 'commit' | 'file' | 'issue' | 'compare' | 'repo' | 'other';

export function pageTypeFromUrl(href: string): PageType {
  const ref = repoFromUrl(href);
  if (!ref) return 'other';
  const rest = new URL(href).pathname.split('/').filter(Boolean).slice(2);
  const [section, , sub] = rest;
  switch (section) {
    case 'pull':
      return sub === 'files' || sub === 'commits' || sub === 'changes' ? 'pull_request_diff' : 'pull_request';
    case 'commit':
      return 'commit';
    case 'blob':
    case 'blame':
      return 'file';
    case 'issues':
      return rest.length > 1 ? 'issue' : 'repo';
    case 'compare':
      return 'compare';
    case undefined:
    case 'tree':
      return 'repo';
    default:
      return 'other';
  }
}
