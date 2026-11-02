# Branches and merging

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [Pro Git, 2nd ed., §3.1 Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)
> - [Pro Git, 2nd ed., §3.2 Basic Branching and Merging](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)
> - [Git documentation: git-merge](https://git-scm.com/docs/git-merge) · The Git Project, Git documentation · [GPL-2.0](https://github.com/git/git/blob/master/COPYING)

## Branches in a Nutshell

> Source: [Pro Git, 2nd ed., §3.1 Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell) · CC BY-NC-SA 3.0

To really understand the way Git does branching, we need to take a step back and examine how Git stores its data.

As you may remember from "What Is Git Section" (Pro Git), Git doesn't store data as a series of changesets or differences, but instead as a series of _snapshots_.

When you make a commit, Git stores a commit object that contains a pointer to the snapshot of the content you staged.
This object also contains the author's name and email address, the message that you typed, and pointers to the commit or commits that directly came before this commit (its parent or parents): zero parents for the initial commit, one parent for a normal commit, and multiple parents for a commit that results from a merge of two or more branches.

To visualize this, let's assume that you have a directory containing three files, and you stage them all and commit.
Staging the files computes a checksum for each one (the SHA-1 hash we mentioned in "What Is Git Section" (Pro Git)), stores that version of the file in the Git repository (Git refers to them as _blobs_), and adds that checksum to the staging area:

```console
$ git add README test.rb LICENSE
$ git commit -m 'Initial commit'
```

When you create the commit by running `git commit`, Git checksums each subdirectory (in this case, just the root project directory) and stores them as a tree object in the Git repository.
Git then creates a commit object that has the metadata and a pointer to the root project tree so it can re-create that snapshot when needed.

Your Git repository now contains five objects: three _blobs_ (each representing the contents of one of the three files), one _tree_ that lists the contents of the directory and specifies which file names are stored as which blobs, and one _commit_ with the pointer to that root tree and all the commit metadata.

If you make some changes and commit again, the next commit stores a pointer to the commit that came immediately before it.

A branch in Git is simply a lightweight movable pointer to one of these commits.
The default branch name in Git is `master`.
As you start making commits, you're given a `master` branch that points to the last commit you made.
Every time you commit, the `master` branch pointer moves forward automatically.

> **Note:**
>
> The "master" branch in Git is not a special branch.
> It is exactly like any other branch.
> The only reason nearly every repository has one is that the `git init` command creates it by default and most people don't bother to change it.

### Creating a New Branch

What happens when you create a new branch?
Well, doing so creates a new pointer for you to move around.
Let's say you want to create a new branch called `testing`.
You do this with the `git branch` command:

```console
$ git branch testing
```

This creates a new pointer to the same commit you're currently on.

How does Git know what branch you're currently on?
It keeps a special pointer called `HEAD`.
Note that this is a lot different than the concept of `HEAD` in other VCSs you may be used to, such as Subversion or CVS.
In Git, this is a pointer to the local branch you're currently on.
In this case, you're still on `master`.
The `git branch` command only _created_ a new branch — it didn't switch to that branch.

You can easily see this by running a simple `git log` command that shows you where the branch pointers are pointing.
This option is called `--decorate`.

```console
$ git log --oneline --decorate
f30ab (HEAD -> master, testing) Add feature #32 - ability to add new formats to the central interface
34ac2 Fix bug #1328 - stack overflow under certain conditions
98ca9 Initial commit
```

You can see the `master` and `testing` branches that are right there next to the `f30ab` commit.

### Switching Branches

To switch to an existing branch, you run the `git checkout` command.
Let's switch to the new `testing` branch:

```console
$ git checkout testing
```

This moves `HEAD` to point to the `testing` branch.

What is the significance of that?
Well, let's do another commit:

```console
$ vim test.rb
$ git commit -a -m 'Make a change'
```

This is interesting, because now your `testing` branch has moved forward, but your `master` branch still points to the commit you were on when you ran `git checkout` to switch branches.
Let's switch back to the `master` branch:

```console
$ git checkout master
```

> **Note — `git log` doesn't show _all_ the branches _all_ the time:**
>
> If you were to run `git log` right now, you might wonder where the "testing" branch you just created went, as it would not appear in the output.
>
> The branch hasn't disappeared; Git just doesn't know that you're interested in that branch and it is trying to show you what it thinks you're interested in.
> In other words, by default, `git log` will only show commit history below the branch you've checked out.
>
> To show commit history for the desired branch you have to explicitly specify it: `git log testing`.
> To show all of the branches, add `--all` to your `git log` command.

That command did two things.
It moved the HEAD pointer back to point to the `master` branch, and it reverted the files in your working directory back to the snapshot that `master` points to.
This also means the changes you make from this point forward will diverge from an older version of the project.
It essentially rewinds the work you've done in your `testing` branch so you can go in a different direction.

> **Note — Switching branches changes files in your working directory:**
>
> It's important to note that when you switch branches in Git, files in your working directory will change.
> If you switch to an older branch, your working directory will be reverted to look like it did the last time you committed on that branch.
> If Git cannot do it cleanly, it will not let you switch at all.

Let's make a few changes and commit again:

```console
$ vim test.rb
$ git commit -a -m 'Make other changes'
```

Now your project history has diverged (see the figure "Divergent history" (in the online book)).
You created and switched to a branch, did some work on it, and then switched back to your main branch and did other work.
Both of those changes are isolated in separate branches: you can switch back and forth between the branches and merge them together when you're ready.
And you did all that with simple `branch`, `checkout`, and `commit` commands.

You can also see this easily with the `git log` command.
If you run `git log --oneline --decorate --graph --all` it will print out the history of your commits, showing where your branch pointers are and how your history has diverged.

```console
$ git log --oneline --decorate --graph --all
* c2b9e (HEAD, master) Make other changes
| * 87ab2 (testing) Make a change
|/
* f30ab Add feature #32 - ability to add new formats to the central interface
* 34ac2 Fix bug #1328 - stack overflow under certain conditions
* 98ca9 Initial commit of my project
```

Because a branch in Git is actually a simple file that contains the 40 character SHA-1 checksum of the commit it points to, branches are cheap to create and destroy.
Creating a new branch is as quick and simple as writing 41 bytes to a file (40 characters and a newline).

This is in sharp contrast to the way most older VCS tools branch, which involves copying all of the project's files into a second directory.
This can take several seconds or even minutes, depending on the size of the project, whereas in Git the process is always instantaneous.
Also, because we're recording the parents when we commit, finding a proper merge base for merging is automatically done for us and is generally very easy to do.
These features help encourage developers to create and use branches often.

Let's see why you should do so.

> **Note — Creating a new branch and switching to it at the same time:**
>
> It's typical to create a new branch and want to switch to that new branch at the same time — this can be done in one operation with `git checkout -b <newbranchname>`.

> **Note:**
>
> From Git version 2.23 onwards you can use `git switch` instead of `git checkout` to:
>
> - Switch to an existing branch: `git switch testing-branch`.
> - Create a new branch and switch to it: `git switch -c new-branch`.
>   The `-c` flag stands for create, you can also use the full flag: `--create`.
> - Return to your previously checked out branch: `git switch -`.

## Basic Branching and Merging

> Source: [Pro Git, 2nd ed., §3.2 Basic Branching and Merging](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging) · CC BY-NC-SA 3.0

Let's go through a simple example of branching and merging with a workflow that you might use in the real world.
You'll follow these steps:

1. Do some work on a website.
1. Create a branch for a new user story you're working on.
1. Do some work in that branch.

At this stage, you'll receive a call that another issue is critical and you need a hotfix.
You'll do the following:

1. Switch to your production branch.
1. Create a branch to add the hotfix.
1. After it's tested, merge the hotfix branch, and push to production.
1. Switch back to your original user story and continue working.

### Basic Branching

First, let's say you're working on your project and have a couple of commits already on the `master` branch.

You've decided that you're going to work on issue #53 in whatever issue-tracking system your company uses.
To create a new branch and switch to it at the same time, you can run the `git checkout` command with the `-b` switch:

```console
$ git checkout -b iss53
Switched to a new branch "iss53"
```

This is shorthand for:

```console
$ git branch iss53
$ git checkout iss53
```

You work on your website and do some commits.
Doing so moves the `iss53` branch forward, because you have it checked out (that is, your `HEAD` is pointing to it):

```console
$ vim index.html
$ git commit -a -m 'Create new footer [issue 53]'
```

Now you get the call that there is an issue with the website, and you need to fix it immediately.
With Git, you don't have to deploy your fix along with the `iss53` changes you've made, and you don't have to put a lot of effort into reverting those changes before you can work on applying your fix to what is in production.
All you have to do is switch back to your `master` branch.

However, before you do that, note that if your working directory or staging area has uncommitted changes that conflict with the branch you're checking out, Git won't let you switch branches.
It's best to have a clean working state when you switch branches.
There are ways to get around this (namely, stashing and commit amending) that we'll cover later on, in "Git Stashing" (Pro Git).
For now, let's assume you've committed all your changes, so you can switch back to your `master` branch:

```console
$ git checkout master
Switched to branch 'master'
```

At this point, your project working directory is exactly the way it was before you started working on issue #53, and you can concentrate on your hotfix.
This is an important point to remember: when you switch branches, Git resets your working directory to look like it did the last time you committed on that branch.
It adds, removes, and modifies files automatically to make sure your working copy is what the branch looked like on your last commit to it.

Next, you have a hotfix to make.
Let's create a `hotfix` branch on which to work until it's completed:

```console
$ git checkout -b hotfix
Switched to a new branch 'hotfix'
$ vim index.html
$ git commit -a -m 'Fix broken email address'
[hotfix 1fb7853] Fix broken email address
 1 file changed, 2 insertions(+)
```

You can run your tests, make sure the hotfix is what you want, and finally merge the `hotfix` branch back into your `master` branch to deploy to production.
You do this with the `git merge` command:

```console
$ git checkout master
$ git merge hotfix
Updating f42c576..3a0874c
Fast-forward
 index.html | 2 ++
 1 file changed, 2 insertions(+)
```

You'll notice the phrase "fast-forward" in that merge.
Because the commit `C4` pointed to by the branch `hotfix` you merged in was directly ahead of the commit `C2` you're on, Git simply moves the pointer forward.
To phrase that another way, when you try to merge one commit with a commit that can be reached by following the first commit's history, Git simplifies things by moving the pointer forward because there is no divergent work to merge together — this is called a "fast-forward."

Your change is now in the snapshot of the commit pointed to by the `master` branch, and you can deploy the fix.

After your super-important fix is deployed, you're ready to switch back to the work you were doing before you were interrupted.
However, first you'll delete the `hotfix` branch, because you no longer need it — the `master` branch points at the same place.
You can delete it with the `-d` option to `git branch`:

```console
$ git branch -d hotfix
Deleted branch hotfix (3a0874c).
```

Now you can switch back to your work-in-progress branch on issue #53 and continue working on it.

```console
$ git checkout iss53
Switched to branch "iss53"
$ vim index.html
$ git commit -a -m 'Finish the new footer [issue 53]'
[iss53 ad82d7a] Finish the new footer [issue 53]
1 file changed, 1 insertion(+)
```

It's worth noting here that the work you did in your `hotfix` branch is not contained in the files in your `iss53` branch.
If you need to pull it in, you can merge your `master` branch into your `iss53` branch by running `git merge master`, or you can wait to integrate those changes until you decide to pull the `iss53` branch back into `master` later.

### Basic Merging

Suppose you've decided that your issue #53 work is complete and ready to be merged into your `master` branch.
In order to do that, you'll merge your `iss53` branch into `master`, much like you merged your `hotfix` branch earlier.
All you have to do is check out the branch you wish to merge into and then run the `git merge` command:

```console
$ git checkout master
Switched to branch 'master'
$ git merge iss53
Merge made by the 'recursive' strategy.
index.html |    1 +
1 file changed, 1 insertion(+)
```

This looks a bit different than the `hotfix` merge you did earlier.
In this case, your development history has diverged from some older point.
Because the commit on the branch you're on isn't a direct ancestor of the branch you're merging in, Git has to do some work.
In this case, Git does a simple three-way merge, using the two snapshots pointed to by the branch tips and the common ancestor of the two.

Instead of just moving the branch pointer forward, Git creates a new snapshot that results from this three-way merge and automatically creates a new commit that points to it.
This is referred to as a merge commit, and is special in that it has more than one parent.

Now that your work is merged in, you have no further need for the `iss53` branch.
You can close the issue in your issue-tracking system, and delete the branch:

```console
$ git branch -d iss53
```

### Basic Merge Conflicts

Occasionally, this process doesn't go smoothly.
If you changed the same part of the same file differently in the two branches you're merging, Git won't be able to merge them cleanly.
If your fix for issue #53 modified the same part of a file as the `hotfix` branch, you'll get a merge conflict that looks something like this:

```console
$ git merge iss53
Auto-merging index.html
CONFLICT (content): Merge conflict in index.html
Automatic merge failed; fix conflicts and then commit the result.
```

Git hasn't automatically created a new merge commit.
It has paused the process while you resolve the conflict.
If you want to see which files are unmerged at any point after a merge conflict, you can run `git status`:

```console
$ git status
On branch master
You have unmerged paths.
  (fix conflicts and run "git commit")

Unmerged paths:
  (use "git add <file>..." to mark resolution)

    both modified:      index.html

no changes added to commit (use "git add" and/or "git commit -a")
```

Anything that has merge conflicts and hasn't been resolved is listed as unmerged.
Git adds standard conflict-resolution markers to the files that have conflicts, so you can open them manually and resolve those conflicts.
Your file contains a section that looks something like this:

```html
<<<<<<< HEAD:index.html
<div id="footer">contact : email.support@github.com</div>
=======
<div id="footer">
 please contact us at support@github.com
</div>
>>>>>>> iss53:index.html
```

This means the version in `HEAD` (your `master` branch, because that was what you had checked out when you ran your merge command) is the top part of that block (everything above the `=======`), while the version in your `iss53` branch looks like everything in the bottom part.
In order to resolve the conflict, you have to either choose one side or the other or merge the contents yourself.
For instance, you might resolve this conflict by replacing the entire block with this:

```html
<div id="footer">
please contact us at email.support@github.com
</div>
```

This resolution has a little of each section, and the `<<<<<<<`, `=======`, and `>>>>>>>` lines have been completely removed.
After you've resolved each of these sections in each conflicted file, run `git add` on each file to mark it as resolved.
Staging the file marks it as resolved in Git.

If you want to use a graphical tool to resolve these issues, you can run `git mergetool`, which fires up an appropriate visual merge tool and walks you through the conflicts:

```console
$ git mergetool

This message is displayed because 'merge.tool' is not configured.
See 'git mergetool --tool-help' or 'git help config' for more details.
'git mergetool' will now attempt to use one of the following tools:
opendiff kdiff3 tkdiff xxdiff meld tortoisemerge gvimdiff diffuse diffmerge ecmerge p4merge araxis bc3 codecompare vimdiff emerge
Merging:
index.html

Normal merge conflict for 'index.html':
  {local}: modified file
  {remote}: modified file
Hit return to start merge resolution tool (opendiff):
```

If you want to use a merge tool other than the default (Git chose `opendiff` in this case because the command was run on macOS), you can see all the supported tools listed at the top after "one of the following tools."
Just type the name of the tool you'd rather use.

> **Note:**
>
> If you need more advanced tools for resolving tricky merge conflicts, we cover more on merging in "Advanced Merging" (Pro Git).

After you exit the merge tool, Git asks you if the merge was successful.
If you tell the script that it was, it stages the file to mark it as resolved for you.
You can run `git status` again to verify that all conflicts have been resolved:

```console
$ git status
On branch master
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:

    modified:   index.html
```

If you're happy with that, and you verify that everything that had conflicts has been staged, you can type `git commit` to finalize the merge commit.
The commit message by default looks something like this:

```console
Merge branch 'iss53'

Conflicts:
    index.html
#
# It looks like you may be committing a merge.
# If this is not correct, please remove the file
#    .git/MERGE_HEAD
# and try again.

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
# On branch master
# All conflicts fixed but you are still merging.
#
# Changes to be committed:
#    modified:   index.html
#
```

If you think it would be helpful to others looking at this merge in the future, you can modify this commit message with details about how you resolved the merge and explain why you did the changes you made if these are not obvious.

## `git merge` manual (excerpt)

> Source: [Git documentation: git-merge](https://git-scm.com/docs/git-merge) · GPL-2.0

### Fast-forward merge

Often the current branch head is an ancestor of the named commit.
This is the most common case especially when invoked from `git
pull`: you are tracking an upstream repository, you have committed
no local changes, and now you want to update to a newer upstream
revision.  In this case, a new commit is not needed to store the
combined history; instead, the `HEAD` (along with the index) is
updated to point at the named commit, without creating an extra
merge commit.

This behavior can be suppressed with the `--no-ff` option.

### True merge

Except in a fast-forward merge (see above), the branches to be
merged must be tied together by a merge commit that has both of them
as its parents.

A merged version reconciling the changes from all branches to be
merged is committed, and your `HEAD`, index, and working tree are
updated to it.  It is possible to have modifications in the working
tree as long as they do not overlap; the update will preserve them.

When it is not obvious how to reconcile the changes, the following
happens:

1. The `HEAD` pointer stays the same.
2. The `MERGE_HEAD` ref is set to point to the other branch head.
3. Paths that merged cleanly are updated both in the index file and
   in your working tree.
4. For conflicting paths, the index file records up to three
   versions: stage 1 stores the version from the common ancestor,
   stage 2 from `HEAD`, and stage 3 from `MERGE_HEAD` (you
   can inspect the stages with `git ls-files -u`).  The working
   tree files contain the result of the merge operation; i.e. 3-way
   merge results with familiar conflict markers `<<<` `===` `>>>`.
5. A ref named `AUTO_MERGE` is written, pointing to a tree
   corresponding to the current content of the working tree (including
   conflict markers for textual conflicts).  Note that this ref is only
   written when the `ort` merge strategy is used (the default).
6. No other changes are made.  In particular, the local
   modifications you had before you started merge will stay the
   same and the index entries for them stay as they were,
   i.e. matching `HEAD`.

If you tried a merge which resulted in complex conflicts and
want to start over, you can recover with `git merge --abort`.
