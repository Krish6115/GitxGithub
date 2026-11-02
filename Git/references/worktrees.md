# Worktrees: several branches checked out at once

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [Git documentation: git-worktree](https://git-scm.com/docs/git-worktree) · The Git Project, Git documentation · [GPL-2.0](https://github.com/git/git/blob/master/COPYING)

## `git worktree` manual (excerpt)

> Source: [Git documentation: git-worktree](https://git-scm.com/docs/git-worktree) · GPL-2.0

### Synopsis

```text
git worktree add [-f] [--detach] [--checkout] [--lock [--reason <string>]]
         [--orphan] [(-b | -B) <new-branch>] <path> [<commit-ish>]
git worktree list [-v | --porcelain [-z]]
git worktree lock [--reason <string>] <worktree>
git worktree move <worktree> <new-path>
git worktree prune [-n] [-v] [--expire <expire>]
git worktree remove [-f] <worktree>
git worktree repair [<path>...]
git worktree unlock <worktree>
```

### Description

Manage multiple working trees attached to the same repository.

A git repository can support multiple working trees, allowing you to check
out more than one branch at a time.  With `git worktree add` a new working
tree is associated with the repository, along with additional metadata
that differentiates that working tree from others in the same repository.
The working tree, along with this metadata, is called a "worktree".

This new worktree is called a "linked worktree" as opposed to the "main
worktree" prepared by `git init` or `git clone`.
A repository has one main worktree (if it's not a bare repository) and
zero or more linked worktrees. When you are done with a linked worktree,
remove it with `git worktree remove`.

In its simplest form, `git worktree add <path>` automatically creates a
new branch whose name is the final component of _<path>_, which is
convenient if you plan to work on a new topic. For instance, `git
worktree add ../hotfix` creates new branch `hotfix` and checks it out at
path `../hotfix`. To instead work on an existing branch in a new worktree,
use `git worktree add <path> <branch>`. On the other hand, if you just
plan to make some experimental changes or do testing without disturbing
existing development, it is often convenient to create a _throwaway_
worktree not associated with any branch. For instance,
`git worktree add -d <path>` creates a new worktree with a detached `HEAD`
at the same commit as the current branch.

If a working tree is deleted without using `git worktree remove`, then
its associated administrative files, which reside in the repository
(see DETAILS below), will eventually be removed automatically
(see `gc.worktreePruneExpire` in `git config`), or you can run
`git worktree prune` in the main or any linked worktree to clean up any
stale administrative files.

If the working tree for a linked worktree is stored on a portable device
or network share which is not always mounted, you can prevent its
administrative files from being pruned by issuing the `git worktree lock`
command, optionally specifying `--reason` to explain why the worktree is
locked.

### Commands

- **`add <path> [<commit-ish>]`**

Create a worktree at _<path>_ and checkout _<commit-ish>_ into it. The new worktree
is linked to the current repository, sharing everything except per-worktree
files such as `HEAD`, `index`, etc. As a convenience, _<commit-ish>_ may
be a bare "-", which is synonymous with `@{-1}`.

If _<commit-ish>_ is a branch name (call it _<branch>_) and is not found,
and neither `-b` nor `-B` nor `--detach` are used, but there does
exist a tracking branch in exactly one remote (call it _<remote>_)
with a matching name, treat as equivalent to:

```
$ git worktree add --track -b <branch> <path> <remote>/<branch>
```

If the branch exists in multiple remotes and one of them is named by
the `checkout.defaultRemote` configuration variable, we'll use that
one for the purposes of disambiguation, even if the _<branch>_ isn't
unique across all remotes. Set it to
e.g. `checkout.defaultRemote=origin` to always checkout remote
branches from there if _<branch>_ is ambiguous but exists on the
`origin` remote. See also `checkout.defaultRemote` in
`git config`.

If _<commit-ish>_ is omitted and neither `-b` nor `-B` nor `--detach` used,
then, as a convenience, the new worktree is associated with a branch (call
it _<branch>_) named after `$(basename <path>)`.  If _<branch>_ doesn't
exist, a new branch based on `HEAD` is automatically created as if
`-b <branch>` was given.  If _<branch>_ does exist, it will be checked out
in the new worktree, if it's not checked out anywhere else, otherwise the
command will refuse to create the worktree (unless `--force` is used).

If _<commit-ish>_ is omitted, neither `--detach`, or `--orphan` is
used, and there are no valid local branches (or remote branches if
`--guess-remote` is specified) then, as a convenience, the new worktree is
associated with a new unborn branch named _<branch>_ (after
`$(basename <path>)` if neither `-b` or `-B` is used) as if `--orphan` was
passed to the command. In the event the repository has a remote and
`--guess-remote` is used, but no remote or local branches exist, then the
command fails with a warning reminding the user to fetch from their remote
first (or override by using `-f`/`--force`).

- **`list`**

List details of each worktree.  The main worktree is listed first,
followed by each of the linked worktrees.  The output details include
whether the worktree is bare, the revision currently checked out, the
branch currently checked out (or "detached HEAD" if none), "locked" if
the worktree is locked, "prunable" if the worktree can be pruned by the
`prune` command.

- **`lock`**

If a worktree is on a portable device or network share which is not always
mounted, lock it to prevent its administrative files from being pruned
automatically. This also prevents it from being moved or deleted.
Optionally, specify a reason for the lock with `--reason`.

- **`move`**

Move a worktree to a new location. Note that the main worktree or linked
worktrees containing submodules cannot be moved with this command. (The
`git worktree repair` command, however, can reestablish the connection
with linked worktrees if you move the main worktree manually.)

- **`prune`**

Remove worktree information in `$GIT_DIR/worktrees` for worktrees
whose working trees are missing.  Useful after manually removing
a working tree that is no longer needed (but use "git worktree
remove" next time you want to do so).  Also, if you _moved_ a
working tree elsewhere causing the worktree information to become
dangling, see "git worktree repair" to reconnect the worktree to
the new working tree location.

- **`remove`**

Remove a worktree. Only clean worktrees (no untracked files and no
modification in tracked files) can be removed. Unclean worktrees or ones
with submodules can be removed with `--force`. The main worktree cannot be
removed.

- **`repair [<path>...]`**

Repair worktree administrative files, if possible, if they have become
corrupted or outdated due to external factors.

For instance, if the main worktree (or bare repository) is moved, linked
worktrees will be unable to locate it. Running `repair` in the main
worktree will reestablish the connection from linked worktrees back to the
main worktree.

Similarly, if the working tree for a linked worktree is moved without
using `git worktree move`, the main worktree (or bare repository) will be
unable to locate it. Running `repair` within the recently-moved worktree
will reestablish the connection. If multiple linked worktrees are moved,
running `repair` from any worktree with each tree's new _<path>_ as an
argument, will reestablish the connection to all the specified paths.

If both the main worktree and linked worktrees have been moved or copied manually,
then running `repair` in the main worktree and specifying the new _<path>_
of each linked worktree will reestablish all connections in both
directions.

- **`unlock`**

Unlock a worktree, allowing it to be pruned, moved or deleted.

### Options

- **`-f`**

- **`--force`**
By default, `add` refuses to create a new worktree when
_<commit-ish>_ is a branch name and is already checked out by
another worktree, or if _<path>_ is already assigned to some
worktree but is missing (for instance, if _<path>_ was deleted
manually). This option overrides these safeguards. To add a missing but
locked worktree path, specify `--force` twice.

`move` refuses to move a locked worktree unless `--force` is specified
twice. If the destination is already assigned to some other worktree but is
missing (for instance, if _<new-path>_ was deleted manually), then `--force`
allows the move to proceed; use `--force` twice if the destination is locked.

`remove` refuses to remove an unclean worktree unless `--force` is used.
To remove a locked worktree, specify `--force` twice.

- **`-b <new-branch>`**

- **`-B <new-branch>`**
With `add`, create a new branch named _<new-branch>_ starting at
_<commit-ish>_, and check out _<new-branch>_ into the new worktree.
If _<commit-ish>_ is omitted, it defaults to `HEAD`.
By default, `-b` refuses to create a new branch if it already
exists. `-B` overrides this safeguard, resetting _<new-branch>_ to
_<commit-ish>_.

- **`-d`**

- **`--detach`**
With `add`, detach `HEAD` in the new worktree. See "DETACHED HEAD"
in `git checkout`.

- **`--checkout`**

- **`--no-checkout`**
By default, `add` checks out _<commit-ish>_, however, `--no-checkout` can
be used to suppress checkout in order to make customizations,
such as configuring sparse-checkout. See "Sparse checkout"
in `git read-tree`.

- **`--guess-remote`**

- **`--no-guess-remote`**
With `worktree add <path>`, without _<commit-ish>_, instead
of creating a new branch from `HEAD`, if there exists a tracking
branch in exactly one remote matching the basename of _<path>_,
base the new branch on the remote-tracking branch, and mark
the remote-tracking branch as "upstream" from the new branch. If
there are multiple matches, the command fails. If there is no
match, the command falls back to creating a new branch from `HEAD`.

This can also be set up as the default behaviour by using the
`worktree.guessRemote` config option.

- **`--relative-paths`**

- **`--no-relative-paths`**
Link worktrees using relative paths or absolute paths (default).
Overrides the `worktree.useRelativePaths` config option, see
`git config`.

With `repair`, the linking files will be updated if there's an absolute/relative
mismatch, even if the links are correct.

- **`--track`**

- **`--no-track`**
When creating a new branch, if _<commit-ish>_ is a branch,
mark it as "upstream" from the new branch.  This is the
default if _<commit-ish>_ is a remote-tracking branch.  See
`--track` in `git branch` for details.

- **`--lock`**
Keep the worktree locked after creation. This is the
equivalent of `git worktree lock` after `git worktree add`,
but without a race condition.

- **`-n`**

- **`--dry-run`**
With `prune`, do not remove anything; just report what it would
remove.

- **`--orphan`**
With `add`, make the new worktree and index empty, associating
the worktree with a new unborn branch named _<new-branch>_.

- **`--porcelain`**
With `list`, output in an easy-to-parse format for scripts.
This format will remain stable across Git versions and regardless of user
configuration.  It is recommended to combine this with `-z`.
See below for details.

- **`-z`**
Terminate each line with a _NUL_ rather than a newline when
`--porcelain` is specified with `list`. This makes it possible
to parse the output when a worktree path contains a newline
character.

- **`-q`**

- **`--quiet`**
With `add`, suppress feedback messages.

- **`-v`**

- **`--verbose`**
With `prune`, report all removals.

With `list`, output additional information about worktrees (see below).

- **`--expire <time>`**
With `prune`, only prune missing worktrees if older than _<time>_.

With `list`, annotate missing worktrees as prunable if they are older than
_<time>_.

- **`--reason <string>`**
With `lock` or with `add --lock`, an explanation why the worktree
is locked.

- **_<worktree>_**
Worktrees can be identified by path, either relative or absolute.

If the last path components in the worktree's path is unique among
worktrees, it can be used to identify a worktree. For example if you only
have two worktrees, at `/abc/def/ghi` and `/abc/def/ggg`, then `ghi` or
`def/ghi` is enough to point to the former worktree.

### Examples

You are in the middle of a refactoring session and your boss comes in and
demands that you fix something immediately. You might typically use
`git stash` to store your changes away temporarily, however, your
working tree is in such a state of disarray (with new, moved, and removed
files, and other bits and pieces strewn around) that you don't want to risk
disturbing any of it. Instead, you create a temporary linked worktree to
make the emergency fix, remove it when done, and then resume your earlier
refactoring session.

```
$ git worktree add -b emergency-fix ../temp master
$ pushd ../temp
# ... hack hack hack ...
$ git commit -a -m 'emergency fix for boss'
$ popd
$ git worktree remove ../temp
```
