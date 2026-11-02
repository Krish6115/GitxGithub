# Rebasing and rewriting history

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [Pro Git, 2nd ed., §3.6 Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)
> - [Pro Git, 2nd ed., §7.6 Rewriting History](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)

## Rebasing

> Source: [Pro Git, 2nd ed., §3.6 Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing) · CC BY-NC-SA 3.0

In Git, there are two main ways to integrate changes from one branch into another: the `merge` and the `rebase`.
In this section you'll learn what rebasing is, how to do it, why it's a pretty amazing tool, and in what cases you won't want to use it.

### The Basic Rebase

If you go back to an earlier example from "Basic Merging" (Pro Git), you can see that you diverged your work and made commits on two different branches.

The easiest way to integrate the branches, as we've already covered, is the `merge` command.
It performs a three-way merge between the two latest branch snapshots (`C3` and `C4`) and the most recent common ancestor of the two (`C2`), creating a new snapshot (and commit).

However, there is another way: you can take the patch of the change that was introduced in `C4` and reapply it on top of `C3`.
In Git, this is called _rebasing_.
With the `rebase` command, you can take all the changes that were committed on one branch and replay them on a different branch.

For this example, you would check out the `experiment` branch, and then rebase it onto the `master` branch as follows:

```console
$ git checkout experiment
$ git rebase master
First, rewinding head to replay your work on top of it...
Applying: added staged command
```

This operation works by going to the common ancestor of the two branches (the one you're on and the one you're rebasing onto), getting the diff introduced by each commit of the branch you're on, saving those diffs to temporary files, resetting the current branch to the same commit as the branch you are rebasing onto, and finally applying each change in turn.

At this point, you can go back to the `master` branch and do a fast-forward merge.

```console
$ git checkout master
$ git merge experiment
```

Now, the snapshot pointed to by `C4'` is exactly the same as the one that was pointed to by `C5` in the merge example.
There is no difference in the end product of the integration, but rebasing makes for a cleaner history.
If you examine the log of a rebased branch, it looks like a linear history: it appears that all the work happened in series, even when it originally happened in parallel.

Often, you'll do this to make sure your commits apply cleanly on a remote branch — perhaps in a project to which you're trying to contribute but that you don't maintain.
In this case, you'd do your work in a branch and then rebase your work onto `origin/master` when you were ready to submit your patches to the main project.
That way, the maintainer doesn't have to do any integration work — just a fast-forward or a clean apply.

Note that the snapshot pointed to by the final commit you end up with, whether it's the last of the rebased commits for a rebase or the final merge commit after a merge, is the same snapshot — it's only the history that is different.
Rebasing replays changes from one line of work onto another in the order they were introduced, whereas merging takes the endpoints and merges them together.

### More Interesting Rebases

You can also have your rebase replay on something other than the rebase target branch.
Take a history like the figure "A history with a topic branch off another topic branch" (in the online book), for example.
You branched a topic branch (`server`) to add some server-side functionality to your project, and made a commit.
Then, you branched off that to make the client-side changes (`client`) and committed a few times.
Finally, you went back to your `server` branch and did a few more commits.

Suppose you decide that you want to merge your client-side changes into your mainline for a release, but you want to hold off on the server-side changes until it's tested further.
You can take the changes on `client` that aren't on `server` (`C8` and `C9`) and replay them on your `master` branch by using the `--onto` option of `git rebase`:

```console
$ git rebase --onto master server client
```

This basically says, "Take the `client` branch, figure out the patches since it diverged from the `server` branch, and replay these patches in the `client` branch as if it was based directly off the `master` branch instead."
It's a bit complex, but the result is pretty cool.

Now you can fast-forward your `master` branch (see the figure "Fast-forwarding your `master` branch to include the `client` branch changes" (in the online book)):

```console
$ git checkout master
$ git merge client
```

Let's say you decide to pull in your `server` branch as well.
You can rebase the `server` branch onto the `master` branch without having to check it out first by running `git rebase <basebranch> <topicbranch>` — which checks out the topic branch (in this case, `server`) for you and replays it onto the base branch (`master`):

```console
$ git rebase master server
```

This replays your `server` work on top of your `master` work, as shown in the figure "Rebasing your `server` branch on top of your `master` branch" (in the online book).

Then, you can fast-forward the base branch (`master`):

```console
$ git checkout master
$ git merge server
```

You can remove the `client` and `server` branches because all the work is integrated and you don't need them anymore, leaving your history for this entire process looking like the figure "Final commit history" (in the online book):

```console
$ git branch -d client
$ git branch -d server
```

### The Perils of Rebasing

Ahh, but the bliss of rebasing isn't without its drawbacks, which can be summed up in a single line:

**Do not rebase commits that exist outside your repository and that people may have based work on.**

If you follow that guideline, you'll be fine.
If you don't, people will hate you, and you'll be scorned by friends and family.

When you rebase stuff, you're abandoning existing commits and creating new ones that are similar but different.
If you push commits somewhere and others pull them down and base work on them, and then you rewrite those commits with `git rebase` and push them up again, your collaborators will have to re-merge their work and things will get messy when you try to pull their work back into yours.

Let's look at an example of how rebasing work that you've made public can cause problems.
Suppose you clone from a central server and then do some work off that.
Your commit history looks like this:

Now, someone else does more work that includes a merge, and pushes that work to the central server.
You fetch it and merge the new remote branch into your work, making your history look something like this:

Next, the person who pushed the merged work decides to go back and rebase their work instead; they do a `git push --force` to overwrite the history on the server.
You then fetch from that server, bringing down the new commits.

Now you're both in a pickle.
If you do a `git pull`, you'll create a merge commit which includes both lines of history, and your repository will look like this:

If you run a `git log` when your history looks like this, you'll see two commits that have the same author, date, and message, which will be confusing.
Furthermore, if you push this history back up to the server, you'll reintroduce all those rebased commits to the central server, which can further confuse people.
It's pretty safe to assume that the other developer doesn't want `C4` and `C6` to be in the history; that's why they rebased in the first place.

### Rebase When You Rebase

If you **do** find yourself in a situation like this, Git has some further magic that might help you out.
If someone on your team force pushes changes that overwrite work that you've based work on, your challenge is to figure out what is yours and what they've rewritten.

It turns out that in addition to the commit SHA-1 checksum, Git also calculates a checksum that is based just on the patch introduced with the commit.
This is called a "patch-id".

If you pull down work that was rewritten and rebase it on top of the new commits from your partner, Git can often successfully figure out what is uniquely yours and apply them back on top of the new branch.

For instance, in the previous scenario, if instead of doing a merge when we're at the figure "Someone pushes rebased commits, abandoning commits you've based your work on" (in the online book) we run `git rebase teamone/master`, Git will:

* Determine what work is unique to our branch (`C2`, `C3`, `C4`, `C6`, `C7`)
* Determine which are not merge commits (`C2`, `C3`, `C4`)
* Determine which have not been rewritten into the target branch (just `C2` and `C3`, since `C4` is the same patch as `C4'`)
* Apply those commits to the top of `teamone/master`

So instead of the result we see in the figure "You merge in the same work again into a new merge commit" (in the online book), we would end up with something more like the figure "Rebase on top of force-pushed rebase work" (in the online book).

This only works if `C4` and `C4'` that your partner made are almost exactly the same patch.
Otherwise the rebase won't be able to tell that it's a duplicate and will add another `C4`-like patch (which will probably fail to apply cleanly, since the changes would already be at least somewhat there).

You can also simplify this by running a `git pull --rebase` instead of a normal `git pull`.
Or you could do it manually with a `git fetch` followed by a `git rebase teamone/master` in this case.

If you are using `git pull` and want to make `--rebase` the default, you can set the `pull.rebase` config value with something like `git config --global pull.rebase true`.

If you only ever rebase commits that have never left your own computer, you'll be just fine.
If you rebase commits that have been pushed, but that no one else has based commits from, you'll also be fine.
If you rebase commits that have already been pushed publicly, and people may have based work on those commits, then you may be in for some frustrating trouble, and the scorn of your teammates.

If you or a partner does find it necessary at some point, make sure everyone knows to run `git pull --rebase` to try to make the pain after it happens a little bit simpler.

### Rebase vs. Merge

Now that you've seen rebasing and merging in action, you may be wondering which one is better.
Before we can answer this, let's step back a bit and talk about what history means.

One point of view on this is that your repository's commit history is a **record of what actually happened.**
It's a historical document, valuable in its own right, and shouldn't be tampered with.
From this angle, changing the commit history is almost blasphemous; you're _lying_ about what actually transpired.
So what if there was a messy series of merge commits?
That's how it happened, and the repository should preserve that for posterity.

The opposing point of view is that the commit history is the **story of how your project was made.**
You wouldn't publish the first draft of a book, so why show your messy work?
When you're working on a project, you may need a record of all your missteps and dead-end paths, but when it's time to show your work to the world, you may want to tell a more coherent story of how to get from A to B.
People in this camp use tools like `rebase` and `filter-branch` to rewrite their commits before they're merged into the mainline branch.
They use tools like `rebase` and `filter-branch`, to tell the story in the way that's best for future readers.

Now, to the question of whether merging or rebasing is better: hopefully you'll see that it's not that simple.
Git is a powerful tool, and allows you to do many things to and with your history, but every team and every project is different.
Now that you know how both of these things work, it's up to you to decide which one is best for your particular situation.

You can get the best of both worlds: rebase local changes before pushing to clean up your work, but never rebase anything that you've pushed somewhere.

## Rewriting History

> Source: [Pro Git, 2nd ed., §7.6 Rewriting History](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History) · CC BY-NC-SA 3.0

Many times, when working with Git, you may want to revise your local commit history.
One of the great things about Git is that it allows you to make decisions at the last possible moment.
You can decide what files go into which commits right before you commit with the staging area, you can decide that you didn't mean to be working on something yet with `git stash`, and you can rewrite commits that already happened so they look like they happened in a different way.
This can involve changing the order of the commits, changing messages or modifying files in a commit, squashing together or splitting apart commits, or removing commits entirely — all before you share your work with others.

In this section, you'll see how to accomplish these tasks so that you can make your commit history look the way you want before you share it with others.

> **Note — Don't push your work until you're happy with it:**
>
> One of the cardinal rules of Git is that, since so much work is local within your clone, you have a great deal of freedom to rewrite your history _locally_.
> However, once you push your work, it is a different story entirely, and you should consider pushed work as final unless you have good reason to change it.
> In short, you should avoid pushing your work until you're happy with it and ready to share it with the rest of the world.

### Changing the Last Commit

Changing your most recent commit is probably the most common rewriting of history that you'll do.
You'll often want to do two basic things to your last commit: simply change the commit message, or change the actual content of the commit by adding, removing and modifying files.

If you simply want to modify your last commit message, that's easy:

```console
$ git commit --amend
```

The command above loads the previous commit message into an editor session, where you can make changes to the message, save those changes and exit.
When you save and close the editor, the editor writes a new commit containing that updated commit message and makes it your new last commit.

If, on the other hand, you want to change the actual _content_ of your last commit, the process works basically the same way — first make the changes you think you forgot, stage those changes, and the subsequent `git commit --amend` _replaces_ that last commit with your new, improved commit.

You need to be careful with this technique because amending changes the SHA-1 of the commit.
It's like a very small rebase — don't amend your last commit if you've already pushed it.

> **Tip — An amended commit may (or may not) need an amended commit message:**
>
> When you amend a commit, you have the opportunity to change both the commit message and the content of the commit.
> If you amend the content of the commit substantially, you should almost certainly update the commit message to reflect that amended content.
>
> On the other hand, if your amendments are suitably trivial (fixing a silly typo or adding a file you forgot to stage) such that the earlier commit message is just fine, you can simply make the changes, stage them, and avoid the unnecessary editor session entirely with:
>
> [source,console]
> ----
> $ git commit --amend --no-edit
> ----
>

### Changing Multiple Commit Messages

To modify a commit that is farther back in your history, you must move to more complex tools.
Git doesn't have a modify-history tool, but you can use the rebase tool to rebase a series of commits onto the HEAD that they were originally based on instead of moving them to another one.
With the interactive rebase tool, you can then stop after each commit you want to modify and change the message, add files, or do whatever you wish.
You can run rebase interactively by adding the `-i` option to `git rebase`.
You must indicate how far back you want to rewrite commits by telling the command which commit to rebase onto.

For example, if you want to change the last three commit messages, or any of the commit messages in that group, you supply as an argument to `git rebase -i` the parent of the last commit you want to edit, which is `HEAD~2^` or `HEAD~3`.
It may be easier to remember the `~3` because you're trying to edit the last three commits, but keep in mind that you're actually designating four commits ago, the parent of the last commit you want to edit:

```console
$ git rebase -i HEAD~3
```

Remember again that this is a rebasing command — every commit in the range `HEAD~3..HEAD` with a changed message _and all of its descendants_ will be rewritten.
Don't include any commit you've already pushed to a central server — doing so will confuse other developers by providing an alternate version of the same change.

Running this command gives you a list of commits in your text editor that looks something like this:

```console
pick f7f3f6d Change my name a bit
pick 310154e Update README formatting and add blame
pick a5f4a0d Add cat-file

# Rebase 710f0f8..a5f4a0d onto 710f0f8
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup <commit> = like "squash", but discard this commit's log message
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
# d, drop <commit> = remove commit
# l, label <label> = label current HEAD with a name
# t, reset <label> = reset HEAD to a label
# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]
# .       create a merge commit using the original merge commit's
# .       message (or the oneline, if no original merge commit was
# .       specified). Use -c <commit> to reword the commit message.
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
#
# Note that empty commits are commented out
```

It's important to note that these commits are listed in the opposite order than you normally see them using the `log` command.
If you run a `log`, you see something like this:

```console
$ git log --pretty=format:"%h %s" HEAD~3..HEAD
a5f4a0d Add cat-file
310154e Update README formatting and add blame
f7f3f6d Change my name a bit
```

Notice the reverse order.
The interactive rebase gives you a script that it's going to run.
It will start at the commit you specify on the command line (`HEAD~3`) and replay the changes introduced in each of these commits from top to bottom.
It lists the oldest at the top, rather than the newest, because that's the first one it will replay.

You need to edit the script so that it stops at the commit you want to edit.
To do so, change the word "pick" to the word "edit" for each of the commits you want the script to stop after.
For example, to modify only the third commit message, you change the file to look like this:

```console
edit f7f3f6d Change my name a bit
pick 310154e Update README formatting and add blame
pick a5f4a0d Add cat-file
```

When you save and exit the editor, Git rewinds you back to the last commit in that list and drops you on the command line with the following message:

```console
$ git rebase -i HEAD~3
Stopped at f7f3f6d... Change my name a bit
You can amend the commit now, with

       git commit --amend

Once you're satisfied with your changes, run

       git rebase --continue
```

These instructions tell you exactly what to do.
Type:

```console
$ git commit --amend
```

Change the commit message, and exit the editor.
Then, run:

```console
$ git rebase --continue
```

This command will apply the other two commits automatically, and then you're done.
If you change `pick` to `edit` on more lines, you can repeat these steps for each commit you change to `edit`.
Each time, Git will stop, let you amend the commit, and continue when you're finished.

### Reordering Commits

You can also use interactive rebases to reorder or remove commits entirely.
If you want to remove the "Add cat-file" commit and change the order in which the other two commits are introduced, you can change the rebase script from this:

```console
pick f7f3f6d Change my name a bit
pick 310154e Update README formatting and add blame
pick a5f4a0d Add cat-file
```

to this:

```console
pick 310154e Update README formatting and add blame
pick f7f3f6d Change my name a bit
```

When you save and exit the editor, Git rewinds your branch to the parent of these commits, applies `310154e` and then `f7f3f6d`, and then stops.
You effectively change the order of those commits and remove the "Add cat-file" commit completely.

### Squashing Commits

It's also possible to take a series of commits and squash them down into a single commit with the interactive rebasing tool.
The script puts helpful instructions in the rebase message:

```console
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup <commit> = like "squash", but discard this commit's log message
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
# d, drop <commit> = remove commit
# l, label <label> = label current HEAD with a name
# t, reset <label> = reset HEAD to a label
# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]
# .       create a merge commit using the original merge commit's
# .       message (or the oneline, if no original merge commit was
# .       specified). Use -c <commit> to reword the commit message.
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
#
# Note that empty commits are commented out
```

If, instead of "pick" or "edit", you specify "squash", Git applies both that change and the change directly before it and makes you merge the commit messages together.
So, if you want to make a single commit from these three commits, you make the script look like this:

```console
pick f7f3f6d Change my name a bit
squash 310154e Update README formatting and add blame
squash a5f4a0d Add cat-file
```

When you save and exit the editor, Git applies all three changes and then puts you back into the editor to merge the three commit messages:

```console
# This is a combination of 3 commits.
# The first commit's message is:
Change my name a bit

# This is the 2nd commit message:

Update README formatting and add blame

# This is the 3rd commit message:

Add cat-file
```

When you save that, you have a single commit that introduces the changes of all three previous commits.

### Splitting a Commit

Splitting a commit undoes a commit and then partially stages and commits as many times as commits you want to end up with.
For example, suppose you want to split the middle commit of your three commits.
Instead of "Update README formatting and add blame", you want to split it into two commits: "Update README formatting" for the first, and "Add blame" for the second.
You can do that in the `rebase -i` script by changing the instruction on the commit you want to split to "edit":

```console
pick f7f3f6d Change my name a bit
edit 310154e Update README formatting and add blame
pick a5f4a0d Add cat-file
```

Then, when the script drops you to the command line, you reset that commit, take the changes that have been reset, and create multiple commits out of them.
When you save and exit the editor, Git rewinds to the parent of the first commit in your list, applies the first commit (`f7f3f6d`), applies the second (`310154e`), and drops you to the console.
There, you can do a mixed reset of that commit with `git reset HEAD^`, which effectively undoes that commit and leaves the modified files unstaged.
Now you can stage and commit files until you have several commits, and run `git rebase --continue` when you're done:

```console
$ git reset HEAD^
$ git add README
$ git commit -m 'Update README formatting'
$ git add lib/simplegit.rb
$ git commit -m 'Add blame'
$ git rebase --continue
```

Git applies the last commit (`a5f4a0d`) in the script, and your history looks like this:

```console
$ git log -4 --pretty=format:"%h %s"
1c002dd Add cat-file
9b29157 Add blame
35cfb2b Update README formatting
f7f3f6d Change my name a bit
```

This changes the SHA-1s of the three most recent commits in your list, so make sure no changed commit shows up in that list that you've already pushed to a shared repository.
Notice that the last commit (`f7f3f6d`) in the list is unchanged.
Despite this commit being shown in the script, because it was marked as "pick" and was applied prior to any rebase changes, Git leaves the commit unmodified.

### Deleting a commit

If you want to get rid of a commit, you can delete it using the `rebase -i` script.
In the list of commits, put the word "drop" before the commit you want to delete (or just delete that line from the rebase script):

```console
pick 461cb2a This commit is OK
drop 5aecc10 This commit is broken
```

Because of the way Git builds commit objects, deleting or altering a commit will cause the rewriting of all the commits that follow it.
The further back in your repo's history you go, the more commits will need to be recreated.
This can cause lots of merge conflicts if you have many commits later in the sequence that depend on the one you just deleted.

If you get partway through a rebase like this and decide it's not a good idea, you can always stop.
Type `git rebase --abort`, and your repo will be returned to the state it was in before you started the rebase.

If you finish a rebase and decide it's not what you want, you can use `git reflog` to recover an earlier version of your branch.
See "Data Recovery" (Pro Git) for more information on the `reflog` command.

> **Note:**
>
> Drew DeVault made a practical hands-on guide with exercises to learn how to use `git rebase`.
> You can find it at: [](https://git-rebase.io/)
