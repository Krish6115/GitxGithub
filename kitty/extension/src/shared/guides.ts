// "Show me how" walkthroughs: the cat steps through GitHub's own pages and points at the real buttons and tabs,
// like a repo tour but for using GitHub itself. Each step names the page it lives on and how to find its element.

export type GuidePage = 'repo' | 'issues' | 'pulls' | 'compare' | 'actions' | 'pr' | 'pr-files';

export interface GuideStep {
  page: GuidePage;
  /** CSS selectors tried first, then visible text of links/buttons/tabs (counters ignored). */
  selectors?: string[];
  text?: RegExp;
  title: string;
  body: string;
}

export interface Guide {
  id: string;
  title: string;
  /** Only offered on pull request pages (needs a PR number). */
  needsPr?: boolean;
  steps: GuideStep[];
}

const TAB = (name: string, id: string): Pick<GuideStep, 'selectors' | 'text'> => ({ selectors: [`#${id}`, `[data-tab-item="${id}"]`, `a[data-selected-links~="${name}"]`], text: new RegExp(`^${name}$`, 'i') });

export const GUIDES: Guide[] = [
  {
    id: 'explore-repo',
    title: 'Find your way around a repository',
    steps: [
      { page: 'repo', selectors: ['#readme', 'article.markdown-body'], title: 'The README', body: 'Start here: what the project does, how to install it and how to use it.' },
      { page: 'repo', selectors: ['#branch-picker-repos-header-ref-selector', 'button[aria-label*="branch" i]', '[data-hotkey="w"]'], title: 'The branch picker', body: 'Shows which branch you are looking at (usually main). Switch branches here to see other work in progress.' },
      { page: 'repo', selectors: ['a[href*="/commits/"]'], title: 'The history', body: 'The commit count opens the full history: every change, who made it and why. Same as git log.' },
      { page: 'repo', text: /^code$/i, selectors: ['button[data-variant="primary"]'], title: 'The Code button', body: 'Copy the URL here to clone the repo: git clone <url>. "Download ZIP" gives the files without Git history.' },
      { page: 'repo', ...TAB('Issues', 'issues-tab'), title: 'Issues', body: 'Bug reports and feature requests. Good first issues for newcomers live here.' },
      { page: 'repo', ...TAB('Pull requests', 'pull-requests-tab'), title: 'Pull requests', body: 'Proposed changes waiting for review. Reading a few shows you how this project likes contributions.' },
      { page: 'repo', ...TAB('Actions', 'actions-tab'), title: 'Actions', body: 'The CI runs: tests and checks that run on every push and pull request.' },
    ],
  },
  {
    id: 'fork-clone',
    title: 'Fork a repository and clone it',
    steps: [
      { page: 'repo', selectors: ['#fork-button', 'a[href$="/fork"]'], text: /^fork$/i, title: 'Fork', body: 'Makes your own copy on GitHub, so you can push branches. (You need to be signed in.)' },
      { page: 'repo', text: /^code$/i, selectors: ['button[data-variant="primary"]'], title: 'Clone your fork', body: 'On YOUR fork, click Code and copy the URL, then run: git clone <url> and cd into the folder.' },
      { page: 'repo', ...TAB('Code', 'code-tab'), title: 'Add the original as upstream', body: 'Back on your machine: git remote add upstream https://github.com/OWNER/REPO.git so you can fetch the project\'s new commits.' },
    ],
  },
  {
    id: 'open-pr',
    title: 'Open a pull request',
    steps: [
      { page: 'repo', ...TAB('Pull requests', 'pull-requests-tab'), title: 'Pull requests tab', body: 'After you push your branch (git push -u origin my-branch), pull requests start here.' },
      { page: 'pulls', selectors: ['a[href$="/compare"]', 'a[href*="/compare"]'], text: /^new pull request$/i, title: 'New pull request', body: 'Starts a comparison between two branches.' },
      { page: 'compare', text: /^base:/i, selectors: ['[data-testid="base-ref-selector"]', 'details.select-menu summary'], title: 'Base and compare', body: 'base is where your change should go (usually main of the original repo); compare is your branch. For a fork, pick your fork as the head repository.' },
      { page: 'compare', text: /^create pull request$/i, title: 'Create pull request', body: 'Appears once the branches differ. Give it a clear title, fill in the template, and link the issue with "Fixes #123".' },
    ],
  },
  {
    id: 'review-pr',
    title: 'Read and review a pull request',
    needsPr: true,
    steps: [
      { page: 'pr', selectors: ['.js-discussion', '[data-testid="issue-viewer-issue-container"]', '#discussion_bucket'], title: 'Conversation', body: 'The description, comments and review decisions. Read why the change exists before the code.' },
      { page: 'pr', selectors: ['a[href$="/checks"]'], text: /^checks/i, title: 'Checks', body: 'CI results for this PR. A red X means something failed: Kitty can explain it on the run page.' },
      { page: 'pr', selectors: ['a[href$="/files"]', 'a[href*="/files"]'], text: /^files changed/i, title: 'Files changed', body: 'The diff: red lines removed, green lines added.' },
      { page: 'pr-files', selectors: ['[data-testid="diff-file-header"]', '.file-header', 'copilot-diff-entry', '.file'], title: 'One file\'s changes', body: 'Click a line number to comment on that line. Select text and Ask Kitty to explain a hunk.' },
      { page: 'pr-files', text: /^(review changes|submit review)$/i, selectors: ['#review-changes-modal', '.js-reviews-toggle'], title: 'Review changes', body: 'Finish with Comment, Approve or Request changes. Be specific and kind.' },
    ],
  },
  {
    id: 'ci-checks',
    title: 'Find CI results',
    steps: [
      { page: 'repo', ...TAB('Actions', 'actions-tab'), title: 'Actions', body: 'Every workflow run of this repository.' },
      { page: 'actions', selectors: ['a[href*="/actions/runs/"]'], title: 'A workflow run', body: 'Open a run to see its jobs. On a failed run, click the cat and choose "Why did this fail?".' },
    ],
  },
  {
    id: 'sync-fork',
    title: 'Sync your fork',
    steps: [
      { page: 'repo', text: /^sync fork$/i, title: 'Sync fork', body: 'On your fork, this brings your branch up to date with the original repository. (It only appears on forks.) Then run git pull locally.' },
    ],
  },
];

export const guideById = (id: string): Guide | undefined => GUIDES.find((g) => g.id === id);

export interface GuideState {
  id: string;
  repo: string;
  pr?: number;
  index: number;
}
export const GUIDE_KEY = 'kitty:guide';

/** The URL of the page a step lives on. */
export function guidePageUrl(page: GuidePage, repo: string, pr?: number): string {
  const base = `https://github.com/${repo}`;
  switch (page) {
    case 'repo': return base;
    case 'issues': return `${base}/issues`;
    case 'pulls': return `${base}/pulls`;
    case 'compare': return `${base}/compare`;
    case 'actions': return `${base}/actions`;
    case 'pr': return `${base}/pull/${pr ?? 1}`;
    case 'pr-files': return `${base}/pull/${pr ?? 1}/files`;
  }
}

/** Which guide page `href` is (for this repo), or null. */
export function guidePageOf(href: string, repo: string): GuidePage | null {
  let path: string;
  try {
    path = new URL(href).pathname.replace(/\/+$/, '').toLowerCase();
  } catch {
    return null;
  }
  const base = `/${repo.toLowerCase()}`;
  if (path === base || path.startsWith(`${base}/tree/`)) return 'repo';
  const rest = path.startsWith(`${base}/`) ? path.slice(base.length + 1) : null;
  if (rest === null) return null;
  if (rest === 'issues') return 'issues';
  if (rest === 'pulls') return 'pulls';
  if (rest === 'compare' || rest.startsWith('compare/')) return 'compare';
  if (rest === 'actions') return 'actions';
  if (/^pull\/\d+\/(files|changes)$/.test(rest)) return 'pr-files';
  if (/^pull\/\d+$/.test(rest)) return 'pr';
  return null;
}

/** Guides that make sense on this page. */
export const guidesFor = (isPr: boolean): Guide[] => GUIDES.filter((g) => !g.needsPr || isPr);
