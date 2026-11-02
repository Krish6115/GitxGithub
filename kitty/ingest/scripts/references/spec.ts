// Which upstream sections go into which reference file.
// p = Pro Git section, g = GitHub Docs page, d = git man page.
import type { SectionFilter } from './sections.js';

export type SourceKind = 'progit' | 'ghdocs' | 'git';
export type Part = SectionFilter & {
  kind: SourceKind;
  /** Path inside the upstream repo, relative to book/, content/ or Documentation/. */
  file: string;
  /** Pro Git section number, e.g. "3.6". */
  num?: string;
  /** git docs only: 1-based inclusive raw line range instead of whole sections. */
  lines?: [number, number];
  /** git docs only: heading to use for a line-range excerpt. */
  heading?: string;
};
export interface OutputFile {
  out: string;
  title: string;
  parts: Part[];
}
type Opts = Omit<Part, 'kind' | 'file' | 'num'>;

const p = (file: string, num: string, opts: Opts = {}): Part => ({ kind: 'progit', file, num, ...opts });
const g = (file: string, opts: Opts = {}): Part => ({ kind: 'ghdocs', file, ...opts });
const d = (file: string, opts: Opts = {}): Part => ({ kind: 'git', file, ...opts });
const PR = 'pull-requests/how-tos';
const REPO = 'repositories';

export const SPEC: OutputFile[] = [
  // ---------- Git/references (concepts & reference) ----------
  { out: 'Git/references/interactive-staging.md', title: 'Interactive and partial staging',
    parts: [p('07-git-tools/sections/interactive-staging.asc', '7.2')] },
  { out: 'Git/references/branches-and-merging.md', title: 'Branches and merging',
    parts: [
      p('03-git-branching/sections/nutshell.asc', '3.1'),
      p('03-git-branching/sections/basic-branching-and-merging.asc', '3.2'),
      d('git-merge.adoc', { keep: ['Fast-forward merge', 'True merge'] }),
    ] },
  { out: 'Git/references/rebasing.md', title: 'Rebasing and rewriting history',
    parts: [
      p('03-git-branching/sections/rebasing.asc', '3.6'),
      p('07-git-tools/sections/rewriting-history.asc', '7.6', { drop: ['The Nuclear Option: filter-branch'] }),
    ] },
  { out: 'Git/references/advanced-merging-and-conflicts.md', title: 'Advanced merging and conflict resolution',
    parts: [
      p('07-git-tools/sections/advanced-merging.asc', '7.8', { drop: ['Manual File Re-merging', 'Merge Log', 'Combined Diff Format'] }),
      p('07-git-tools/sections/rerere.asc', '7.9'),
      d('git-merge.adoc', { keep: ['How conflicts are presented', 'How to resolve conflicts'] }),
    ] },
  { out: 'Git/references/reset-demystified.md', title: 'Reset demystified: HEAD, index and working tree',
    parts: [p('07-git-tools/sections/reset.asc', '7.7')] },
  { out: 'Git/references/stashing-and-cleaning.md', title: 'Stashing and cleaning',
    parts: [p('07-git-tools/sections/stashing-cleaning.asc', '7.3')] },
  { out: 'Git/references/remotes-and-tracking-branches.md', title: 'Remotes and remote-tracking branches',
    parts: [
      p('02-git-basics/sections/remotes.asc', '2.5'),
      p('03-git-branching/sections/remote-branches.asc', '3.5'),
    ] },
  { out: 'Git/references/pull-requests-and-code-review.md', title: 'Pull requests and code review on GitHub',
    parts: [
      g('pull-requests/get-started/about-pull-requests.md'),
      g(`${REPO}/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github.md`),
      g(`${PR}/review-pull-requests/reviewing-proposed-changes-in-a-pull-request.md`, { drop: ['Using Copilot Chat to understand the rationale', 'Reviewing dependency changes', 'Further reading'] }),
      g(`${REPO}/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners.md`, { drop: ['CODEOWNERS file size', 'Further reading'] }),
    ] },
  { out: 'Git/references/issues-and-templates.md', title: 'Issues, linking PRs to issues, and templates',
    parts: [
      g('issues/tracking-your-work-with-issues/learning-about-issues/about-issues.md'),
      g('issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue.md'),
      g('communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates.md'),
    ] },
  { out: 'Git/references/authentication-ssh-and-tokens.md', title: 'Authentication: HTTPS, SSH, tokens and credential storage',
    parts: [
      g('authentication/keeping-your-account-and-data-secure/about-authentication-to-github.md', {
        drop: ['Authenticating in your browser', 'Authenticating with GitHub Desktop', 'Authenticating to the API with an app', 'Authorizing for SAML single sign-on'] }),
      g('authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens.md', {
        drop: ['Pre-filling fine-grained personal access token details using URL parameters', 'Further reading'] }),
      g('get-started/git-basics/caching-your-github-credentials-in-git.md'),
      p('07-git-tools/sections/credentials.asc', '7.14', { drop: ['Under the Hood', 'A Custom Credential Cache'] }),
    ] },
  { out: 'Git/references/github-actions-basics.md', title: 'GitHub Actions basics',
    parts: [g('actions/get-started/understand-github-actions.md'), g('actions/get-started/quickstart.md')] },
  { out: 'Git/references/branch-protection-and-rulesets.md', title: 'Branch protection rules and rulesets',
    parts: [
      g(`${REPO}/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches.md`),
      g(`${REPO}/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets.md`),
    ] },
  { out: 'Git/references/commit-signing.md', title: 'Signing commits and tags',
    parts: [
      g('authentication/managing-commit-signature-verification/about-commit-signature-verification.md'),
      g('authentication/managing-commit-signature-verification/signing-commits.md'),
      p('07-git-tools/sections/signing.asc', '7.4'),
    ] },
  { out: 'Git/references/submodules.md', title: 'Submodules',
    parts: [p('07-git-tools/sections/submodules.asc', '7.11', {
      drop: ['Working on a Submodule', 'Publishing Submodule Changes', 'Merging Submodule Changes', 'Useful Aliases', 'Switching from subdirectories to submodules'] })] },
  { out: 'Git/references/worktrees.md', title: 'Worktrees: several branches checked out at once',
    parts: [d('git-worktree.adoc', { keep: ['Synopsis', 'Description', 'Commands', 'Options', 'Examples'] })] },
  { out: 'Git/references/hooks.md', title: 'Git hooks',
    parts: [
      p('08-customizing-git/sections/hooks.asc', '8.3'),
      d('githooks.adoc', { keep: ['Description', 'pre-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'pre-rebase',
        'post-checkout', 'post-merge', 'pre-push', 'pre-receive', 'update', 'post-receive'] }),
    ] },
  { out: 'Git/references/git-lfs.md', title: 'Git Large File Storage (LFS)',
    parts: [
      g(`${REPO}/working-with-files/managing-large-files/about-git-large-file-storage.md`),
      g(`${REPO}/working-with-files/managing-large-files/configuring-git-large-file-storage.md`),
    ] },
  { out: 'Git/references/git-internals.md', title: 'Git internals: objects, refs and HEAD',
    parts: [
      p('10-git-internals/sections/plumbing-porcelain.asc', '10.1'),
      p('10-git-internals/sections/objects.asc', '10.2'),
      p('10-git-internals/sections/refs.asc', '10.3'),
    ] },

  // ---------- Scenario-Based_Guide/references (scenarios) ----------
  { out: 'Scenario-Based_Guide/references/understanding-an-unfamiliar-repo.md', title: 'Understanding an unfamiliar repository on GitHub',
    parts: [
      g(`${REPO}/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes.md`),
      g(`${REPO}/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners.md`, { keep: ['About code owners', 'CODEOWNERS file location'] }),
      g(`${REPO}/working-with-files/using-files/navigating-code-on-github.md`),
      g('search-github/github-code-search/about-github-code-search.md'),
      g('code-security/concepts/supply-chain-security/dependency-graph.md'),
      g(`${REPO}/viewing-activity-and-data-for-your-repository/viewing-a-projects-contributors.md`),
    ] },
  { out: 'Scenario-Based_Guide/references/contributing-to-open-source.md', title: 'Contributing to an open source project',
    parts: [
      g('get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github.md'),
      g('communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors.md'),
      g('get-started/exploring-projects-on-github/contributing-to-a-project.md'),
      p('05-distributed-git/sections/contributing.asc', '5.2', { drop: ['Private Small Team', 'Private Managed Team', 'Public Project over Email', 'Summary'] }),
    ] },
  { out: 'Scenario-Based_Guide/references/updating-a-pr-after-review.md', title: 'Updating a pull request after review',
    parts: [
      g(`${PR}/review-pull-requests/incorporating-feedback-in-your-pull-request.md`),
      g(`${PR}/create-pull-requests/keeping-your-pull-request-in-sync-with-the-base-branch.md`),
      g(`${PR}/commit-changes/committing-changes-to-a-pull-request-branch-created-from-a-fork.md`),
    ] },
  { out: 'Scenario-Based_Guide/references/resolving-conflicts-during-rebase.md', title: 'Resolving conflicts during a rebase',
    parts: [
      g('get-started/using-git/resolving-merge-conflicts-after-a-git-rebase.md'),
      d('git-rebase.adoc', { keep: ['Description'] }),
      d('git-rebase.adoc', { lines: [344, 348], heading: 'Why "ours" and "theirs" are swapped during a rebase' }),
    ] },
  { out: 'Scenario-Based_Guide/references/resolving-conflicts-on-github.md', title: 'Resolving merge conflicts (on GitHub and locally)',
    parts: [
      g(`${PR}/merge-and-close-pull-requests/resolving-a-merge-conflict-on-github.md`),
      g(`${PR}/merge-and-close-pull-requests/resolving-a-merge-conflict-using-the-command-line.md`),
    ] },
  { out: 'Scenario-Based_Guide/references/removing-sensitive-data.md', title: 'Removing sensitive data (leaked secrets) from a repository',
    parts: [g('authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository.md')] },
];
