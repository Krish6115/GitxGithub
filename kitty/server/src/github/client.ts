// Minimal GitHub REST client: repo tours (3 API calls, file bodies from raw.githubusercontent.com), issues and pull requests.
import { z } from 'zod';
import { KittyError } from '../llm/errors.js';

export const RepoSchema = z.object({
  full_name: z.string(),
  description: z.string().nullable(),
  default_branch: z.string(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  private: z.boolean(),
  html_url: z.string(),
});
export type RepoInfo = z.infer<typeof RepoSchema>;

const CommitSchema = z.object({ sha: z.string().regex(/^[0-9a-f]{40}$/) });

export const TreeEntrySchema = z.object({
  path: z.string(),
  type: z.enum(['blob', 'tree', 'commit']),
  size: z.number().optional(),
});
export type TreeEntry = z.infer<typeof TreeEntrySchema>;
const TreeSchema = z.object({ sha: z.string(), truncated: z.boolean(), tree: z.array(TreeEntrySchema) });
export type RepoTree = z.infer<typeof TreeSchema>;

const LabelSchema = z.union([z.string(), z.object({ name: z.string() })]).transform((l) => (typeof l === 'string' ? l : l.name));

export const IssueSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().nullable().default(null),
  html_url: z.string(),
  state: z.string(),
  comments: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
  labels: z.array(LabelSchema).default([]),
  assignees: z.array(z.object({ login: z.string() })).default([]),
  /** present when the "issue" is really a pull request */
  pull_request: z.unknown().optional(),
});
export type Issue = z.infer<typeof IssueSchema>;

const RefSchema = z.object({ ref: z.string(), repo: z.object({ full_name: z.string() }).nullable() });
export const PullSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().nullable().default(null),
  html_url: z.string(),
  state: z.string(),
  merged: z.boolean().default(false),
  draft: z.boolean().default(false),
  mergeable_state: z.string().default('unknown'),
  additions: z.number().default(0),
  deletions: z.number().default(0),
  changed_files: z.number().default(0),
  commits: z.number().default(0),
  maintainer_can_modify: z.boolean().default(false),
  user: z.object({ login: z.string() }),
  head: RefSchema,
  base: RefSchema,
});
export type Pull = z.infer<typeof PullSchema>;

export const PullFileSchema = z.object({ filename: z.string(), status: z.string(), additions: z.number().default(0), deletions: z.number().default(0) });
export type PullFile = z.infer<typeof PullFileSchema>;
export const PullCommitSchema = z.object({ sha: z.string(), commit: z.object({ message: z.string() }), parents: z.array(z.object({ sha: z.string() })).default([]) });
export type PullCommit = z.infer<typeof PullCommitSchema>;

export interface GitHubClientOptions {
  token?: string | undefined;
  fetchImpl?: typeof fetch;
  apiBase?: string;
  rawBase?: string;
}

export interface GitHubClient {
  getRepo(owner: string, repo: string): Promise<RepoInfo>;
  getHeadSha(owner: string, repo: string, branch: string): Promise<string>;
  getTree(owner: string, repo: string, sha: string): Promise<RepoTree>;
  /** File text at a commit, cut to `maxChars`. Returns null for missing or binary files. */
  getText(owner: string, repo: string, sha: string, path: string, maxChars: number): Promise<string | null>;
  getIssue(owner: string, repo: string, n: number): Promise<Issue>;
  /** Open, unassigned issues (and PRs, which callers filter out), most recently updated first. */
  listOpenIssues(owner: string, repo: string): Promise<Issue[]>;
  getPull(owner: string, repo: string, n: number): Promise<Pull>;
  getPullFiles(owner: string, repo: string, n: number): Promise<PullFile[]>;
  getPullCommits(owner: string, repo: string, n: number): Promise<PullCommit[]>;
}

const NAME = /^[A-Za-z0-9_.-]{1,100}$/;
export const isValidRepoName = (owner: string, repo: string): boolean => NAME.test(owner) && NAME.test(repo);

export function createGitHubClient(opts: GitHubClientOptions = {}): GitHubClient {
  const doFetch = opts.fetchImpl ?? fetch;
  const api = opts.apiBase ?? 'https://api.github.com';
  const raw = opts.rawBase ?? 'https://raw.githubusercontent.com';
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'kitty-gitxgithub',
    ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
  };

  async function getJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const res = await doFetch(`${api}${path}`, { headers });
    if (res.status === 404) throw new KittyError('github_not_found', 'GitHub could not find that repository, issue or pull request (or it is private).');
    if ((res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0') {
      throw new KittyError('github_rate_limited', 'GitHub API rate limit reached. Add a GitHub token in Kitty settings or try later.');
    }
    if (!res.ok) throw new KittyError('upstream_error', `GitHub returned HTTP ${res.status}.`);
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) throw new KittyError('upstream_error', `Unexpected GitHub response for ${path}.`);
    return parsed.data;
  }

  const enc = (p: string): string => p.split('/').map(encodeURIComponent).join('/');

  return {
    getRepo: (o, r) => getJson(`/repos/${o}/${r}`, RepoSchema),
    getHeadSha: async (o, r, branch) => (await getJson(`/repos/${o}/${r}/commits/${encodeURIComponent(branch)}`, CommitSchema)).sha,
    getTree: (o, r, sha) => getJson(`/repos/${o}/${r}/git/trees/${sha}?recursive=1`, TreeSchema),
    getIssue: (o, r, n) => getJson(`/repos/${o}/${r}/issues/${n}`, IssueSchema),
    listOpenIssues: (o, r) => getJson(`/repos/${o}/${r}/issues?state=open&assignee=none&sort=updated&per_page=100`, z.array(IssueSchema)),
    getPull: (o, r, n) => getJson(`/repos/${o}/${r}/pulls/${n}`, PullSchema),
    getPullFiles: (o, r, n) => getJson(`/repos/${o}/${r}/pulls/${n}/files?per_page=100`, z.array(PullFileSchema)),
    getPullCommits: (o, r, n) => getJson(`/repos/${o}/${r}/pulls/${n}/commits?per_page=100`, z.array(PullCommitSchema)),
    async getText(o, r, sha, path, maxChars) {
      let res = await doFetch(`${raw}/${o}/${r}/${sha}/${enc(path)}`, {
        headers: { 'User-Agent': 'kitty-gitxgithub', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
      });
      if (res.status === 429 || res.status === 403) {
        // raw.githubusercontent.com throttles busy IPs; fall back to the contents API (uses the token's API quota)
        res = await doFetch(`${api}/repos/${o}/${r}/contents/${enc(path)}?ref=${sha}`, {
          headers: { ...headers, Accept: 'application/vnd.github.raw' },
        });
      }
      if (!res.ok) return null;
      const text = await res.text();
      if (text.includes('\u0000')) return null; // binary
      return text.length > maxChars ? `${text.slice(0, maxChars)}\n[…truncated]` : text;
    },
  };
}
