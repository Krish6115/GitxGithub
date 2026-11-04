// PR pre-flight check: what maintainers commonly bounce a pull request for, checked with plain rules (no model).
import type { GitHubClient, Pull, PullCommit, PullFile } from './client.js';
import { likelyConflicts, rescueSteps, type ConflictRescue } from './conflicts.js';
import { diffChecks } from './diff-checks.js';

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface PreflightCheck {
  id: string;
  status: CheckStatus;
  title: string;
  detail: string;
  /** Commands that fix it, one per line (comments start with #). */
  commands?: string[];
}

export interface PreflightResult {
  number: number;
  title: string;
  url: string;
  checks: PreflightCheck[];
  counts: Record<CheckStatus, number>;
  /** Step-by-step help when the PR has merge conflicts. */
  conflict?: ConflictRescue;
}

export interface PreflightInput {
  owner: string;
  repo: string;
  pull: Pull;
  files: PullFile[];
  commits: PullCommit[];
  contributing: string | null;
  template: string | null;
}

const TEST_FILE = /(^|\/)(tests?|__tests__|spec|specs)\/|[._-](test|spec)\.[a-z]+$|_test\.(go|py)$|^test_.*\.py$|(^|\/)test_[^/]+\.py$/i;
const NON_CODE = /\.(md|mdx|rst|txt|ya?ml|json|toml|ini|cfg|lock|svg|png|jpe?g|gif|css)$|(^|\/)(docs?|\.github)\//i;
const LINKED_ISSUE = /\b(close[sd]?|fix(e[sd])?|resolve[sd]?|refs?|related to|part of)\b[:\s]+(#\d+|https:\/\/github\.com\/\S+\/issues\/\d+)|(^|\s)#\d+\b|https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+/i;
const CONVENTIONAL = /^(feat|fix|docs|style|refactor|perf|test|tests|build|ci|chore|revert)(\([^)]+\))?!?: \S/;
const WIP = /^(wip|fixup!|squash!|amend!)|\bwip\b/i;
const GENERIC_TITLE = /^(update|create|add|delete|patch|change)\s+\S+\.\w+$|^(fix|update|changes?|patch|wip|test)$/i;

const mentions = (doc: string | null, re: RegExp): boolean => Boolean(doc && re.test(doc));
const subject = (c: PullCommit): string => c.commit.message.split('\n')[0] ?? '';

/** Remote/base to rebase on: contributors from a fork usually call the original repo "upstream". */
function rebaseCommands(pull: Pull, isFork: boolean, conflicts: boolean): string[] {
  const remote = isFork ? 'upstream' : 'origin';
  return [
    `git fetch ${remote}`,
    `git rebase ${remote}/${pull.base.ref}`,
    ...(conflicts ? ['# fix each conflicted file, then:', 'git add <file>', 'git rebase --continue'] : []),
    'git push --force-with-lease',
  ];
}

/** Lines of the template that are section headings, e.g. "## Description". */
const templateHeadings = (t: string): string[] => t.split('\n').map((l) => l.trim()).filter((l) => /^#{1,4}\s+\S/.test(l));

export function preflightChecks(input: PreflightInput): PreflightResult {
  const { pull, files, commits, contributing, template } = input;
  const base = `${input.owner}/${input.repo}`.toLowerCase();
  const isFork = Boolean(pull.head.repo && pull.head.repo.full_name.toLowerCase() !== base);
  const remote = isFork ? 'upstream' : 'origin';
  const body = (pull.body ?? '').trim();
  const checks: PreflightCheck[] = [];
  const add = (c: PreflightCheck): void => void checks.push(c);

  if (pull.merged || pull.state !== 'open') {
    add({ id: 'state', status: 'info', title: pull.merged ? 'Already merged' : 'Closed', detail: 'This pull request is no longer open; the checks below are for reference.' });
  } else if (pull.draft) {
    add({ id: 'state', status: 'info', title: 'Still a draft', detail: 'Maintainers usually wait for "Ready for review". Click it on the PR page when you are done.' });
  }

  // 1. Merge state (GitHub computes it lazily, so "unknown" is skipped)
  const ms = pull.mergeable_state;
  if (ms === 'dirty') {
    add({ id: 'conflicts', status: 'fail', title: 'Merge conflicts', detail: `Your branch conflicts with ${pull.base.ref}. Rebase on the latest ${pull.base.ref} and resolve the conflicts (step-by-step rescue below).`, commands: rebaseCommands(pull, isFork, true) });
  } else if (ms === 'behind') {
    add({ id: 'up-to-date', status: 'warn', title: `Behind ${pull.base.ref}`, detail: `New commits landed on ${pull.base.ref}. Rebase so CI tests your change against the latest code (or use "Update branch" on the PR page).`, commands: rebaseCommands(pull, isFork, false) });
  } else if (ms === 'clean' || ms === 'unstable' || ms === 'blocked' || ms === 'has_hooks') {
    add({ id: 'up-to-date', status: 'pass', title: 'No merge conflicts', detail: `The branch merges cleanly into ${pull.base.ref}.` });
    if (ms === 'unstable') add({ id: 'ci', status: 'warn', title: 'Some checks are failing', detail: 'Open the "Checks" tab, fix what fails and push again.' });
  }

  // 2. Description and template
  if (body.length < 30) {
    add({ id: 'description', status: 'fail', title: 'Description is (almost) empty', detail: 'Say what changed, why, and how you tested it. Reviewers skip PRs they have to reverse-engineer.' });
  } else if (template) {
    const headings = templateHeadings(template);
    const missing = headings.filter((h) => !body.includes(h.replace(/^#+\s+/, '')));
    const unchecked = (body.match(/^\s*[-*] \[ \]/gm) ?? []).length;
    const untouched = template.trim().length > 0 && body.replace(/\s+/g, ' ').includes(template.trim().replace(/\s+/g, ' ').slice(0, 200)) && body.length < template.length + 40;
    if (untouched) add({ id: 'template', status: 'warn', title: 'PR template not filled in', detail: 'The description is still the template text. Fill in each section.' });
    else if (missing.length > 0) add({ id: 'template', status: 'warn', title: 'Template sections missing', detail: `The repo's PR template asks for: ${missing.slice(0, 4).map((h) => h.replace(/^#+\s+/, '')).join(', ')}.` });
    else if (unchecked > 0) add({ id: 'template', status: 'warn', title: `${unchecked} checklist item${unchecked > 1 ? 's' : ''} unticked`, detail: 'Tick the template checklist items you have done (or say why one does not apply).' });
    else add({ id: 'description', status: 'pass', title: 'Description follows the template', detail: 'All template sections are there.' });
  } else {
    add({ id: 'description', status: 'pass', title: 'Has a description', detail: 'The PR explains itself.' });
  }

  // 3. Linked issue
  if (LINKED_ISSUE.test(`${pull.title}\n${body}`)) add({ id: 'issue', status: 'pass', title: 'Links an issue', detail: 'Reviewers can see the context (and "Fixes #N" closes it on merge).' });
  else add({ id: 'issue', status: 'warn', title: 'No linked issue', detail: 'If this fixes an issue, add "Fixes #123" to the description so it is linked and closed on merge.' });

  // 4. Tests
  const code = files.filter((f) => !NON_CODE.test(f.filename) && !TEST_FILE.test(f.filename));
  const tests = files.filter((f) => TEST_FILE.test(f.filename));
  if (code.length > 0 && tests.length === 0) add({ id: 'tests', status: 'warn', title: 'No test changes', detail: `${code.length} code file${code.length > 1 ? 's' : ''} changed but no tests. Most maintainers ask for a test that covers the change.` });
  else if (tests.length > 0) add({ id: 'tests', status: 'pass', title: 'Includes tests', detail: `${tests.length} test file${tests.length > 1 ? 's' : ''} changed.` });

  // 4b. What the diff itself adds (secrets, conflict markers, debug output)
  checks.push(...diffChecks(files, pull.base.ref, remote));

  // 5. Commit hygiene
  const merges = commits.filter((c) => c.parents.length > 1);
  if (merges.length > 0) {
    add({ id: 'merge-commits', status: 'warn', title: `${merges.length} merge commit${merges.length > 1 ? 's' : ''} in the PR`, detail: `Many projects prefer a linear history: rebase on ${pull.base.ref} instead of merging it into your branch.`, commands: rebaseCommands(pull, isFork, false) });
  }
  const wip = commits.filter((c) => WIP.test(subject(c)));
  if (wip.length > 0) {
    add({ id: 'wip-commits', status: 'warn', title: 'WIP / fixup commits', detail: `Squash these before review: ${wip.slice(0, 3).map((c) => `"${subject(c).slice(0, 50)}"`).join(', ')}.`, commands: [`git fetch ${remote}`, `git rebase -i --autosquash ${remote}/${pull.base.ref}`, '# mark the extra commits as "fixup", save and close', 'git push --force-with-lease'] });
  }
  if (mentions(contributing, /conventional[\s-]*commits?/i)) {
    const bad = commits.filter((c) => c.parents.length <= 1 && !CONVENTIONAL.test(subject(c)));
    if (bad.length > 0) add({ id: 'commit-format', status: 'warn', title: 'Commit messages: Conventional Commits', detail: `CONTRIBUTING asks for Conventional Commits ("fix: …", "feat: …"). ${bad.length} commit${bad.length > 1 ? 's do' : ' does'} not match, e.g. "${subject(bad[0] as PullCommit).slice(0, 60)}".`, commands: [`git rebase -i ${remote}/${pull.base.ref}`, '# change "pick" to "reword" on those commits and fix the message', 'git push --force-with-lease'] });
    else add({ id: 'commit-format', status: 'pass', title: 'Commit messages follow Conventional Commits', detail: 'As CONTRIBUTING asks.' });
    if (!CONVENTIONAL.test(pull.title)) add({ id: 'title', status: 'warn', title: 'PR title format', detail: 'Use the same style for the PR title, e.g. "fix: handle empty config".' });
  }
  if (!checks.some((c) => c.id === 'title') && GENERIC_TITLE.test(pull.title.trim())) {
    add({ id: 'title', status: 'warn', title: 'Generic PR title', detail: `"${pull.title}" doesn't say what changed. Describe the change, e.g. "Fix crash when the config file is empty".` });
  }
  if (mentions(contributing, /signed-off-by|developer certificate of origin|\bDCO\b|--signoff|git commit -s\b/i)) {
    const unsigned = commits.filter((c) => !/^Signed-off-by: .+<.+>/m.test(c.commit.message));
    if (unsigned.length > 0) add({ id: 'signoff', status: 'fail', title: 'Missing sign-off (DCO)', detail: `CONTRIBUTING requires "Signed-off-by" on every commit; ${unsigned.length} commit${unsigned.length > 1 ? 's are' : ' is'} missing it.`, commands: [`git fetch ${remote}`, `git rebase --signoff ${remote}/${pull.base.ref}`, 'git push --force-with-lease'] });
    else add({ id: 'signoff', status: 'pass', title: 'Every commit is signed off', detail: 'DCO sign-off is present.' });
  }

  // 6. Size and maintainer edits
  const lines = pull.additions + pull.deletions;
  if (lines > 600 || pull.changed_files > 25) add({ id: 'size', status: 'info', title: 'Large PR', detail: `${lines} lines in ${pull.changed_files} files. Smaller PRs get reviewed faster; consider splitting unrelated changes.` });
  if (isFork && !pull.maintainer_can_modify && pull.state === 'open') add({ id: 'edits', status: 'info', title: 'Maintainer edits are off', detail: 'Tick "Allow edits by maintainers" on the PR so they can push small fixes for you.' });

  const counts: Record<CheckStatus, number> = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const c of checks) counts[c.status]++;
  const order: Record<CheckStatus, number> = { fail: 0, warn: 1, info: 2, pass: 3 };
  checks.sort((a, b) => order[a.status] - order[b.status]);
  return { number: pull.number, title: pull.title, url: pull.html_url, checks, counts };
}

const CONTRIBUTING_PATHS = ['CONTRIBUTING.md', '.github/CONTRIBUTING.md', 'docs/CONTRIBUTING.md'];
const TEMPLATE_PATHS = ['.github/pull_request_template.md', '.github/PULL_REQUEST_TEMPLATE.md', 'PULL_REQUEST_TEMPLATE.md', 'pull_request_template.md', 'docs/pull_request_template.md'];

async function firstText(github: GitHubClient, owner: string, repo: string, ref: string, paths: string[]): Promise<string | null> {
  for (const p of paths) {
    const t = await github.getText(owner, repo, ref, p, 12_000);
    if (t) return t;
  }
  return null;
}

/** Fetch the PR (3 API calls; docs come from raw.githubusercontent.com) and run the checks. */
export async function runPreflight(github: GitHubClient, owner: string, repo: string, n: number): Promise<PreflightResult> {
  const [pull, files, commits] = await Promise.all([github.getPull(owner, repo, n), github.getPullFiles(owner, repo, n), github.getPullCommits(owner, repo, n)]);
  const [contributing, template] = await Promise.all([
    firstText(github, owner, repo, pull.base.ref, CONTRIBUTING_PATHS),
    firstText(github, owner, repo, pull.base.ref, TEMPLATE_PATHS),
  ]);
  const result = preflightChecks({ owner, repo, pull, files, commits, contributing, template });
  if (pull.mergeable_state === 'dirty' && pull.state === 'open') {
    const isFork = Boolean(pull.head.repo && pull.head.repo.full_name.toLowerCase() !== `${owner}/${repo}`.toLowerCase());
    result.conflict = { likelyFiles: await likelyConflicts(github, owner, repo, pull), ...rescueSteps(pull, isFork, `${owner}/${repo}`) };
  }
  return result;
}
