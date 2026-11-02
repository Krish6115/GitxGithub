# Advanced merging and conflict resolution

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [Pro Git, 2nd ed., §7.8 Advanced Merging](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)
> - [Pro Git, 2nd ed., §7.9 Rerere](https://git-scm.com/book/en/v2/Git-Tools-Rerere) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)
> - [Git documentation: git-merge](https://git-scm.com/docs/git-merge) · The Git Project, Git documentation · [GPL-2.0](https://github.com/git/git/blob/master/COPYING)

## Advanced Merging

> Source: [Pro Git, 2nd ed., §7.8 Advanced Merging](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging) · CC BY-NC-SA 3.0

Merging in Git is typically fairly easy.
Since Git makes it easy to merge another branch multiple times, it means that you can have a very long lived branch but you can keep it up to date as you go, solving small conflicts often, rather than be surprised by one enormous conflict at the end of the series.

However, sometimes tricky conflicts do occur.
Unlike some other version control systems, Git does not try to be overly clever about merge conflict resolution.
Git's philosophy is to be smart about determining when a merge resolution is unambiguous, but if there is a conflict, it does not try to be clever about automatically resolving it.
Therefore, if you wait too long to merge two branches that diverge quickly, you can run into some issues.

In this section, we'll go over what some of those issues might be and what tools Git gives you to help handle these more tricky situations.
We'll also cover some of the different, non-standard types of merges you can do, as well as see how to back out of merges that you've done.

### Merge Conflicts

While we covered some basics on resolving merge conflicts in "Basic Merge Conflicts" (Pro Git), for more complex conflicts, Git provides a few tools to help you figure out what's going on and how to better deal with the conflict.

First of all, if at all possible, try to make sure your working directory is clean before doing a merge that may have conflicts.
If you have work in progress, either commit it to a temporary branch or stash it.
This makes it so that you can undo **anything** you try here.
If you have unsaved changes in your working directory when you try a merge, some of these tips may help you preserve that work.

Let's walk through a very simple example.
We have a super simple Ruby file that prints _hello world_.

```ruby
#! /usr/bin/env ruby

def hello
  puts 'hello world'
end

hello()
```

In our repository, we create a new branch named `whitespace` and proceed to change all the Unix line endings to DOS line endings, essentially changing every line of the file, but just with whitespace.
Then we change the line "hello world" to "hello mundo".

```console
$ git checkout -b whitespace
Switched to a new branch 'whitespace'

$ unix2dos hello.rb
unix2dos: converting file hello.rb to DOS format ...
$ git commit -am 'Convert hello.rb to DOS'
[whitespace 3270f76] Convert hello.rb to DOS
 1 file changed, 7 insertions(+), 7 deletions(-)

$ vim hello.rb
$ git diff -b
diff --git a/hello.rb b/hello.rb
index ac51efd..e85207e 100755
--- a/hello.rb
+++ b/hello.rb
@@ -1,7 +1,7 @@
 #! /usr/bin/env ruby

 def hello
-  puts 'hello world'
+  puts 'hello mundo'^M
 end

 hello()

$ git commit -am 'Use Spanish instead of English'
[whitespace 6d338d2] Use Spanish instead of English
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Now we switch back to our `master` branch and add some documentation for the function.

```console
$ git checkout master
Switched to branch 'master'

$ vim hello.rb
$ git diff
diff --git a/hello.rb b/hello.rb
index ac51efd..36c06c8 100755
--- a/hello.rb
+++ b/hello.rb
@@ -1,5 +1,6 @@
 #! /usr/bin/env ruby

+# prints out a greeting
 def hello
   puts 'hello world'
 end

$ git commit -am 'Add comment documenting the function'
[master bec6336] Add comment documenting the function
 1 file changed, 1 insertion(+)
```

Now we try to merge in our `whitespace` branch and we'll get conflicts because of the whitespace changes.

```console
$ git merge whitespace
Auto-merging hello.rb
CONFLICT (content): Merge conflict in hello.rb
Automatic merge failed; fix conflicts and then commit the result.
```

#### Aborting a Merge

We now have a few options.
First, let's cover how to get out of this situation.
If you perhaps weren't expecting conflicts and don't want to quite deal with the situation yet, you can simply back out of the merge with `git merge --abort`.

```console
$ git status -sb
## master
UU hello.rb

$ git merge --abort

$ git status -sb
## master
```

The `git merge --abort` option tries to revert back to your state before you ran the merge.
The only cases where it may not be able to do this perfectly would be if you had unstashed, uncommitted changes in your working directory when you ran it, otherwise it should work fine.

If for some reason you just want to start over, you can also run `git reset --hard HEAD`, and your repository will be back to the last committed state.
Remember that any uncommitted work will be lost, so make sure you don't want any of your changes.

#### Ignoring Whitespace

In this specific case, the conflicts are whitespace related.
We know this because the case is simple, but it's also pretty easy to tell in real cases when looking at the conflict because every line is removed on one side and added again on the other.
By default, Git sees all of these lines as being changed, so it can't merge the files.

The default merge strategy can take arguments though, and a few of them are about properly ignoring whitespace changes.
If you see that you have a lot of whitespace issues in a merge, you can simply abort it and do it again, this time with `-Xignore-all-space` or `-Xignore-space-change`.
The first option ignores whitespace **completely** when comparing lines, the second treats sequences of one or more whitespace characters as equivalent.

```console
$ git merge -Xignore-space-change whitespace
Auto-merging hello.rb
Merge made by the 'recursive' strategy.
 hello.rb | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Since in this case, the actual file changes were not conflicting, once we ignore the whitespace changes, everything merges just fine.

This is a lifesaver if you have someone on your team who likes to occasionally reformat everything from spaces to tabs or vice-versa.

#### Checking Out Conflicts

Perhaps we're not happy with the resolution at this point for some reason, or maybe manually editing one or both sides still didn't work well and we need more context.

Let's change up the example a little.
For this example, we have two longer lived branches that each have a few commits in them but create a legitimate content conflict when merged.

```console
$ git log --graph --oneline --decorate --all
* f1270f7 (HEAD, master) Update README
* 9af9d3b Create README
* 694971d Update phrase to 'hola world'
| * e3eb223 (mundo) Add more tests
| * 7cff591 Create initial testing script
| * c3ffff1 Change text to 'hello mundo'
|/
* b7dcc89 Initial hello world code
```

We now have three unique commits that live only on the `master` branch and three others that live on the `mundo` branch.
If we try to merge the `mundo` branch in, we get a conflict.

```console
$ git merge mundo
Auto-merging hello.rb
CONFLICT (content): Merge conflict in hello.rb
Automatic merge failed; fix conflicts and then commit the result.
```

We would like to see what the merge conflict is.
If we open up the file, we'll see something like this:

```ruby
#! /usr/bin/env ruby

def hello
<<<<<<< HEAD
  puts 'hola world'
=======
  puts 'hello mundo'
>>>>>>> mundo
end

hello()
```

Both sides of the merge added content to this file, but some of the commits modified the file in the same place that caused this conflict.

Let's explore a couple of tools that you now have at your disposal to determine how this conflict came to be.
Perhaps it's not obvious how exactly you should fix this conflict.
You need more context.

One helpful tool is `git checkout` with the `--conflict` option.
This will re-checkout the file again and replace the merge conflict markers.
This can be useful if you want to reset the markers and try to resolve them again.

You can pass `--conflict` either `diff3` or `merge` (which is the default).
If you pass it `diff3`, Git will use a slightly different version of conflict markers, not only giving you the "ours" and "theirs" versions, but also the "base" version inline to give you more context.

```console
$ git checkout --conflict=diff3 hello.rb
```

Once we run that, the file will look like this instead:

```ruby
#! /usr/bin/env ruby

def hello
<<<<<<< ours
  puts 'hola world'
||||||| base
  puts 'hello world'
=======
  puts 'hello mundo'
>>>>>>> theirs
end

hello()
```

If you like this format, you can set it as the default for future merge conflicts by setting the `merge.conflictstyle` setting to `diff3`.

```console
$ git config --global merge.conflictstyle diff3
```

The `git checkout` command can also take `--ours` and `--theirs` options, which can be a really fast way of just choosing either one side or the other without merging things at all.

This can be particularly useful for conflicts of binary files where you can simply choose one side, or where you only want to merge certain files in from another branch — you can do the merge and then checkout certain files from one side or the other before committing.

### Undoing Merges

Now that you know how to create a merge commit, you'll probably make some by mistake.
One of the great things about working with Git is that it's okay to make mistakes, because it's possible (and in many cases easy) to fix them.

Merge commits are no different.
Let's say you started work on a topic branch, accidentally merged it into `master`, and now your commit history looks like this:

There are two ways to approach this problem, depending on what your desired outcome is.

#### Fix the references

If the unwanted merge commit only exists on your local repository, the easiest and best solution is to move the branches so that they point where you want them to.
In most cases, if you follow the errant `git merge` with `git reset --hard HEAD~`, this will reset the branch pointers so they look like this:

We covered `reset` back in "Git Reset" (Pro Git), so it shouldn't be too hard to figure out what's going on here.
Here's a quick refresher: `reset --hard` usually goes through three steps:

1. Move the branch HEAD points to.
  In this case, we want to move `master` to where it was before the merge commit (`C6`).
1. Make the index look like HEAD.
1. Make the working directory look like the index.

The downside of this approach is that it's rewriting history, which can be problematic with a shared repository.
Check out "Rebase Peril" (Pro Git) for more on what can happen; the short version is that if other people have the commits you're rewriting, you should probably avoid `reset`.
This approach also won't work if any other commits have been created since the merge; moving the refs would effectively lose those changes.

#### Reverse the commit

If moving the branch pointers around isn't going to work for you, Git gives you the option of making a new commit which undoes all the changes from an existing one.
Git calls this operation a "revert", and in this particular scenario, you'd invoke it like this:

```console
$ git revert -m 1 HEAD
[master b1d8379] Revert "Merge branch 'topic'"
```

The `-m 1` flag indicates which parent is the "mainline" and should be kept.
When you invoke a merge into `HEAD` (`git merge topic`), the new commit has two parents: the first one is `HEAD` (`C6`), and the second is the tip of the branch being merged in (`C4`).
In this case, we want to undo all the changes introduced by merging in parent #2 (`C4`), while keeping all the content from parent #1 (`C6`).

The history with the revert commit looks like this:

The new commit `^M` has exactly the same contents as `C6`, so starting from here it's as if the merge never happened, except that the now-unmerged commits are still in ``HEAD```'s history.
Git will get confused if you try to merge ``topic`` into ``master`` again:

```console
$ git merge topic
Already up-to-date.
```

There's nothing in `topic` that isn't already reachable from `master`.
What's worse, if you add work to `topic` and merge again, Git will only bring in the changes _since_ the reverted merge:

The best way around this is to un-revert the original merge, since now you want to bring in the changes that were reverted out, **then** create a new merge commit:

```console
$ git revert ^M
[master 09f0126] Revert "Revert "Merge branch 'topic'""
$ git merge topic
```

In this example, `M` and `^M` cancel out.
`^^M` effectively merges in the changes from `C3` and `C4`, and `C8` merges in the changes from `C7`, so now `topic` is fully merged.

### Other Types of Merges

So far we've covered the normal merge of two branches, normally handled with what is called the "recursive" strategy of merging.
There are other ways to merge branches together however.
Let's cover a few of them quickly.

#### Our or Theirs Preference

First of all, there is another useful thing we can do with the normal "recursive" mode of merging.
We've already seen the `ignore-all-space` and `ignore-space-change` options which are passed with a `-X` but we can also tell Git to favor one side or the other when it sees a conflict.

By default, when Git sees a conflict between two branches being merged, it will add merge conflict markers into your code and mark the file as conflicted and let you resolve it.
If you would prefer for Git to simply choose a specific side and ignore the other side instead of letting you manually resolve the conflict, you can pass the `merge` command either a `-Xours` or `-Xtheirs`.

If Git sees this, it will not add conflict markers.
Any differences that are mergeable, it will merge.
Any differences that conflict, it will simply choose the side you specify in whole, including binary files.

If we go back to the "hello world" example we were using before, we can see that merging in our branch causes conflicts.

```console
$ git merge mundo
Auto-merging hello.rb
CONFLICT (content): Merge conflict in hello.rb
Resolved 'hello.rb' using previous resolution.
Automatic merge failed; fix conflicts and then commit the result.
```

However if we run it with `-Xours` or `-Xtheirs` it does not.

```console
$ git merge -Xours mundo
Auto-merging hello.rb
Merge made by the 'recursive' strategy.
 hello.rb | 2 +-
 test.sh  | 2 ++
 2 files changed, 3 insertions(+), 1 deletion(-)
 create mode 100644 test.sh
```

In that case, instead of getting conflict markers in the file with "hello mundo" on one side and "hola world" on the other, it will simply pick "hola world".
However, all the other non-conflicting changes on that branch are merged successfully in.

This option can also be passed to the `git merge-file` command we saw earlier by running something like `git merge-file --ours` for individual file merges.

If you want to do something like this but not have Git even try to merge changes from the other side in, there is a more draconian option, which is the "ours" merge _strategy_.
This is different from the "ours" recursive merge _option_.

This will basically do a fake merge.
It will record a new merge commit with both branches as parents, but it will not even look at the branch you're merging in.
It will simply record as the result of the merge the exact code in your current branch.

```console
$ git merge -s ours mundo
Merge made by the 'ours' strategy.
$ git diff HEAD HEAD~
$
```

You can see that there is no difference between the branch we were on and the result of the merge.

This can often be useful to basically trick Git into thinking that a branch is already merged when doing a merge later on.
For example, say you branched off a `release` branch and have done some work on it that you will want to merge back into your `master` branch at some point.
In the meantime some bugfix on `master` needs to be backported into your `release` branch.
You can merge the bugfix branch into the `release` branch and also `merge -s ours` the same branch into your `master` branch (even though the fix is already there) so when you later merge the `release` branch again, there are no conflicts from the bugfix.

## Rerere

> Source: [Pro Git, 2nd ed., §7.9 Rerere](https://git-scm.com/book/en/v2/Git-Tools-Rerere) · CC BY-NC-SA 3.0

The `git rerere` functionality is a bit of a hidden feature.
The name stands for "reuse recorded resolution" and, as the name implies, it allows you to ask Git to remember how you've resolved a hunk conflict so that the next time it sees the same conflict, Git can resolve it for you automatically.

There are a number of scenarios in which this functionality might be really handy.
One of the examples that is mentioned in the documentation is when you want to make sure a long-lived topic branch will ultimately merge cleanly, but you don't want to have a bunch of intermediate merge commits cluttering up your commit history.
With `rerere` enabled, you can attempt the occasional merge, resolve the conflicts, then back out of the merge.
If you do this continuously, then the final merge should be easy because `rerere` can just do everything for you automatically.

This same tactic can be used if you want to keep a branch rebased so you don't have to deal with the same rebasing conflicts each time you do it.
Or if you want to take a branch that you merged and fixed a bunch of conflicts and then decide to rebase it instead — you likely won't have to do all the same conflicts again.

Another application of `rerere` is where you merge a bunch of evolving topic branches together into a testable head occasionally, as the Git project itself often does.
If the tests fail, you can rewind the merges and re-do them without the topic branch that made the tests fail without having to re-resolve the conflicts again.

To enable `rerere` functionality, you simply have to run this config setting:

```console
$ git config --global rerere.enabled true
```

You can also turn it on by creating the `.git/rr-cache` directory in a specific repository, but the config setting is clearer and enables that feature globally for you.

Now let's see a simple example, similar to our previous one.
Let's say we have a file named `hello.rb` that looks like this:

```ruby
#! /usr/bin/env ruby

def hello
  puts 'hello world'
end
```

In one branch we change the word "hello" to "hola", then in another branch we change the "world" to "mundo", just like before.

When we merge the two branches together, we'll get a merge conflict:

```console
$ git merge i18n-world
Auto-merging hello.rb
CONFLICT (content): Merge conflict in hello.rb
Recorded preimage for 'hello.rb'
Automatic merge failed; fix conflicts and then commit the result.
```

You should notice the new line `Recorded preimage for FILE` in there.
Otherwise it should look exactly like a normal merge conflict.
At this point, `rerere` can tell us a few things.
Normally, you might run `git status` at this point to see what all conflicted:

```console
$ git status
# On branch master
# Unmerged paths:
#   (use "git reset HEAD <file>..." to unstage)
#   (use "git add <file>..." to mark resolution)
#
#    both modified:      hello.rb
#
```

However, `git rerere` will also tell you what it has recorded the pre-merge state for with `git rerere status`:

```console
$ git rerere status
hello.rb
```

And `git rerere diff` will show the current state of the resolution — what you started with to resolve and what you've resolved it to.

```console
$ git rerere diff
--- a/hello.rb
+++ b/hello.rb
@@ -1,11 +1,11 @@
 #! /usr/bin/env ruby

 def hello
-<<<<<<<
-  puts 'hello mundo'
-=======
+<<<<<<< HEAD
   puts 'hola world'
->>>>>>>
+=======
+  puts 'hello mundo'
+>>>>>>> i18n-world
 end
```

Also (and this isn't really related to `rerere`), you can use `git ls-files -u` to see the conflicted files and the before, left and right versions:

```console
$ git ls-files -u
100644 39804c942a9c1f2c03dc7c5ebcd7f3e3a6b97519 1    hello.rb
100644 a440db6e8d1fd76ad438a49025a9ad9ce746f581 2    hello.rb
100644 54336ba847c3758ab604876419607e9443848474 3    hello.rb
```

Now you can resolve it to just be `puts 'hola mundo'` and you can run `git rerere diff` again to see what rerere will remember:

```console
$ git rerere diff
--- a/hello.rb
+++ b/hello.rb
@@ -1,11 +1,7 @@
 #! /usr/bin/env ruby

 def hello
-<<<<<<<
-  puts 'hello mundo'
-=======
-  puts 'hola world'
->>>>>>>
+  puts 'hola mundo'
 end
```

So that basically says, when Git sees a hunk conflict in a `hello.rb` file that has "hello mundo" on one side and "hola world" on the other, it will resolve it to "hola mundo".

Now we can mark it as resolved and commit it:

```console
$ git add hello.rb
$ git commit
Recorded resolution for 'hello.rb'.
[master 68e16e5] Merge branch 'i18n'
```

You can see that it "Recorded resolution for FILE".

Now, let's undo that merge and then rebase it on top of our `master` branch instead.
We can move our branch back by using `git reset` as we saw in "Git Reset" (Pro Git).

```console
$ git reset --hard HEAD^
HEAD is now at ad63f15 i18n the hello
```

Our merge is undone.
Now let's rebase the topic branch.

```console
$ git checkout i18n-world
Switched to branch 'i18n-world'

$ git rebase master
First, rewinding head to replay your work on top of it...
Applying: i18n one word
Using index info to reconstruct a base tree...
Falling back to patching base and 3-way merge...
Auto-merging hello.rb
CONFLICT (content): Merge conflict in hello.rb
Resolved 'hello.rb' using previous resolution.
Failed to merge in the changes.
Patch failed at 0001 i18n one word
```

Now, we got the same merge conflict like we expected, but take a look at the `Resolved FILE using previous resolution` line.
If we look at the file, we'll see that it's already been resolved, there are no merge conflict markers in it.

```ruby
#! /usr/bin/env ruby

def hello
  puts 'hola mundo'
end
```

Also, `git diff` will show you how it was automatically re-resolved:

```console
$ git diff
diff --cc hello.rb
index a440db6,54336ba..0000000
--- a/hello.rb
+++ b/hello.rb
@@@ -1,7 -1,7 +1,7 @@@
  #! /usr/bin/env ruby

  def hello
-   puts 'hola world'
 -  puts 'hello mundo'
++  puts 'hola mundo'
  end
```

You can also recreate the conflicted file state with `git checkout`:

```console
$ git checkout --conflict=merge hello.rb
$ cat hello.rb
#! /usr/bin/env ruby

def hello
<<<<<<< ours
  puts 'hola world'
=======
  puts 'hello mundo'
>>>>>>> theirs
end
```

We saw an example of this in "Advanced Merging" (Pro Git).
For now though, let's re-resolve it by just running `git rerere` again:

```console
$ git rerere
Resolved 'hello.rb' using previous resolution.
$ cat hello.rb
#! /usr/bin/env ruby

def hello
  puts 'hola mundo'
end
```

We have re-resolved the file automatically using the `rerere` cached resolution.
You can now add and continue the rebase to complete it.

```console
$ git add hello.rb
$ git rebase --continue
Applying: i18n one word
```

So, if you do a lot of re-merges, or want to keep a topic branch up to date with your `master` branch without a ton of merges, or you rebase often, you can turn on `rerere` to help your life out a bit.

## `git merge` manual (excerpt)

> Source: [Git documentation: git-merge](https://git-scm.com/docs/git-merge) · GPL-2.0

### How conflicts are presented

During a merge, the working tree files are updated to reflect the result
of the merge.  Among the changes made to the common ancestor's version,
non-overlapping ones (that is, you changed an area of the file while the
other side left that area intact, or vice versa) are incorporated in the
final result verbatim.  When both sides made changes to the same area,
however, Git cannot randomly pick one side over the other, and asks you to
resolve it by leaving what both sides did to that area.

By default, Git uses the same style as the one used by the "merge" program
from the RCS suite to present such a conflicted hunk, like this:

```
Here are lines that are either unchanged from the common
ancestor, or cleanly resolved because only one side changed,
or cleanly resolved because both sides changed the same way.
<<<<<<< yours:sample.txt
Conflict resolution is hard;
let's go shopping.
=======
Git makes conflict resolution easy.
>>>>>>> theirs:sample.txt
And here is another line that is cleanly resolved or unmodified.
```

The area where a pair of conflicting changes happened is marked with markers
`<<<<<<<`, `=======`, and `>>>>>>>`.  The part before the `=======`
is typically your side, and the part afterwards is typically their side.

The default format does not show what the original said in the conflicting
area.  You cannot tell how many lines are deleted and replaced with
Barbie's remark on your side.  The only thing you can tell is that your
side wants to say it is hard and you'd prefer to go shopping, while the
other side wants to claim it is easy.

An alternative style can be used by setting the `merge.conflictStyle`
configuration variable to either `diff3` or `zdiff3`.  In `diff3`
style, the above conflict may look like this:

```
Here are lines that are either unchanged from the common
ancestor, or cleanly resolved because only one side changed,
<<<<<<< yours:sample.txt
or cleanly resolved because both sides changed the same way.
Conflict resolution is hard;
let's go shopping.
||||||| base:sample.txt
or cleanly resolved because both sides changed identically.
Conflict resolution is hard.
=======
or cleanly resolved because both sides changed the same way.
Git makes conflict resolution easy.
>>>>>>> theirs:sample.txt
And here is another line that is cleanly resolved or unmodified.
```

while in `zdiff3` style, it may look like this:

```
Here are lines that are either unchanged from the common
ancestor, or cleanly resolved because only one side changed,
or cleanly resolved because both sides changed the same way.
<<<<<<< yours:sample.txt
Conflict resolution is hard;
let's go shopping.
||||||| base:sample.txt
or cleanly resolved because both sides changed identically.
Conflict resolution is hard.
=======
Git makes conflict resolution easy.
>>>>>>> theirs:sample.txt
And here is another line that is cleanly resolved or unmodified.
```

In addition to the `<<<<<<<`, `=======`, and `>>>>>>>` markers, it uses
another `|||||||` marker that is followed by the original text.  You can
tell that the original just stated a fact, and your side simply gave in to
that statement and gave up, while the other side tried to have a more
positive attitude.  You can sometimes come up with a better resolution by
viewing the original.

### How to resolve conflicts

After seeing a conflict, you can do two things:

 * Decide not to merge.  The only clean-ups you need are to reset
   the index file to the `HEAD` commit to reverse 2. and to clean
   up working tree changes made by 2. and 3.; `git merge --abort`
   can be used for this.

 * Resolve the conflicts.  Git will mark the conflicts in
   the working tree.  Edit the files into shape and
   `git add` them to the index.  Use `git commit` or
   `git merge --continue` to seal the deal. The latter command
   checks whether there is a (interrupted) merge in progress
   before calling `git commit`.

You can work through the conflict with a number of tools:

 * Use a mergetool.  `git mergetool` to launch a graphical
   mergetool which will work through the merge with you.

 * Look at the diffs.  `git diff` will show a three-way diff,
   highlighting changes from both the `HEAD` and `MERGE_HEAD`
   versions. `git diff AUTO_MERGE` will show what changes you've
   made so far to resolve textual conflicts.

 * Look at the diffs from each branch. `git log --merge -p <path>`
   will show diffs first for the `HEAD` version and then the
   `MERGE_HEAD` version.

 * Look at the originals.  `git show :1:filename` shows the
   common ancestor, `git show :2:filename` shows the `HEAD`
   version, and `git show :3:filename` shows the `MERGE_HEAD`
   version.
