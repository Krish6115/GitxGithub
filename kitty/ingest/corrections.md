# Corrections to common Git & GitHub misconceptions

> Written for Kitty by the GitKitty project. Each entry corrects a statement found in the repository's learning PDFs
> (see `kitty/ingest/AUDIT.md` §5) and links the official documentation it is based on.

## Does pushing a tag create a GitHub release?

No. `git push origin v1.0` (or `git push origin --tags`) only publishes the tag. GitHub lists it under **Tags**, but a
**Release** is a separate object with notes and optional files. Create one on GitHub (Releases → Draft a new release),
with `gh release create v1.0 --notes "..."`, or from a GitHub Actions workflow.
Docs: https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository

## What does git fetch --prune actually remove?

`git fetch --prune` (or `git fetch --all --prune`) deletes **remote-tracking branches** such as `origin/old-feature`
whose branch no longer exists on the remote. It does not delete commits, local branches or tags (tags need `--prune-tags`).
Docs: https://git-scm.com/docs/git-fetch#Documentation/git-fetch.txt---prune

## Which commits does git reset <commit> move back to the working tree?

`git reset <commit>` (default `--mixed`) moves the branch to `<commit>`. The changes from the commits **after**
`<commit>` stay in your working tree as unstaged changes. `--soft` keeps them staged; `--hard` discards them
(recoverable only through `git reflog`).
Docs: https://git-scm.com/docs/git-reset

## How do I leave insert mode in Vim when Git opens an editor?

Press `Esc` to leave insert mode, then type `:wq` (write and quit) or `:x` and press Enter. To abort without saving,
use `:q!`. To use another editor for commit messages: `git config --global core.editor "code --wait"`.
Docs: https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup

## Who resolves merge conflicts in a pull request?

Usually the pull request author, not only the maintainer. Update your branch with the base branch (merge or rebase),
resolve the conflicts locally and push, or use GitHub's conflict editor for simple line conflicts.
Docs: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-on-github

## Is git config credential.helper store safe for tokens?

`credential.helper store` saves your token **in plain text** in `~/.git-credentials`. Prefer an encrypted helper:
Git Credential Manager (Windows, macOS, Linux), `osxkeychain` on macOS or `libsecret` on Linux, or log in with
`gh auth login`, which configures Git for you.
Docs: https://git-scm.com/docs/gitcredentials and https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git

## How long does the reflog keep lost commits?

Reflog entries for commits that are still reachable are kept for 90 days by default (`gc.reflogExpire`), but entries
for **unreachable** commits (for example after `git reset --hard` or deleting a branch) expire after **30 days**
(`gc.reflogExpireUnreachable`). Recover lost work soon with `git reflog` and `git branch <name> <sha>`.
Docs: https://git-scm.com/docs/git-gc and https://git-scm.com/docs/git-reflog

## I committed a secret (.env, API key). Is git revert enough?

No. `git revert` adds a new commit, but the secret stays in history and in every clone. First **revoke or rotate the
secret** (this is what actually protects you). Then, if needed, rewrite history with `git filter-repo` (not the
deprecated `git filter-branch`), force-push, and follow GitHub's guide for removing cached data.
Docs: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

## After setting up SSH, do I never need a token again?

SSH keys cover Git operations over SSH remotes (`git@github.com:...`). You still need a token or `gh auth login`
for the GitHub CLI, the REST API and HTTPS remotes. A passphrase-protected key also prompts unless `ssh-agent` caches it.
Docs: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## During a rebase, which side is ours and which is theirs?

During `git rebase`, the sides are **swapped** compared with a merge: "ours" (and `HEAD`) is the branch you are
rebasing onto (the upstream), and "theirs" is your own commit being replayed. So `git checkout --theirs file` keeps
**your** version during a rebase. During a merge, "ours" is your current branch.
Docs: https://git-scm.com/docs/git-rebase#Documentation/git-rebase.txt---merge
