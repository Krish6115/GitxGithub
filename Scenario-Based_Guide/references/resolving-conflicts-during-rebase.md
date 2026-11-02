# Resolving conflicts during a rebase

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: Resolving merge conflicts after a Git rebase](https://docs.github.com/en/get-started/using-git/resolving-merge-conflicts-after-a-git-rebase) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [Git documentation: git-rebase](https://git-scm.com/docs/git-rebase) · The Git Project, Git documentation · [GPL-2.0](https://github.com/git/git/blob/master/COPYING)

## Resolving merge conflicts after a Git rebase

> Source: [GitHub Docs: Resolving merge conflicts after a Git rebase](https://docs.github.com/en/get-started/using-git/resolving-merge-conflicts-after-a-git-rebase) · CC BY 4.0

When you perform a `git rebase` operation, you're typically moving commits around. Because of this, you might get into a situation where a merge conflict is introduced. That means that two of your commits modified the same line in the same file, and Git doesn't know which change to apply.

After you reorder and manipulate commits using `git rebase`, should a merge conflict occur, Git will tell you so with the following message printed to the terminal:

```shell
error: could not apply fa39187... something to add to patch A

When you have resolved this problem, run "git rebase --continue".
If you prefer to skip this patch, run "git rebase --skip" instead.
To check out the original branch and stop rebasing, run "git rebase --abort".
Could not apply fa39187f3c3dfd2ab5faa38ac01cf3de7ce2e841... Change fake file
```

Here, Git is telling you which commit is causing the conflict (`fa39187`). You're given three choices:

* You can run `git rebase --abort` to completely undo the rebase. Git will return you to your branch's state as it was before `git rebase` was called.
* You can run `git rebase --skip` to completely skip the commit. That means that none of the changes introduced by the problematic commit will be included. It is very rare that you would choose this option.
* You can fix the conflict.

To fix the conflict, you can follow [the standard procedures for resolving merge conflicts from the command line](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-using-the-command-line). When you're finished, you'll need to call `git rebase --continue` in order for Git to continue processing the rest of the rebase.

## `git rebase` manual (excerpt)

> Source: [Git documentation: git-rebase](https://git-scm.com/docs/git-rebase) · GPL-2.0

### Description

Transplant a series of commits onto a different starting point.
You can also use `git rebase` to reorder or combine commits: see
INTERACTIVE MODE below for how to do that.

For example, imagine that you have been working on the `topic` branch in this
history, and you want to "catch up" to the work done on the `master` branch.

```
          A---B---C topic
         /
    D---E---F---G master
```

You want to transplant the commits you made on `topic` since it diverged from
`master` (i.e. A, B, and C), on top of the current `master`.  You can do this
by running `git rebase master` while the `topic` branch is checked out.  If you
want to rebase `topic` while on another branch, `git rebase master topic` is a
shortcut for `git checkout topic && git rebase master`.

```
                  A'--B'--C' topic
                 /
    D---E---F---G master
```

If there is a merge conflict during this process, `git rebase` will stop at the
first problematic commit and leave conflict markers. If this happens, you can do
one of these things:

1. Resolve the conflict. You can use `git diff` to find the markers (<<<<<<)
   and make edits to resolve the conflict. For each file you edit, you need to
   tell Git that the conflict has been resolved. You can mark the conflict as
   resolved with  `git add <filename>`. After resolving all of the conflicts,
   you can continue the rebasing process with

   git rebase --continue

2. Stop the `git rebase` and return your branch to its original state with

   git rebase --abort

3. Skip the commit that caused the merge conflict with

   git rebase --skip

If you don't specify an `<upstream>` to rebase onto, the upstream configured in
`branch.<name>.remote` and `branch.<name>.merge` options will be used (see
`git config` for details) and the `--fork-point` option is
assumed.  If you are currently not on any branch or if the current
branch does not have a configured upstream, the rebase will abort.

Here is a simplified description of what `git rebase <upstream>` does:

1. Make a list of all commits on your current branch since it branched
   off from `<upstream>` that do not have an equivalent commit in
   `<upstream>`.
2. Check out `<upstream>` with the equivalent of
   `git checkout --detach <upstream>`.
3. Replay the commits, one by one, in order. This is similar to running
   `git cherry-pick <commit>` for each commit.
   See REBASING MERGES for how merges are handled.
4. Update your branch to point to the final commit with the equivalent
   of `git checkout -B <branch>`.

> **Note:**
>
> When starting the rebase, `ORIG_HEAD` is set to point to the commit at the tip
> of the to-be-rebased branch. However, `ORIG_HEAD` is not guaranteed to still
> point to that commit at the end of the rebase if other commands that change
> `ORIG_HEAD` (like `git reset`) are used during the rebase. The previous branch
> tip, however, is accessible using the reflog of the current branch (i.e. `@{1}`,
> see `gitrevisions`).

## Why "ours" and "theirs" are swapped during a rebase

> Source: [Git documentation: git-rebase](https://git-scm.com/docs/git-rebase) · GPL-2.0

Note that a rebase merge works by replaying each commit from the working
branch on top of the `<upstream>` branch.  Because of this, when a merge
conflict happens, the side reported as _ours_ is the so-far rebased
series, starting with `<upstream>`, and _theirs_ is the working branch.
In other words, the sides are swapped.
