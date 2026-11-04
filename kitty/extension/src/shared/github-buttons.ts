// "Why this button?": what GitHub's own buttons do, in Git terms. Shown when you hover them on github.com.
// Matched by the button's visible text. Static data, no model.
import type { Risk } from './git-sim-commands';

export interface ButtonHint {
  id: string;
  /** Matched against the button's whole visible text (trimmed, case-insensitive). */
  match: RegExp;
  title: string;
  what: string;
  /** The Git commands this click is roughly equivalent to. */
  git: string[];
  risk: Risk;
  note?: string;
}

export const BUTTON_HINTS: ButtonHint[] = [
  { id: 'sync-fork', match: /^sync fork$/i, title: 'Sync fork',
    what: 'Brings your fork\'s branch up to date with the original repository (upstream), on GitHub.',
    git: ['git fetch upstream', 'git switch main', 'git merge upstream/main', 'git push origin main'], risk: 'safe',
    note: 'Your local clone is not updated: run git pull afterwards.' },
  { id: 'discard-commits', match: /^discard commits?$/i, title: 'Discard commits',
    what: 'Makes your fork\'s branch identical to upstream, throwing away the commits only your fork has.',
    git: ['git fetch upstream', 'git reset --hard upstream/main', 'git push --force origin main'], risk: 'can_lose_work',
    note: 'Those commits disappear from your fork. Move them to another branch first if you need them.' },
  { id: 'update-branch-rebase', match: /^update with rebase$/i, title: 'Update with rebase',
    what: 'Replays the pull request\'s commits on top of the latest base branch, on GitHub.',
    git: ['git fetch origin', 'git rebase origin/main', 'git push --force-with-lease'], risk: 'rewrites_history',
    note: 'Your local branch is now out of date: run git pull --rebase (or reset to the remote) before pushing again.' },
  { id: 'update-branch', match: /^update branch$|^update with merge commit$/i, title: 'Update branch',
    what: 'Merges the latest base branch into this pull request\'s branch, so CI tests it against current code.',
    git: ['git fetch origin', 'git switch <your-branch>', 'git merge origin/main', 'git push'], risk: 'safe',
    note: 'Pull afterwards (git pull) so your local branch has the new merge commit.' },
  { id: 'squash-merge', match: /^(confirm )?squash and merge$/i, title: 'Squash and merge',
    what: 'Combines all the pull request\'s commits into one new commit on the base branch.',
    git: ['git switch main', 'git merge --squash <branch>', 'git commit -m "Title of the PR (#123)"'], risk: 'safe',
    note: 'History stays tidy, but the individual commits are not on main. Delete the branch afterwards; reusing it causes confusing conflicts.' },
  { id: 'rebase-merge', match: /^(confirm )?rebase and merge$/i, title: 'Rebase and merge',
    what: 'Replays each commit of the pull request on top of the base branch, with no merge commit.',
    git: ['git switch <branch>', 'git rebase main', 'git switch main', 'git merge --ff-only <branch>'], risk: 'safe',
    note: 'The commits get new ids on main.' },
  { id: 'merge-commit', match: /^(confirm merge|merge pull request|create a merge commit)$/i, title: 'Merge pull request',
    what: 'Adds the branch to the base branch with a merge commit that keeps every commit as it was.',
    git: ['git switch main', 'git merge --no-ff <branch>', 'git push origin main'], risk: 'safe' },
  { id: 'revert-pr', match: /^revert$/i, title: 'Revert',
    what: 'Opens a new pull request that undoes this merged pull request, without rewriting history.',
    git: ['git switch -c revert-123 main', 'git revert -m 1 <merge-commit>', 'git push -u origin revert-123'], risk: 'safe' },
  { id: 'delete-branch', match: /^delete branch$/i, title: 'Delete branch',
    what: 'Deletes the branch on GitHub. Merged work is safe on the base branch, and GitHub shows a Restore branch button.',
    git: ['git push origin --delete <branch>', 'git branch -d <branch>        # your local copy is not deleted for you'], risk: 'safe' },
  { id: 'restore-branch', match: /^restore branch$/i, title: 'Restore branch',
    what: 'Recreates the deleted branch on GitHub at the commit it pointed to.',
    git: ['git push origin <commit>:refs/heads/<branch>'], risk: 'safe' },
  { id: 'resolve-conflicts', match: /^resolve conflicts$/i, title: 'Resolve conflicts',
    what: 'Opens GitHub\'s editor to fix the conflicts between this branch and the base, then commits a merge.',
    git: ['git fetch origin', 'git merge origin/main', '# edit the files, remove the <<<<<<< ======= >>>>>>> markers', 'git add <files>', 'git commit', 'git push'], risk: 'safe',
    note: 'For anything more than a few lines, resolving locally is easier: you can run the tests before pushing.' },
  { id: 'compare-pr', match: /^compare & pull request$|^create pull request$/i, title: 'Pull request',
    what: 'Asks the maintainers to merge your branch. No Git command runs: it compares two branches on GitHub.',
    git: ['git push -u origin <branch>     # the branch must be on GitHub first', 'gh pr create                    # the same from the GitHub CLI'], risk: 'safe' },
  { id: 'fork', match: /^fork$/i, title: 'Fork',
    what: 'Makes your own copy of this repository on GitHub, so you can push branches and open pull requests.',
    git: ['git clone https://github.com/YOU/repo.git', 'git remote add upstream https://github.com/OWNER/repo.git'], risk: 'safe' },
  { id: 'commit-changes', match: /^commit changes\.*$/i, title: 'Commit changes',
    what: 'Saves the file you edited in the browser as a new commit (on this branch or a new one).',
    git: ['git add <file>', 'git commit -m "Update <file>"', 'git push'], risk: 'safe' },
];

/** Visible text without counters: "Fork1.5k (1.5k)" -> "Fork", "Discard 3 commits" -> "Discard commits". */
export const norm = (s: string): string => s.replace(/\(?\d[\d.,]*[km]?\)?/gi, ' ').replace(/\s+/g, ' ').trim();
/** The hint for a button's text, if Kitty knows it. "Update branch" means Sync fork outside pull request pages. */
export const hintFor = (text: string, href = ''): ButtonHint | undefined => {
  const t = norm(text);
  if (!t || t.length > 40) return undefined;
  if (/^update branch$/i.test(t) && !/\/pull\/\d+/.test(href)) return BUTTON_HINTS.find((h) => h.id === 'sync-fork');
  return BUTTON_HINTS.find((h) => h.match.test(t));
};
