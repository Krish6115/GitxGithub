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

export const CodeHitSchema = z.object({ path: z.string(), html_url: z.string() });
export type CodeHit = z.infer<typeof CodeHitSchema>;

export const WorkflowRunSchema = z.object({
  id: z.number(),
  name: z.string().nullable().default(null),
  display_title: z.string().default(''),
  status: z.string().nullable().default(null),
  conclusion: z.string().nullable().default(null),
  head_branch: z.string().nullable().default(null),
  event: z.string().default(''),
  html_url: z.string(),
  path: z.string().default(''),
});
export type WorkflowRun = z.infer<typeof WorkflowRunSchema>;
export const WorkflowJobSchema = z.object({
  id: z.number(),
  name: z.string(),
  conclusion: z.string().nullable().default(null),
  html_url: z.string().nullable().default(null),
  steps: z.array(z.object({ name: z.string(), number: z.number(), conclusion: z.string().nullable().default(null) })).default([]),
});
export type WorkflowJob = z.infer<typeof WorkflowJobSchema>;
export const AnnotationSchema = z.object({
  path: z.string().default(''),
  start_line: z.number().nullable().default(null),
  annotation_level: z.string().default('failure'),
  message: z.string().default(''),
  title: z.string().nullable().default(null),
});
export type Annotation = z.infer<typeof AnnotationSchema>;

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
  /** Open, unassigned issues (and PRs, which callers filter out), most recently updated first; optionally with one label. */
  listOpenIssues(owner: string, repo: string, label?: string): Promise<Issue[]>;
  /** GitHub issue search (https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests). */
  searchIssues(q: string): Promise<Issue[]>;
  getPull(owner: string, repo: string, n: number): Promise<Pull>;
  getPullFiles(owner: string, repo: string, n: number): Promise<PullFile[]>;
  getPullCommits(owner: string, repo: string, n: number): Promise<PullCommit[]>;
  /** Code search in one repo (GitHub requires a token for this endpoint). */
  searchCode(owner: string, repo: string, terms: string): Promise<CodeHit[]>;
  getRun(owner: string, repo: string, run: number): Promise<WorkflowRun>;
  getRunJobs(owner: string, repo: string, run: number): Promise<WorkflowJob[]>;
  /** A job's plain-text log (GitHub requires a token), cut to the last `maxChars`; null when unavailable. */
  getJobLog(owner: string, repo: string, job: number, maxChars: number): Promise<string | null>;
  /** Error and warning annotations on a job's check run (readable without a token on public repos). */
  getAnnotations(owner: string, repo: string, job: number): Promise<Annotation[]>;
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
    listOpenIssues: (o, r, label) =>
      getJson(`/repos/${o}/${r}/issues?state=open&assignee=none&sort=updated&per_page=100${label ? `&labels=${encodeURIComponent(label)}` : ''}`, z.array(IssueSchema)),
    searchIssues: async (q) => (await getJson(`/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=50`, z.object({ items: z.array(IssueSchema) }))).items,
    getPull: (o, r, n) => getJson(`/repos/${o}/${r}/pulls/${n}`, PullSchema),
    getPullFiles: (o, r, n) => getJson(`/repos/${o}/${r}/pulls/${n}/files?per_page=100`, z.array(PullFileSchema)),
    getPullCommits: (o, r, n) => getJson(`/repos/${o}/${r}/pulls/${n}/commits?per_page=100`, z.array(PullCommitSchema)),
    searchCode: async (o, r, terms) =>
      (await getJson(`/search/code?q=${encodeURIComponent(`${terms} repo:${o}/${r}`)}&per_page=10`, z.object({ items: z.array(CodeHitSchema) }))).items,
    getRun: (o, r, run) => getJson(`/repos/${o}/${r}/actions/runs/${run}`, WorkflowRunSchema),
    getRunJobs: async (o, r, run) => (await getJson(`/repos/${o}/${r}/actions/runs/${run}/jobs?per_page=100`, z.object({ jobs: z.array(WorkflowJobSchema) }))).jobs,
    getAnnotations: (o, r, job) => getJson(`/repos/${o}/${r}/check-runs/${job}/annotations?per_page=50`, z.array(AnnotationSchema)),
    async getJobLog(o, r, job, maxChars) {
      if (!opts.token) return null; // GitHub only serves logs to signed-in callers
      const res = await doFetch(`${api}/repos/${o}/${r}/actions/jobs/${job}/logs`, { headers });
      if (!res.ok) return null;
      const text = await res.text();
      return text.length > maxChars ? text.slice(-maxChars) : text;
    },
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
