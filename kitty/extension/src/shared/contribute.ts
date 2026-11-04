// Exact git commands for fixing an issue: fork, clone, upstream remote, a branch named after the issue, commit, push,
// and the link that opens the pull request form. Built from facts (names, branch), never by the model.

export interface ContributionInput {
  owner: string;
  repo: string;
  defaultBranch: string;
  issue: { number: number; title: string };
  /** The signed-in GitHub user, when known. */
  login?: string | undefined;
}

export interface ContributionPlan {
  branch: string;
  commands: string;
  /** Opens GitHub's "new pull request" form for the branch. */
  prUrl: string;
  /** The user owns the repo: no fork needed. */
  ownRepo: boolean;
}

/** "Crash when config is empty!" -> "crash-when-config-is-empty" (max 40 chars, no trailing dash). */
export function slug(title: string, max = 40): string {
  const s = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.slice(0, max).replace(/-+$/, '') || 'change';
}

/** Safe inside double quotes in bash and PowerShell: drop quotes, backticks, $ and backslashes. */
const quoteSafe = (s: string): string => {
  const clean = s.replace(/["`$\\]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 72) return clean;
  const cut = clean.slice(0, 72);
  return cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : 72).trim();
};

export function contributionPlan(p: ContributionInput): ContributionPlan {
  const n = p.issue.number;
  const branch = `fix/${n}-${slug(p.issue.title)}`;
  const ownRepo = Boolean(p.login && p.login.toLowerCase() === p.owner.toLowerCase());
  const user = p.login ?? 'YOUR-USERNAME';
  const message = quoteSafe(p.issue.title) || `Fix #${n}`;
  const lines = ownRepo
    ? [
        `git clone https://github.com/${p.owner}/${p.repo}.git`,
        `cd ${p.repo}`,
        `git switch -c ${branch} origin/${p.defaultBranch}`,
      ]
    : [
        '# 1. Fork the repo on GitHub (Fork button, top right), then:',
        `git clone https://github.com/${user}/${p.repo}.git`,
        `cd ${p.repo}`,
        `git remote add upstream https://github.com/${p.owner}/${p.repo}.git`,
        'git fetch upstream',
        `git switch -c ${branch} upstream/${p.defaultBranch}`,
      ];
  lines.push(
    ownRepo ? '# Make the fix, run the tests, then:' : '# 2. Make the fix, run the tests, then:',
    'git add -A',
    `git commit -m "${message}" -m "Fixes #${n}"`,
    `git push -u origin ${branch}`,
  );
  const head = ownRepo ? branch : `${user}:${branch}`;
  return {
    branch,
    commands: lines.join('\n'),
    prUrl: `https://github.com/${p.owner}/${p.repo}/compare/${encodeURIComponent(p.defaultBranch)}...${head}?expand=1`,
    ownRepo,
  };
}

/** Mirror of the server's POST /issues reply. */
export interface BeginnerIssue {
  /** owner/name */
  repo: string;
  number: number;
  title: string;
  url: string;
  labels: string[];
  comments: number;
  updatedAt: string;
  reasons: string[];
}
export interface BeginnerIssues {
  issues: BeginnerIssue[];
  labeled: boolean;
}

/** Mirror of the server's POST /preflight reply. */
export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';
export interface PreflightCheck {
  id: string;
  status: CheckStatus;
  title: string;
  detail: string;
  commands?: string[];
}
export interface PreflightResult {
  number: number;
  title: string;
  url: string;
  checks: PreflightCheck[];
  counts: Record<CheckStatus, number>;
  conflict?: ConflictRescue;
}
export interface RescueStep {
  title: string;
  commands: string[];
  note?: string;
}
/** Mirror of the server's merge-conflict rescue. */
export interface ConflictRescue {
  likelyFiles: string[];
  steps: RescueStep[];
  undo: RescueStep;
}
