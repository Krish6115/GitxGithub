# Remotes and remote-tracking branches

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [Pro Git, 2nd ed., §2.5 Working with Remotes](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)
> - [Pro Git, 2nd ed., §3.5 Remote Branches](https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)

## Working with Remotes

> Source: [Pro Git, 2nd ed., §2.5 Working with Remotes](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes) · CC BY-NC-SA 3.0

To be able to collaborate on any Git project, you need to know how to manage your remote repositories.
Remote repositories are versions of your project that are hosted on the Internet or network somewhere.
You can have several of them, each of which generally is either read-only or read/write for you.
Collaborating with others involves managing these remote repositories and pushing and pulling data to and from them when you need to share work.
Managing remote repositories includes knowing how to add remote repositories, remove remotes that are no longer valid, manage various remote branches and define them as being tracked or not, and more.
In this section, we'll cover some of these remote-management skills.

> **Note — Remote repositories can be on your local machine.:**
>
> It is entirely possible that you can be working with a "remote" repository that is, in fact, on the same host you are.
> The word "remote" does not necessarily imply that the repository is somewhere else on the network or Internet, only that it is elsewhere.
> Working with such a remote repository would still involve all the standard pushing, pulling and fetching operations as with any other remote.

### Showing Your Remotes

To see which remote servers you have configured, you can run the `git remote` command.
It lists the shortnames of each remote handle you've specified.
If you've cloned your repository, you should at least see `origin` — that is the default name Git gives to the server you cloned from:

```console
$ git clone https://github.com/schacon/ticgit
Cloning into 'ticgit'...
remote: Reusing existing pack: 1857, done.
remote: Total 1857 (delta 0), reused 0 (delta 0)
Receiving objects: 100% (1857/1857), 374.35 KiB | 268.00 KiB/s, done.
Resolving deltas: 100% (772/772), done.
Checking connectivity... done.
$ cd ticgit
$ git remote
origin
```

You can also specify `-v`, which shows you the URLs that Git has stored for the shortname to be used when reading and writing to that remote:

```console
$ git remote -v
origin    https://github.com/schacon/ticgit (fetch)
origin    https://github.com/schacon/ticgit (push)
```

If you have more than one remote, the command lists them all.
For example, a repository with multiple remotes for working with several collaborators might look something like this.

```console
$ cd grit
$ git remote -v
bakkdoor  https://github.com/bakkdoor/grit (fetch)
bakkdoor  https://github.com/bakkdoor/grit (push)
cho45     https://github.com/cho45/grit (fetch)
cho45     https://github.com/cho45/grit (push)
defunkt   https://github.com/defunkt/grit (fetch)
defunkt   https://github.com/defunkt/grit (push)
koke      git://github.com/koke/grit.git (fetch)
koke      git://github.com/koke/grit.git (push)
origin    git@github.com:mojombo/grit.git (fetch)
origin    git@github.com:mojombo/grit.git (push)
```

This means we can pull contributions from any of these users pretty easily.
We may additionally have permission to push to one or more of these, though we can't tell that here.

Notice that these remotes use a variety of protocols; we'll cover more about this in "Getting Git On A Server" (Pro Git).

### Adding Remote Repositories

We've mentioned and given some demonstrations of how the `git clone` command implicitly adds the `origin` remote for you.
Here's how to add a new remote explicitly.
To add a new remote Git repository as a shortname you can reference easily, run `git remote add <shortname> <url>`:

```console
$ git remote
origin
$ git remote add pb https://github.com/paulboone/ticgit
$ git remote -v
origin    https://github.com/schacon/ticgit (fetch)
origin    https://github.com/schacon/ticgit (push)
pb    https://github.com/paulboone/ticgit (fetch)
pb    https://github.com/paulboone/ticgit (push)
```

Now you can use the string `pb` on the command line instead of the whole URL.
For example, if you want to fetch all the information that Paul has but that you don't yet have in your repository, you can run `git fetch pb`:

```console
$ git fetch pb
remote: Counting objects: 43, done.
remote: Compressing objects: 100% (36/36), done.
remote: Total 43 (delta 10), reused 31 (delta 5)
Unpacking objects: 100% (43/43), done.
From https://github.com/paulboone/ticgit
 * [new branch]      master     -> pb/master
 * [new branch]      ticgit     -> pb/ticgit
```

Paul's `master` branch is now accessible locally as `pb/master` — you can merge it into one of your branches, or you can check out a local branch at that point if you want to inspect it.
We'll go over what branches are and how to use them in much more detail in "Git Branching" (Pro Git).

### Fetching and Pulling from Your Remotes

As you just saw, to get data from your remote projects, you can run:

```console
$ git fetch <remote>
```

The command goes out to that remote project and pulls down all the data from that remote project that you don't have yet.
After you do this, you should have references to all the branches from that remote, which you can merge in or inspect at any time.

If you clone a repository, the command automatically adds that remote repository under the name "origin".
So, `git fetch origin` fetches any new work that has been pushed to that server since you cloned (or last fetched from) it.
It's important to note that the `git fetch` command only downloads the data to your local repository — it doesn't automatically merge it with any of your work or modify what you're currently working on.
You have to merge it manually into your work when you're ready.

If your current branch is set up to track a remote branch (see the next section and "Git Branching" (Pro Git) for more information), you can use the `git pull` command to automatically fetch and then merge that remote branch into your current branch.
This may be an easier or more comfortable workflow for you; and by default, the `git clone` command automatically sets up your local `master` branch to track the remote `master` branch (or whatever the default branch is called) on the server you cloned from.
Running `git pull` generally fetches data from the server you originally cloned from and automatically tries to merge it into the code you're currently working on.

> **Note:**
>
> From Git version 2.27 onward, `git pull` will give a warning if the `pull.rebase` variable is not set.
> Git will keep warning you until you set the variable.
>
> If you want the default behavior of Git (fast-forward if possible, else create a merge commit):
> `git config --global pull.rebase "false"
>
> If you want to rebase when pulling:
> `git config --global pull.rebase "true"

### Pushing to Your Remotes

When you have your project at a point that you want to share, you have to push it upstream.
The command for this is simple: `git push <remote> <branch>`.
If you want to push your `master` branch to your `origin` server (again, cloning generally sets up both of those names for you automatically), then you can run this to push any commits you've done back up to the server:

```console
$ git push origin master
```

This command works only if you cloned from a server to which you have write access and if nobody has pushed in the meantime.
If you and someone else clone at the same time and they push upstream and then you push upstream, your push will rightly be rejected.
You'll have to fetch their work first and incorporate it into yours before you'll be allowed to push.
See "Git Branching" (Pro Git) for more detailed information on how to push to remote servers.

### Inspecting a Remote

If you want to see more information about a particular remote, you can use the `git remote show <remote>` command.
If you run this command with a particular shortname, such as `origin`, you get something like this:

```console
$ git remote show origin
* remote origin
  Fetch URL: https://github.com/schacon/ticgit
  Push  URL: https://github.com/schacon/ticgit
  HEAD branch: master
  Remote branches:
    master                               tracked
    dev-branch                           tracked
  Local branch configured for 'git pull':
    master merges with remote master
  Local ref configured for 'git push':
    master pushes to master (up to date)
```

It lists the URL for the remote repository as well as the tracking branch information.
The command helpfully tells you that if you're on the `master` branch and you run `git pull`, it will automatically merge the remote's `master` branch into the local one after it has been fetched.
It also lists all the remote references it has pulled down.

That is a simple example you're likely to encounter.
When you're using Git more heavily, however, you may see much more information from `git remote show`:

```console
$ git remote show origin
* remote origin
  URL: https://github.com/my-org/complex-project
  Fetch URL: https://github.com/my-org/complex-project
  Push  URL: https://github.com/my-org/complex-project
  HEAD branch: master
  Remote branches:
    master                           tracked
    dev-branch                       tracked
    markdown-strip                   tracked
    issue-43                         new (next fetch will store in remotes/origin)
    issue-45                         new (next fetch will store in remotes/origin)
    refs/remotes/origin/issue-11     stale (use 'git remote prune' to remove)
  Local branches configured for 'git pull':
    dev-branch merges with remote dev-branch
    master     merges with remote master
  Local refs configured for 'git push':
    dev-branch                     pushes to dev-branch                     (up to date)
    markdown-strip                 pushes to markdown-strip                 (up to date)
    master                         pushes to master                         (up to date)
```

This command shows which branch is automatically pushed to when you run `git push` while on certain branches.
It also shows you which remote branches on the server you don't yet have, which remote branches you have that have been removed from the server, and multiple local branches that are able to merge automatically with their remote-tracking branch when you run `git pull`.

### Renaming and Removing Remotes

You can run `git remote rename` to change a remote's shortname.
For instance, if you want to rename `pb` to `paul`, you can do so with `git remote rename`:

```console
$ git remote rename pb paul
$ git remote
origin
paul
```

It's worth mentioning that this changes all your remote-tracking branch names, too.
What used to be referenced at `pb/master` is now at `paul/master`.

If you want to remove a remote for some reason — you've moved the server or are no longer using a particular mirror, or perhaps a contributor isn't contributing anymore — you can either use `git remote remove` or `git remote rm`:

```console
$ git remote remove paul
$ git remote
origin
```

Once you delete the reference to a remote this way, all remote-tracking branches and configuration settings associated with that remote are also deleted.

## Remote Branches

> Source: [Pro Git, 2nd ed., §3.5 Remote Branches](https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches) · CC BY-NC-SA 3.0

Remote references are references (pointers) in your remote repositories, including branches, tags, and so on.
You can get a full list of remote references explicitly with `git ls-remote <remote>`, or `git remote show <remote>` for remote branches as well as more information.
Nevertheless, a more common way is to take advantage of remote-tracking branches.

Remote-tracking branches are references to the state of remote branches.
They're local references that you can't move; Git moves them for you whenever you do any network communication, to make sure they accurately represent the state of the remote repository.
Think of them as bookmarks, to remind you where the branches in your remote repositories were the last time you connected to them.

Remote-tracking branch names take the form `<remote>/<branch>`.
For instance, if you wanted to see what the `master` branch on your `origin` remote looked like as of the last time you communicated with it, you would check the `origin/master` branch.
If you were working on an issue with a partner and they pushed up an `iss53` branch, you might have your own local `iss53` branch, but the branch on the server would be represented by the remote-tracking branch `origin/iss53`.

This may be a bit confusing, so let's look at an example.
Let's say you have a Git server on your network at `git.ourcompany.com`.
If you clone from this, Git's `clone` command automatically names it `origin` for you, pulls down all its data, creates a pointer to where its `master` branch is, and names it `origin/master` locally.
Git also gives you your own local `master` branch starting at the same place as origin's `master` branch, so you have something to work from.

> **Note — "origin" is not special:**
>
> Just like the branch name "master" does not have any special meaning in Git, neither does "origin".
> While "master" is the default name for a starting branch when you run `git init` which is the only reason it's widely used, "origin" is the default name for a remote when you run `git clone`.
> If you run `git clone -o booyah` instead, then you will have `booyah/master` as your default remote branch.

If you do some work on your local `master` branch, and, in the meantime, someone else pushes to `git.ourcompany.com` and updates its `master` branch, then your histories move forward differently.
Also, as long as you stay out of contact with your `origin` server, your `origin/master` pointer doesn't move.

To synchronize your work with a given remote, you run a `git fetch <remote>` command (in our case, `git fetch origin`).
This command looks up which server "origin" is (in this case, it's `git.ourcompany.com`), fetches any data from it that you don't yet have, and updates your local database, moving your `origin/master` pointer to its new, more up-to-date position.

To demonstrate having multiple remote servers and what remote branches for those remote projects look like, let's assume you have another internal Git server that is used only for development by one of your sprint teams.
This server is at `git.team1.ourcompany.com`.
You can add it as a new remote reference to the project you're currently working on by running the `git remote add` command as we covered in "Git Basics" (Pro Git).
Name this remote `teamone`, which will be your shortname for that whole URL.

Now, you can run `git fetch teamone` to fetch everything the remote `teamone` server has that you don't have yet.
Because that server has a subset of the data your `origin` server has right now, Git fetches no data but sets a remote-tracking branch called `teamone/master` to point to the commit that `teamone` has as its `master` branch.

### Pushing

When you want to share a branch with the world, you need to push it up to a remote to which you have write access.
Your local branches aren't automatically synchronized to the remotes you write to — you have to explicitly push the branches you want to share.
That way, you can use private branches for work you don't want to share, and push up only the topic branches you want to collaborate on.

If you have a branch named `serverfix` that you want to work on with others, you can push it up the same way you pushed your first branch.
Run `git push <remote> <branch>`:

```console
$ git push origin serverfix
Counting objects: 24, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (15/15), done.
Writing objects: 100% (24/24), 1.91 KiB | 0 bytes/s, done.
Total 24 (delta 2), reused 0 (delta 0)
To https://github.com/schacon/simplegit
 * [new branch]      serverfix -> serverfix
```

This is a bit of a shortcut.
Git automatically expands the `serverfix` branchname out to `refs/heads/serverfix:refs/heads/serverfix`, which means, "Take my `serverfix` local branch and push it to update the remote's `serverfix` branch."
We'll go over the `refs/heads/` part in detail in "Git Internals" (Pro Git), but you can generally leave it off.
You can also do `git push origin serverfix:serverfix`, which does the same thing — it says, "Take my serverfix and make it the remote's serverfix."
You can use this format to push a local branch into a remote branch that is named differently.
If you didn't want it to be called `serverfix` on the remote, you could instead run `git push origin serverfix:awesomebranch` to push your local `serverfix` branch to the `awesomebranch` branch on the remote project.

> **Note — Don't type your password every time:**
>
> If you're using an HTTPS URL to push over, the Git server will ask you for your username and password for authentication.
> By default it will prompt you on the terminal for this information so the server can tell if you're allowed to push.
>
> If you don't want to type it every single time you push, you can set up a "credential cache".
> The simplest is just to keep it in memory for a few minutes, which you can easily set up by running `git config --global credential.helper cache`.
>
> For more information on the various credential caching options available, see "Credential Caching" (Pro Git).

The next time one of your collaborators fetches from the server, they will get a reference to where the server's version of `serverfix` is under the remote branch `origin/serverfix`:

```console
$ git fetch origin
remote: Counting objects: 7, done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 3 (delta 0), reused 3 (delta 0)
Unpacking objects: 100% (3/3), done.
From https://github.com/schacon/simplegit
 * [new branch]      serverfix    -> origin/serverfix
```

It's important to note that when you do a fetch that brings down new remote-tracking branches, you don't automatically have local, editable copies of them.
In other words, in this case, you don't have a new `serverfix` branch — you have only an `origin/serverfix` pointer that you can't modify.

To merge this work into your current working branch, you can run `git merge origin/serverfix`.
If you want your own `serverfix` branch that you can work on, you can base it off your remote-tracking branch:

```console
$ git checkout -b serverfix origin/serverfix
Branch serverfix set up to track remote branch serverfix from origin.
Switched to a new branch 'serverfix'
```

This gives you a local branch that you can work on that starts where `origin/serverfix` is.

### Tracking Branches

Checking out a local branch from a remote-tracking branch automatically creates what is called a "tracking branch" (and the branch it tracks is called an "upstream branch").
Tracking branches are local branches that have a direct relationship to a remote branch.
If you're on a tracking branch and type `git pull`, Git automatically knows which server to fetch from and which branch to merge in.

When you clone a repository, it generally automatically creates a `master` branch that tracks `origin/master`.
However, you can set up other tracking branches if you wish — ones that track branches on other remotes, or don't track the `master` branch.
The simple case is the example you just saw, running `git checkout -b <branch> <remote>/<branch>`.
This is a common enough operation that Git provides the `--track` shorthand:

```console
$ git checkout --track origin/serverfix
Branch serverfix set up to track remote branch serverfix from origin.
Switched to a new branch 'serverfix'
```

In fact, this is so common that there's even a shortcut for that shortcut.
If the branch name you're trying to checkout (a) doesn't exist and (b) exactly matches a name on only one remote, Git will create a tracking branch for you:

```console
$ git checkout serverfix
Branch serverfix set up to track remote branch serverfix from origin.
Switched to a new branch 'serverfix'
```

To set up a local branch with a different name than the remote branch, you can easily use the first version with a different local branch name:

```console
$ git checkout -b sf origin/serverfix
Branch sf set up to track remote branch serverfix from origin.
Switched to a new branch 'sf'
```

Now, your local branch `sf` will automatically pull from `origin/serverfix`.

If you already have a local branch and want to set it to a remote branch you just pulled down, or want to change the upstream branch you're tracking, you can use the `-u` or `--set-upstream-to` option to `git branch` to explicitly set it at any time.

```console
$ git branch -u origin/serverfix
Branch serverfix set up to track remote branch serverfix from origin.
```

> **Note — Upstream shorthand:**
>
> When you have a tracking branch set up, you can reference its upstream branch with the `@{upstream}` or `@{u}` shorthand.
> So if you're on the `master` branch and it's tracking `origin/master`, you can say something like `git merge @{u}` instead of `git merge origin/master` if you wish.

If you want to see what tracking branches you have set up, you can use the `-vv` option to `git branch`.
This will list out your local branches with more information including what each branch is tracking and if your local branch is ahead, behind or both.

```console
$ git branch -vv
  iss53     7e424c3 [origin/iss53: ahead 2] Add forgotten brackets
  master    1ae2a45 [origin/master] Deploy index fix
* serverfix f8674d9 [teamone/server-fix-good: ahead 3, behind 1] This should do it
  testing   5ea463a Try something new
```

So here we can see that our `iss53` branch is tracking `origin/iss53` and is "ahead" by two, meaning that we have two commits locally that are not pushed to the server.
We can also see that our `master` branch is tracking `origin/master` and is up to date.
Next we can see that our `serverfix` branch is tracking the `server-fix-good` branch on our `teamone` server and is ahead by three and behind by one, meaning that there is one commit on the server we haven't merged in yet and three commits locally that we haven't pushed.
Finally we can see that our `testing` branch is not tracking any remote branch.

It's important to note that these numbers are only since the last time you fetched from each server.
This command does not reach out to the servers, it's telling you about what it has cached from these servers locally.
If you want totally up to date ahead and behind numbers, you'll need to fetch from all your remotes right before running this.
You could do that like this:

```console
$ git fetch --all; git branch -vv
```

### Pulling

While the `git fetch` command will fetch all the changes on the server that you don't have yet, it will not modify your working directory at all.
It will simply get the data for you and let you merge it yourself.
However, there is a command called `git pull` which is essentially a `git fetch` immediately followed by a `git merge` in most cases.
If you have a tracking branch set up as demonstrated in the last section, either by explicitly setting it or by having it created for you by the `clone` or `checkout` commands, `git pull` will look up what server and branch your current branch is tracking, fetch from that server and then try to merge in that remote branch.

### Deleting Remote Branches

Suppose you're done with a remote branch — say you and your collaborators are finished with a feature and have merged it into your remote's `master` branch (or whatever branch your stable codeline is in).
You can delete a remote branch using the `--delete` option to `git push`.
If you want to delete your `serverfix` branch from the server, you run the following:

```console
$ git push origin --delete serverfix
To https://github.com/schacon/simplegit
 - [deleted]         serverfix
```

Basically all this does is to remove the pointer from the server.
The Git server will generally keep the data there for a while until a garbage collection runs, so if it was accidentally deleted, it's often easy to recover.
