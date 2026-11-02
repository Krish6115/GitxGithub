# Git hooks

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [Pro Git, 2nd ed., §8.3 Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)
> - [Git documentation: githooks](https://git-scm.com/docs/githooks) · The Git Project, Git documentation · [GPL-2.0](https://github.com/git/git/blob/master/COPYING)

## Git Hooks

> Source: [Pro Git, 2nd ed., §8.3 Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) · CC BY-NC-SA 3.0

Like many other Version Control Systems, Git has a way to fire off custom scripts when certain important actions occur.
There are two groups of these hooks: client-side and server-side.
Client-side hooks are triggered by operations such as committing and merging, while server-side hooks run on network operations such as receiving pushed commits.
You can use these hooks for all sorts of reasons.

### Installing a Hook

The hooks are all stored in the `hooks` subdirectory of the Git directory.
In most projects, that's `.git/hooks`.
When you initialize a new repository with `git init`, Git populates the hooks directory with a bunch of example scripts, many of which are useful by themselves; but they also document the input values of each script.
All the examples are written as shell scripts, with some Perl thrown in, but any properly named executable scripts will work fine – you can write them in Ruby or Python or whatever language you are familiar with.
If you want to use the bundled hook scripts, you'll have to rename them; their file names all end with `.sample`.

To enable a hook script, put a file in the `hooks` subdirectory of your `.git` directory that is named appropriately (without any extension) and is executable.
From that point forward, it should be called.
We'll cover most of the major hook filenames here.

### Client-Side Hooks

There are a lot of client-side hooks.
This section splits them into committing-workflow hooks, email-workflow scripts, and everything else.

> **Note:**
>
> It's important to note that client-side hooks are **not** copied when you clone a repository.
> If your intent with these scripts is to enforce a policy, you'll probably want to do that on the server side; see the example in "An Example Git Enforced Policy" (Pro Git).

#### Committing-Workflow Hooks

The first four hooks have to do with the committing process.

The `pre-commit` hook is run first, before you even type in a commit message.
It's used to inspect the snapshot that's about to be committed, to see if you've forgotten something, to make sure tests run, or to examine whatever you need to inspect in the code.
Exiting non-zero from this hook aborts the commit, although you can bypass it with `git commit --no-verify`.
You can do things like check for code style (run `lint` or something equivalent), check for trailing whitespace (the default hook does exactly this), or check for appropriate documentation on new methods.

The `prepare-commit-msg` hook is run before the commit message editor is fired up but after the default message is created.
It lets you edit the default message before the commit author sees it.
This hook takes a few parameters: the path to the file that holds the commit message so far, the type of commit, and the commit SHA-1 if this is an amended commit.
This hook generally isn't useful for normal commits; rather, it's good for commits where the default message is auto-generated, such as templated commit messages, merge commits, squashed commits, and amended commits.
You may use it in conjunction with a commit template to programmatically insert information.

The `commit-msg` hook takes one parameter, which again is the path to a temporary file that contains the commit message written by the developer.
If this script exits non-zero, Git aborts the commit process, so you can use it to validate your project state or commit message before allowing a commit to go through.
In the last section of this chapter, we'll demonstrate using this hook to check that your commit message is conformant to a required pattern.

After the entire commit process is completed, the `post-commit` hook runs.
It doesn't take any parameters, but you can easily get the last commit by running `git log -1 HEAD`.
Generally, this script is used for notification or something similar.

#### Email Workflow Hooks

You can set up three client-side hooks for an email-based workflow.
They're all invoked by the `git am` command, so if you aren't using that command in your workflow, you can safely skip to the next section.
If you're taking patches over email prepared by `git format-patch`, then some of these may be helpful to you.

The first hook that is run is `applypatch-msg`.
It takes a single argument: the name of the temporary file that contains the proposed commit message.
Git aborts the patch if this script exits non-zero.
You can use this to make sure a commit message is properly formatted, or to normalize the message by having the script edit it in place.

The next hook to run when applying patches via `git am` is `pre-applypatch`.
Somewhat confusingly, it is run _after_ the patch is applied but before a commit is made, so you can use it to inspect the snapshot before making the commit.
You can run tests or otherwise inspect the working tree with this script.
If something is missing or the tests don't pass, exiting non-zero aborts the `git am` script without committing the patch.

The last hook to run during a `git am` operation is `post-applypatch`, which runs after the commit is made.
You can use it to notify a group or the author of the patch you pulled in that you've done so.
You can't stop the patching process with this script.

#### Other Client Hooks

The `pre-rebase` hook runs before you rebase anything and can halt the process by exiting non-zero.
You can use this hook to disallow rebasing any commits that have already been pushed.
The example `pre-rebase` hook that Git installs does this, although it makes some assumptions that may not match with your workflow.

The `post-rewrite` hook is run by commands that replace commits, such as `git commit --amend` and `git rebase` (though not by `git filter-branch`).
Its single argument is which command triggered the rewrite, and it receives a list of rewrites on `stdin`.
This hook has many of the same uses as the `post-checkout` and `post-merge` hooks.

After you run a successful `git checkout`, the `post-checkout` hook runs; you can use it to set up your working directory properly for your project environment.
This may mean moving in large binary files that you don't want source controlled, auto-generating documentation, or something along those lines.

The `post-merge` hook runs after a successful `merge` command.
You can use it to restore data in the working tree that Git can't track, such as permissions data.
This hook can likewise validate the presence of files external to Git control that you may want copied in when the working tree changes.

The `pre-push` hook runs during `git push`, after the remote refs have been updated but before any objects have been transferred.
It receives the name and location of the remote as parameters, and a list of to-be-updated refs through `stdin`.
You can use it to validate a set of ref updates before a push occurs (a non-zero exit code will abort the push).

Git occasionally does garbage collection as part of its normal operation, by invoking `git gc --auto`.
The `pre-auto-gc` hook is invoked just before the garbage collection takes place, and can be used to notify you that this is happening, or to abort the collection if now isn't a good time.

### Server-Side Hooks

In addition to the client-side hooks, you can use a couple of important server-side hooks as a system administrator to enforce nearly any kind of policy for your project.
These scripts run before and after pushes to the server.
The pre hooks can exit non-zero at any time to reject the push as well as print an error message back to the client; you can set up a push policy that's as complex as you wish.

#### `pre-receive`

The first script to run when handling a push from a client is `pre-receive`.
It takes a list of references that are being pushed from stdin; if it exits non-zero, none of them are accepted.
You can use this hook to do things like make sure none of the updated references are non-fast-forwards, or to do access control for all the refs and files they're modifying with the push.

#### `update`

The `update` script is very similar to the `pre-receive` script, except that it's run once for each branch the pusher is trying to update.
If the pusher is trying to push to multiple branches, `pre-receive` runs only once, whereas `update` runs once per branch they're pushing to.
Instead of reading from stdin, this script takes three arguments: the name of the reference (branch), the SHA-1 that reference pointed to before the push, and the SHA-1 the user is trying to push.
If the `update` script exits non-zero, only that reference is rejected; other references can still be updated.

#### `post-receive`

The `post-receive` hook runs after the entire process is completed and can be used to update other services or notify users.
It takes the same stdin data as the `pre-receive` hook.
Examples include emailing a list, notifying a continuous integration server, or updating a ticket-tracking system – you can even parse the commit messages to see if any tickets need to be opened, modified, or closed.
This script can't stop the push process, but the client doesn't disconnect until it has completed, so be careful if you try to do anything that may take a long time.

> **Tip:**
>
> If you're writing a script/hook that others will need to read, prefer the long versions of command-line flags; six months from now you'll thank us.

## `githooks` manual (excerpt)

> Source: [Git documentation: githooks](https://git-scm.com/docs/githooks) · GPL-2.0

### Description

Hooks are programs you can place in a hooks directory to trigger
actions at certain points in git's execution. Hooks that don't have
the executable bit set are ignored.

By default the hooks directory is `$GIT_DIR/hooks`, but that can be
changed via the `core.hooksPath` configuration variable (see
`git config`).

Before Git invokes a hook, it changes its working directory to either
$GIT_DIR in a bare repository or the root of the working tree in a non-bare
repository. An exception are hooks triggered during a push (_pre-receive_,
_update_, _post-receive_, _post-update_, _push-to-checkout_) which are always
executed in $GIT_DIR.

Environment variables, such as `GIT_DIR`, `GIT_WORK_TREE`, etc., are exported
so that Git commands run by the hook can correctly locate the repository.  If
your hook needs to invoke Git commands in a foreign repository or in a
different working tree of the same repository, then it should clear these
environment variables so they do not interfere with Git operations at the
foreign location.  For example:

```
local_desc=$(git describe)
foreign_desc=$(unset $(git rev-parse --local-env-vars); git -C ../foreign-repo describe)
```

Hooks can get their arguments via the environment, command-line
arguments, and stdin. See the documentation for each hook below for
details.

`git init` may copy hooks to the new repository, depending on its
configuration. See the "TEMPLATE DIRECTORY" section in
`git init` for details. When the rest of this document refers
to "default hooks" it's talking about the default template shipped
with Git.

The currently supported hooks are described below.

#### pre-commit

This hook is invoked by `git commit`, and can be bypassed
with the `--no-verify` option.  It takes no parameters, and is
invoked before obtaining the proposed commit log message and
making a commit.  Exiting with a non-zero status from this script
causes the `git commit` command to abort before creating a commit.

All the `git commit` hooks are invoked with the environment
variable `GIT_EDITOR=:` if the command will not bring up an editor
to modify the commit message.

The default _pre-commit_ hook, when enabled, prevents the introduction
of non-ASCII filenames and lines with trailing whitespace. The non-ASCII
check can be turned off by setting the `hooks.allownonascii` config
option to `true`.

#### prepare-commit-msg

This hook is invoked by `git commit` right after preparing the
default log message, and before the editor is started.

It takes one to three parameters.  The first is the name of the file
that contains the commit log message.  The second is the source of the commit
message, and can be: `message` (if a `-m` or `-F` option was
given); `template` (if a `-t` option was given or the
configuration option `commit.template` is set); `merge` (if the
commit is a merge or a `.git/MERGE_MSG` file exists); `squash`
(if a `.git/SQUASH_MSG` file exists); or `commit`, followed by
a commit object name (if a `-c`, `-C` or `--amend` option was given).

If the exit status is non-zero, `git commit` will abort.

The purpose of the hook is to edit the message file in place, and
it is not suppressed by the `--no-verify` option.  A non-zero exit
means a failure of the hook and aborts the commit.  It should not
be used as a replacement for the pre-commit hook.

The sample `prepare-commit-msg` hook that comes with Git removes the
help message found in the commented portion of the commit template.

#### commit-msg

This hook is invoked by `git commit` and `git merge`, and can be
bypassed with the `--no-verify` option.  It takes a single parameter,
the name of the file that holds the proposed commit log message.
Exiting with a non-zero status causes the command to abort.

The hook is allowed to edit the message file in place, and can be used
to normalize the message into some project standard format. It
can also be used to refuse the commit after inspecting the message
file.

The default _commit-msg_ hook, when enabled, detects duplicate
`Signed-off-by` trailers, and aborts the commit if one is found.

#### post-commit

This hook is invoked by `git commit`. It takes no parameters, and is
invoked after a commit is made.

This hook is meant primarily for notification, and cannot affect
the outcome of `git commit`.

#### pre-rebase

This hook is called by `git rebase` and can be used to prevent a
branch from getting rebased.  The hook may be called with one or
two parameters.  The first parameter is the upstream from which
the series was forked.  The second parameter is the branch being
rebased, and is not set when rebasing the current branch.

#### post-checkout

This hook is invoked when a `git checkout` or
`git switch` is run after having updated the
worktree.  The hook is given three parameters: the ref of the previous HEAD,
the ref of the new HEAD (which may or may not have changed), and a flag
indicating whether the checkout was a branch checkout (changing branches,
flag=1) or a file checkout (retrieving a file from the index, flag=0).
This hook cannot affect the outcome of `git switch` or `git checkout`,
other than that the hook's exit status becomes the exit status of
these two commands.

It is also run after `git clone`, unless the `--no-checkout` (`-n`) option is
used. The first parameter given to the hook is the null-ref, the second the
ref of the new HEAD and the flag is always 1. Likewise for `git worktree add`
unless `--no-checkout` is used.

This hook can be used to perform repository validity checks, auto-display
differences from the previous HEAD if different, or set working dir metadata
properties.

#### post-merge

This hook is invoked by `git merge`, which happens when a `git pull`
is done on a local repository.  The hook takes a single parameter, a status
flag specifying whether or not the merge being done was a squash merge.
This hook cannot affect the outcome of `git merge` and is not executed,
if the merge failed due to conflicts.

This hook can be used in conjunction with a corresponding pre-commit hook to
save and restore any form of metadata associated with the working tree
(e.g.: permissions/ownership, ACLS, etc).  See contrib/hooks/setgitperms.perl
for an example of how to do this.

#### pre-push

This hook is called by `git push` and can be used to prevent
a push from taking place.  The hook is called with two parameters
which provide the name and location of the destination remote, if a
named remote is not being used both values will be the same.

Information about what is to be pushed is provided on the hook's standard
input with lines of the form:

  <local-ref> SP <local-object-name> SP <remote-ref> SP <remote-object-name> LF

For instance, if the command `git push origin master:foreign` were run the
hook would receive a line like the following:

  refs/heads/master 67890 refs/heads/foreign 12345

although the full object name would be supplied.  If the foreign ref does not
yet exist the `<remote-object-name>` will be the all-zeroes object name.  If a
ref is to be deleted, the `<local-ref>` will be supplied as `(delete)` and the
`<local-object-name>` will be the all-zeroes object name.  If the local commit
was specified by something other than a name which could be expanded (such as
`HEAD~`, or an object name) it will be supplied as it was originally given.

If this hook exits with a non-zero status, `git push` will abort without
pushing anything.  Information about why the push is rejected may be sent
to the user by writing to standard error.

#### pre-receive

This hook is invoked by `git receive-pack` when it reacts to
`git push` and updates reference(s) in its repository.
Just before starting to update refs on the remote repository, the
pre-receive hook is invoked.  Its exit status determines the success
or failure of the update.

This hook executes once for the receive operation. It takes no
arguments, but for each ref to be updated it receives on standard
input a line of the format:

  <old-oid> SP <new-oid> SP <ref-name> LF

where `<old-oid>` is the old object name stored in the ref,
`<new-oid>` is the new object name to be stored in the ref and
`<ref-name>` is the full name of the ref.
When creating a new ref, `<old-oid>` is the all-zeroes object name.

If the hook exits with non-zero status, none of the refs will be
updated. If the hook exits with zero, updating of individual refs can
still be prevented by the _update_ hook.

Both standard output and standard error output are forwarded to
`git send-pack` on the other end, so you can simply `echo` messages
for the user.

The number of push options given on the command line of
`git push --push-option=...` can be read from the environment
variable `GIT_PUSH_OPTION_COUNT`, and the options themselves are
found in `GIT_PUSH_OPTION_0`, `GIT_PUSH_OPTION_1`,...
If it is negotiated to not use the push options phase, the
environment variables will not be set. If the client selects
to use push options, but doesn't transmit any, the count variable
will be set to zero, `GIT_PUSH_OPTION_COUNT=0`.

See the section on "Quarantine Environment" in
`git receive-pack` for some caveats.

#### update

This hook is invoked by `git receive-pack` when it reacts to
`git push` and updates reference(s) in its repository.
Just before updating the ref on the remote repository, the update hook
is invoked.  Its exit status determines the success or failure of
the ref update.

The hook executes once for each ref to be updated, and takes
three parameters:

 - the name of the ref being updated,
 - the old object name stored in the ref,
 - and the new object name to be stored in the ref.

A zero exit from the update hook allows the ref to be updated.
Exiting with a non-zero status prevents `git receive-pack`
from updating that ref.

This hook can be used to prevent _forced_ update on certain refs by
making sure that the object name is a commit object that is a
descendant of the commit object named by the old object name.
That is, to enforce a "fast-forward only" policy.

It could also be used to log the old..new status.  However, it
does not know the entire set of branches, so it would end up
firing one e-mail per ref when used naively, though.  The
_post-receive_ hook is more suited to that.

In an environment that restricts the users' access only to git
commands over the wire, this hook can be used to implement access
control without relying on filesystem ownership and group
membership. See `git shell` for how you might use the login
shell to restrict the user's access to only git commands.

Both standard output and standard error output are forwarded to
`git send-pack` on the other end, so you can simply `echo` messages
for the user.

The default _update_ hook, when enabled--and with
`hooks.allowunannotated` config option unset or set to false--prevents
unannotated tags from being pushed.

#### post-receive

This hook is invoked by `git receive-pack` when it reacts to
`git push` and updates reference(s) in its repository.
The hook executes on the remote repository once after all the proposed
ref updates are processed and if at least one ref is updated as the
result.

The hook takes no arguments.  It receives one line on standard input for
each ref that is successfully updated following the same format as the
_pre-receive_ hook.

This hook does not affect the outcome of `git receive-pack`, as it
is called after the real work is done.

This supersedes the _post-update_ hook in that it gets
both old and new values of all the refs in addition to their
names.

Both standard output and standard error output are forwarded to
`git send-pack` on the other end, so you can simply `echo` messages
for the user.

The default _post-receive_ hook is empty, but there is
a sample script `post-receive-email` provided in the `contrib/hooks`
directory in Git distribution, which implements sending commit
emails.

The number of push options given on the command line of
`git push --push-option=...` can be read from the environment
variable `GIT_PUSH_OPTION_COUNT`, and the options themselves are
found in `GIT_PUSH_OPTION_0`, `GIT_PUSH_OPTION_1`,...
If it is negotiated to not use the push options phase, the
environment variables will not be set. If the client selects
to use push options, but doesn't transmit any, the count variable
will be set to zero, `GIT_PUSH_OPTION_COUNT=0`.

See the "post-receive" section in `git receive-pack` for
additional details.
