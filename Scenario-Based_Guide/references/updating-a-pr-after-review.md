# Updating a pull request after review

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: Incorporating feedback in your pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/incorporating-feedback-in-your-pull-request) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Keeping your pull request in sync with the base branch](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/keeping-your-pull-request-in-sync-with-the-base-branch) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Committing changes to a pull request branch created from a fork](https://docs.github.com/en/pull-requests/how-tos/commit-changes/committing-changes-to-a-pull-request-branch-created-from-a-fork) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Incorporating feedback in your pull request

> Source: [GitHub Docs: Incorporating feedback in your pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/incorporating-feedback-in-your-pull-request) · CC BY 4.0

Apply suggested changes directly to a pull request, batch multiple suggestions into a single commit, or open an issue to track out-of-scope feedback.

### Applying suggested changes

Other people can suggest specific changes to your pull request. You can apply these suggested changes directly in a pull request if you have write access to the repository.

If the pull request was created from a fork and the author allowed edits from maintainers, you can also apply suggested changes if you have write access to the upstream repository. See [Commenting on a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/commenting-on-a-pull-request) and [Allowing changes to a pull request branch created from a fork](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/allowing-changes-to-a-pull-request-branch-created-from-a-fork).

To quickly incorporate more than one suggested change into a single commit, you can also apply suggested changes as a batch. Applying one suggested change or a batch of suggested changes creates a single commit on the compare branch of the pull request.

Each person who suggested a change included in the commit will be a co-author of the commit. The person who applies the suggested changes will be a co-author and the committer of the commit. See [Git Basics - Viewing the Commit History](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History) from the _Pro Git_ book site.

1. Under your repository name, click **Pull requests**.
1. In the list of pull requests, click the pull request where you want to apply a suggested change.
1. Navigate to the first suggested change you want to apply.
    * To apply the change in its own commit, click **Commit suggestion**.

    * To add the suggestion to a batch of changes, click **Add suggestion to batch**. Continue to add the suggested changes you want to include in a single commit. When you've finished adding suggested changes, click **Commit suggestions**.

1. In the commit message field, type a short, meaningful commit message that describes the change you made to the file or files.
1. Click **Commit changes**.

### Delegating review comments to Copilot

If you have access to Copilot cloud agent, you can delegate review comments to have Copilot implement the feedback. For more information, see [Use cloud agent on github](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-on-github#delegating-review-comments).

### Re-requesting a review

For example, you can re-request a review after you've made substantial changes to your pull request.
To request a fresh review from a reviewer, in the sidebar of the **Conversation** tab, click the  icon.

### Opening an issue for an out-of-scope suggestion

If someone suggests changes to your pull request and the changes are out of the pull request's scope, you can open a new issue to track the feedback. See [Creating an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue).

### Further reading

* [Pull request reviews](https://docs.github.com/en/pull-requests/reference/pull-request-reviews)
* [Reviewing proposed changes in a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request)
* [Commenting on a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/commenting-on-a-pull-request)
* [Requesting a pull request review](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/requesting-a-pull-request-review)
* [Creating an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue)

## Keeping your pull request in sync with the base branch

> Source: [GitHub Docs: Keeping your pull request in sync with the base branch](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/keeping-your-pull-request-in-sync-with-the-base-branch) · CC BY 4.0

Update your pull request branch with changes from the base branch to resolve conflicts and ensure compatibility before merging.

### About keeping your pull request in sync

Before merging, update your pull request branch with changes from the base branch to catch conflicts or test failures early. You can update the branch from the pull request page when there are no merge conflicts and the branch is behind the base branch.

> **Note:**
> You may not be able to use the `Update branch` button if the HEAD branch of your pull request is a protected branch. See [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

If changes to the base branch cause merge conflicts in your pull request branch, resolve the conflicts before updating the branch. See [Merge conflicts](https://docs.github.com/en/pull-requests/reference/merge-conflicts).

From the pull request page, you can update by merging the base branch into your head branch or by rebasing your changes onto the latest base branch. Rebasing creates a linear history without a merge commit. See [Branches](https://docs.github.com/en/pull-requests/reference/branches#three-dot-and-two-dot-git-diff-comparisons).

### Updating your pull request branch

1. Under your repository name, click **Pull requests**.
1. In the "Pull requests" list, click the pull request you want to update.
1. In the merge section near the bottom of the page, choose how to update the branch:
   * Click **Update branch** to perform a traditional merge.

   * Click the update branch dropdown menu, click **Update with rebase**, then click **Rebase branch** to update by rebasing on the base branch.

### Further reading

* [Pull requests](https://docs.github.com/en/pull-requests/reference/pull-requests)
* [Changing the stage of a pull request](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/changing-the-stage-of-a-pull-request)

## Committing changes to a pull request branch created from a fork

> Source: [GitHub Docs: Committing changes to a pull request branch created from a fork](https://docs.github.com/en/pull-requests/how-tos/commit-changes/committing-changes-to-a-pull-request-branch-created-from-a-fork) · CC BY 4.0

Commit changes to a pull request branch created from a fork by obtaining the necessary permissions and using Git commands effectively.

To commit to a pull request branch created from a fork, you need push access to the base repository, permission from the pull request creator, and a user-owned fork without branch restrictions that prevent your push. Only the pull request creator can allow edits to their fork. See [Allowing changes to a pull request branch created from a fork](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/allowing-changes-to-a-pull-request-branch-created-from-a-fork).

1. On GitHub, navigate to the fork where the pull request branch was created.
1. Above the list of files, click **Code**.

1. Copy the URL for the repository.

   * To clone the repository using HTTPS, under "HTTPS", click .
   * To clone the repository using an SSH key, including a certificate issued by your organization's SSH certificate authority, click **SSH**, then click .
   * To clone a repository using GitHub CLI, click **GitHub CLI**, then click .

1. Open your terminal or Git Bash.
1. Change the current working directory to the location where you want to clone the fork.

   ```shell
   cd open-source-projects
   ```

1. Clone the fork, then navigate into the cloned repository.

   ```shell
   git clone https://github.com/USERNAME/FORK-OF-THE-REPOSITORY
   cd FORK-OF-THE-REPOSITORY
   ```

1. Check out the pull request's compare branch. To find the compare branch, open the pull request and check the branch shown at the top of the page.

   ```shell
   git checkout TEST-BRANCH
   ```

1. Make your changes, then stage and commit them.

   ```shell
   git add .
   git commit -m "YOUR-COMMIT-MESSAGE"
   ```

1. Push your commit to the pull request branch.

   ```shell
   git push origin TEST-BRANCH
   ```

Your new commits appear on the original pull request on GitHub.

### Further reading

* [Forks](https://docs.github.com/en/pull-requests/reference/forks)
