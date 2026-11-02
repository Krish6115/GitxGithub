<!-- transcript-of: Git/Git_Github Notes.pdf -->
# Git & GitHub Notes (illustrated): pull, push, merge, rebase, cherry-pick, log

> Transcript of `Git/Git_Github Notes.pdf`. The PDF is 4 photographed pages of hand-drawn notes with no text layer,
> so this file holds their text for Kitty's index. Handwritten text is transcribed as written (spelling fixed).
> Diagrams are described in [brackets]. In the diagrams, commits are drawn as cats; `master` and `tabby` are branch names.

## git pull

git pull updates your current HEAD branch with the latest changes from remote.

[Diagram: the **Remote** has `master` (four commits) and a remote branch `origin/tabby` that split off `master` with two commits.
**Local** has `master` (three commits, one behind the remote) and the local branch `tabby` (two commits).]

Now I'm going to `git pull` to update a branch!

### When the current branch is master

Local, HEAD → `master` (after `git checkout master`).

`git pull` (origin master): the newest remote commit is added to local `master`. The `tabby` branch is unchanged.

This is the same as:

```bash
git fetch origin
git merge origin/master
```

### When the current branch is tabby

Local, HEAD → `tabby` (after `git checkout tabby`).

`git pull` (origin tabby): the new commit from `origin/tabby` is added to local `tabby`. The `master` branch is unchanged.

Same as:

```bash
git fetch origin
git merge origin/tabby
```

[Diagram: `git fetch` brings the remote commit into the **tracking branch** (`origin/tabby`); `git merge origin/tabby` then moves it into `tabby`.]

## git push

git push transfers your commits from your local repo to a remote repo!

[Diagram: Local, HEAD → `Tabby` (after `git checkout tabby`). The latest commit on the local tabby branch is new.
`git push -u origin tabby` sends it to the **Remote**: the remote branch `origin/tabby` (the **upstream**) gets the new commit,
"pushed from local".]

Now the tabby branch on local and remote are sync'd!

### git push commands

- `git push <remote> <branch>` (e.g. `origin`, `tabby`): push the specified branch with all commits.
- `git push -u <remote> <branch>` (`-u` = `--set-upstream`): the `-u` flag sets up the association between your branch and the remote branch explicitly. You don't need it once you've done it!
- `git push -f <remote> <branch>` (`-f` = `--force`): force the push, even if it results in a non-fast-forward merge. Just ignore and push!
- `git push --all <remote>`: push all of your local branches!

## git merge

git merge incorporates changes into the current branch.

[Diagram: Local, HEAD → `tabby` (after `git checkout tabby`; the branches are synced to the remote master already).
`master` has moved ahead with new commits. `git merge master` creates a new commit on `tabby` that joins both lines of history.]

"git meow-ge!!!"

- merge is like having 2 parents and 1 resulting child!
- rebase adds all new changes on top of one parent.

## git rebase

git rebase moves a branch from one commit to another.

[Diagram: Local, HEAD → `tabby`. `git rebase master` moves the `tabby` commits so they start from the latest `master` commit.]

Cleaner commit history!

If you want to rebase from the remote master instead of local, do either:

```bash
git fetch origin
git rebase origin/master
```

or

```bash
git pull --rebase origin master
```

## git cherry-pick

git cherry-pick lets you grab some commits from one branch and apply it into another branch!

[Diagram: Local, HEAD → `tabby`. `master` has commits `e346d8` → `de82ac` → `2e46cd` → `d7003a`; `tabby` branched off with two commits.
`git cherry-pick 2e46cd` copies the diff introduced by `2e46cd` onto `tabby` as a new commit at the tip of `tabby`.]

## git log

git log lets you view the commit history.

[Diagram: commits `e346d8` → `de82ac` → `2e46cd` → `d7003a`, each identified by its SHA-1 checksum.]

`git log` prints out:

```text
commit e346d8
Author: Little-Princess Leia <leia@kitty.cat>
Date:   Sun Sept 23 17:30:42 2018 -0700

    Add body

commit de82ac
Author: Jamie <jam@kitty.cat>
Date:   ...
```

Simpler log with `git log --oneline`:

```text
e346d8 Add body
de82ac Edit nose
2e46cd Add gray dot on leg
```

(Use `git log --oneline` to find the SHA you want to cherry-pick into the tabby branch.)
