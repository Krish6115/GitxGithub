// Why each wrong quiz answer is wrong, keyed by skill id, in the order of the wrong choices in skills.ts.
export const WRONG_NOTES: Record<string, [string, string, string]> = {
  basics: ['git log lists commits that are already saved, not current changes.', 'git fetch downloads from the remote; it says nothing about your edits.', 'git tag names a commit (for releases).'],
  commit: ['Nothing reaches GitHub until you git push.', 'git branch or git switch -c creates branches.', 'git clean removes untracked files; git add never deletes anything.'],
  history: ['Commits on the remote are compared with git log origin/main or git diff origin/main.', 'git branch -a lists branches; diff compares file contents.', 'Untracked files are not in any diff until you add them.'],
  branches: ['-d deletes a branch.', 'merge combines another branch into the current one.', 'push uploads commits; it does not create or switch local branches.'],
  remotes: ['Both download; push is the one that uploads.', 'pull also integrates (merges or rebases); fetch only downloads.', 'fetch never deletes remote branches.'],
  merge: ['The number of commits does not matter; overlapping edits do.', 'Merging is local and works offline.', 'Branch names have nothing to do with conflicts.'],
  conflicts: ['--amend changes the last commit and does not finish a rebase.', 'reset --hard throws your resolution (and more) away.', 'Pushing in the middle of a rebase pushes an unfinished state.'],
  undo: ['Resetting and force pushing rewrites history others already have.', 'Deleting the branch does not remove the commit from main or from teammates.', '--amend rewrites the last commit; for a pushed commit that is still rewriting shared history.'],
  amend: ['A new commit after the last one is a normal commit, not --amend.', 'amend replaces the commit; the old one is only in the reflog.', 'amend is local; pushing it needs a (force) push.'],
  stash: ['Branches are untouched by stash.', 'stash does not commit anything.', 'stash is local; it does not change what GitHub shows.'],
  rebase: ['It is not faster; it adds a safety check.', 'Neither flag merges; both overwrite the remote branch.', 'Both replace the remote branch with yours.'],
  reflog: ['status shows current changes, not where HEAD used to be.', 'git clean deletes untracked files, the opposite of recovering.', 'git init makes a new repository.'],
  forks: ['Your fork is usually called origin.', 'main is a branch, not a remote.', 'Git has no automatic backup remote.'],
  'cherry-pick': ['cherry-pick never deletes commits.', 'git reset or git switch moves a branch; cherry-pick adds a commit.', 'git blame shows who wrote each line.'],
  ignore: ['Git reads .gitignore on every command; no restart is needed.', '.gitignore works the same on every OS.', 'Renaming does not untrack a file.'],
  actions: ['src/ holds source code; workflows must be in .github/workflows.', '.git/hooks are local hooks that never run on GitHub.', 'package.json scripts can be run by a workflow but do not define it.'],
};

/** The note for a wrong choice of `skill`, given the question's original choices (right answer first). */
export const wrongNote = (skill: string, choices: readonly string[], picked: string): string | undefined => {
  const i = choices.indexOf(picked);
  return i > 0 ? WRONG_NOTES[skill]?.[i - 1] : undefined;
};
