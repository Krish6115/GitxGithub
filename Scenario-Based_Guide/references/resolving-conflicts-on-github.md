# Resolving merge conflicts (on GitHub and locally)

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: Resolving a merge conflict on GitHub](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-on-github) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Resolving a merge conflict using the command line](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-using-the-command-line) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Resolving a merge conflict on GitHub

> Source: [GitHub Docs: Resolving a merge conflict on GitHub](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-on-github) · CC BY 4.0

Resolve simple merge conflicts directly on GitHub using the conflict editor or handle complex cases via the command line.

You can resolve simple competing line change conflicts on GitHub. For other conflicts, use the command line. See [Resolving a merge conflict using the command line](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-using-the-command-line).

If Copilot cloud agent is enabled for the repository, you can click **Fix with Copilot** in the merge box to have Copilot resolve conflicts automatically. See [Use cloud agent on github](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-on-github#resolving-merge-conflicts).

> **Warning:**
> Resolving conflicts on GitHub merges the entire [base branch](https://docs.github.com/en/get-started/learning-about-github/github-glossary#base-branch) into the [head branch](https://docs.github.com/en/get-started/learning-about-github/github-glossary#head-branch). If the head branch is the default or protected branch, you may be prompted to create a new head branch. See [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

1. Under your repository name, click **Pull requests**.
1. In the "Pull Requests" list, click the pull request with a merge conflict that you want to resolve.
1. Near the bottom of your pull request, click **Resolve conflicts**.

   > **Note:**
   > If **Resolve conflicts** is deactivated, resolve the conflict using another Git client or the command line. See [Resolving a merge conflict using the command line](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-using-the-command-line).

1. Decide if you want to keep only your branch's changes, keep only the other branch's changes, or make a brand new change, which may incorporate changes from both branches. Delete the conflict markers `<<<<<<<`, `=======`, `>>>>>>>` and make the changes you want in the final merge.
1. If your file has more than one merge conflict, scroll down to the next set of conflict markers and repeat steps four and five to resolve the conflict.
1. After you've resolved all the conflicts in the file, click **Mark as resolved**.

1. If more than one file has a conflict, select the next file you want to edit on the left side of the page under "conflicting files" and repeat steps four through seven until you've resolved all merge conflicts in your pull request.
1. After you've resolved all your merge conflicts, click **Commit merge**. This merges the entire base branch into your head branch.

1. If prompted, review the branch that you are committing to. You can update the head branch or, if available, create a new branch for the pull request. If the head branch is protected, you must create a new branch.

   Click **Create branch and update my pull request** or **I understand, continue updating BRANCH**.
1. To merge your pull request, click **Merge pull request**. See [Merging a pull request](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request).

### Further reading

* [Pull request merges](https://docs.github.com/en/pull-requests/reference/pull-request-merges)

## Resolving a merge conflict using the command line

> Source: [GitHub Docs: Resolving a merge conflict using the command line](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-using-the-command-line) · CC BY 4.0

Resolve merge conflicts using the command line by identifying conflicting changes, editing files, and committing resolutions.

Merge conflicts happen when competing changes are made to the same line of a file, or when one person edits a file and another person deletes the same file. See [Merge conflicts](https://docs.github.com/en/pull-requests/reference/merge-conflicts).

> **Tip:**
> You can use the conflict editor on GitHub to resolve competing line change merge conflicts between branches that are part of a pull request. See [Resolving a merge conflict on github](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-on-github).

### Competing line change merge conflicts

When competing changes affect the same lines, choose which changes to keep, then commit the resolution.

1. Open your terminal or Git Bash.
1. Navigate into the local Git repository that has the merge conflict.

   ```shell
   cd REPOSITORY-NAME
   ```

1. List the files affected by the merge conflict. In this example, the file _styleguide.md_ has a merge conflict.

   ```shell
   $ git status
   > # On branch branch-b
   > # You have unmerged paths.
   > #   (fix conflicts and run "git commit")
   > #
   > # Unmerged paths:
   > #   (use "git add <file>..." to mark resolution)
   > #
   > # both modified:      styleguide.md
   > #
   > no changes added to commit (use "git add" and/or "git commit -a")
   ```

1. Open your preferred text editor, such as [Visual Studio Code](https://code.visualstudio.com/), and navigate to the file that has merge conflicts.
1. Search the file for the conflict marker `<<<<<<<`. The changes from the HEAD or base branch appear after `<<<<<<< HEAD`, followed by `=======`, then the changes from the other branch and `>>>>>>> BRANCH-NAME`.

   ```text
   If you have questions, please
   <<<<<<< HEAD
   open an issue
   =======
   ask your question in IRC.
   >>>>>>> branch-a
   ```

1. Decide if you want to keep only your branch's changes, keep only the other branch's changes, or make a brand new change, which may incorporate changes from both branches. Delete the conflict markers `<<<<<<<`, `=======`, `>>>>>>>` and make the changes you want in the final merge. For example, you can keep both changes:

   ```shell
   If you have questions, please open an issue or ask in our IRC channel if it's more urgent.
   ```

1. Stage your changes.

   ```shell
   git add .
   ```

1. Commit your changes with a comment.

   ```shell
   git commit -m "Resolve merge conflict by incorporating both suggestions"
   ```

You can now merge the branches on the command line or [push your changes to your remote repository](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository) on GitHub and [merge your changes](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request) in a pull request.

### Removed file merge conflicts

When one branch deletes a file and another branch edits the same file, choose whether to keep or delete the file, then commit the resolution.

1. Open your terminal or Git Bash.
1. Navigate into the local Git repository that has the merge conflict.

   ```shell
   cd REPOSITORY-NAME
   ```

1. List the files affected by the merge conflict. In this example, the file `README.md` has a merge conflict.

   ```shell
   $ git status
   > # On branch main
   > # Your branch and 'origin/main' have diverged,
   > # and have 1 and 2 different commits each, respectively.
   > #  (use "git pull" to merge the remote branch into yours)
   > # You have unmerged paths.
   > #  (fix conflicts and run "git commit")
   > #
   > # Unmerged paths:
   > #  (use "git add/rm <file>..." as appropriate to mark resolution)
   > #
   > #	deleted by us:   README.md
   > #
   > # no changes added to commit (use "git add" and/or "git commit -a")
   ```

1. Open your preferred text editor, such as [Visual Studio Code](https://code.visualstudio.com/), and navigate to the file that has merge conflicts.
1. Decide whether to keep the removed file. To add it back to your repository:

   ```shell
   git add README.md
   ```

   To remove this file from your repository:

   ```shell
   $ git rm README.md
   > README.md: needs merge
   > rm 'README.md'
   ```

1. Commit your changes with a comment.

   ```shell
   $ git commit -m "Resolve merge conflict by keeping README.md file"
   > [branch-d 6f89e49] Merge branch 'branch-c' into branch-d
   ```

With merge conflicts resolved, you can now push your changes to your remote repository on GitHub or merge your pull request into its base branch.

### Further reading

* [Merge conflicts](https://docs.github.com/en/pull-requests/reference/merge-conflicts)
* [Checking out pull requests locally](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/checking-out-pull-requests-locally)
