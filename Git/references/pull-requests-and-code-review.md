# Pull requests and code review on GitHub

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: About pull requests](https://docs.github.com/en/pull-requests/get-started/about-pull-requests) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: About merge methods on GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Reviewing proposed changes in a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## About pull requests

> Source: [GitHub Docs: About pull requests](https://docs.github.com/en/pull-requests/get-started/about-pull-requests) · CC BY 4.0

Use pull requests to propose, discuss, and merge changes on GitHub.

A pull request proposes merging code changes from one branch into another. As a collaborative feature, pull requests give you a place to discuss and review work before it becomes part of a project.

### Why use pull requests

Pull requests turn a set of code changes into a conversation. Instead of merging work directly, you propose it so that collaborators can weigh in. This helps you and your team maintain high quality and secure code, in a few ways:

* Catch bugs and problems early, before they reach the main branch.
* Discuss and improve changes together, with feedback tied to specific lines.
* Keep a clear, reviewable history of what changed and why.

### What you can do with pull requests

Pull requests make your changes easy to review and validate. With a pull request, you can:

* Propose changes from a branch or a fork.
* Use stacked pull requests to break large code changes into a chain of smaller, dependent pull requests that you can review and merge independently.
* Discuss and review the proposed changes, line by line.
* Run automated checks, such as tests, builds, and code scanning, against the changes.
* Respond to feedback and update the pull request as it evolves.
* Merge the changes once reviews and required checks are satisfied.

### Key parts of a pull request

A pull request gathers everything you and your reviewers need into one place:

* **Conversation** shows the description, comments, reviews, and a timeline of activity.
* **Commits** shows how the branch changed over time.
* **Checks** shows the results of automated tests, builds, and other validations.
* **Files changed** shows the diff that reviewers comment on.
* The **merge box** summarizes whether you can merge your changes or not. It shows what may still need to happen, such as required reviews or checks, before a pull request can be merged.

### How pull requests fit your workflow

Whether you're proposing changes or reviewing someone else's, a pull request follows a few stages:

* **Branch or fork** the repository to create an isolated place to work.
* **Commit** your changes as you go, building up a history of your work.
* **Open a pull request** to propose merging your changes into the base branch.
* **Review and discuss** the changes with collaborators, making updates as needed.
* **Merge** the pull request when it's ready.

### Next steps

* [Pull request quickstart](https://docs.github.com/en/pull-requests/get-started/pull-request-quickstart)
* [Reviewing pull requests quickstart](https://docs.github.com/en/pull-requests/get-started/reviewing-pull-requests-quickstart)
* [Writing code for a project](https://docs.github.com/en/pull-requests/concepts/writing-code-for-a-project)

## About merge methods on GitHub

> Source: [GitHub Docs: About merge methods on GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github) · CC BY 4.0

You can allow contributors with push access to your repository to merge their pull requests with different merge options or enforce a specific merge method for all of your repository's pull requests.

You can configure pull request merge options to meet your workflow needs and preferences for managing Git history. For more information, see [Configuring pull request merges](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges). You can enforce one type of merge method, such as commit squashing or rebasing, by only enabling the desired method for your repository.

> **Note:**
> When using the merge queue, you no longer get to choose the merge method, as this is controlled by the queue. For more information about merge queues, see [Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue).
>
> Merge methods set on the repository that conflict with the merge method rule will prevent merging. For example if you do not allow rebase merging for the repository, and the merge rule only allows rebase on a branch, that merge will not be possible. For more information, see [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-a-pull-request-before-merging).

When you click the default **Merge pull request** option on a pull request, all commits from the feature branch are added to the base branch in a merge commit. The pull request is merged using [the `--no-ff` option](https://git-scm.com/docs/git-merge#_fast_forward_merge).

To merge pull requests, you must have [write permissions](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization) in the repository.

The default merge method creates a merge commit. You can prevent anyone from pushing merge commits to a protected branch by enforcing a linear commit history. For more information, see [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-linear-history).

### Squashing your merge commits

When you select the **Squash and merge** option on a pull request, the pull request's commits are squashed into a single commit. Instead of seeing all of a contributor's individual commits from a topic branch, the commits are combined into one commit and merged into the default branch. Pull requests with squashed commits are merged using the [fast-forward option](https://git-scm.com/docs/git-merge#_fast_forward_merge).

To squash and merge pull requests, you must have [write permissions](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization) in the repository, and the repository must [allow squash merging](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests).

You can use squash and merge to create a more streamlined Git history in your repository. Work-in-progress commits are helpful when working on a feature branch, but they aren’t necessarily important to retain in the Git history. If you squash these commits into one commit when merging to the default branch, the changes are consolidated, leading to a clear Git history.

Before enabling squashing commits, consider these disadvantages:
* You lose information about when specific changes were originally made and who authored the squashed commits.
* If you continue working on the head branch of a pull request after squashing and merging, and then create a new pull request between the same branches, commits that you previously squashed and merged will be listed in the new pull request. You may also have conflicts that you have to repeatedly resolve in each successive pull request. For more information, see [Pull request merges](https://docs.github.com/en/pull-requests/reference/pull-request-merges#squashing-and-merging-a-long-running-branch).
* Some Git commands that use the "SHA" or "hash" ID may be harder to use since the SHA ID for the original commits is lost. For example, using [`git rerere`](https://git-scm.com/docs/git-rerere) may not be as effective.

For more information, see [Configuring commit squashing for pull requests](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests).

### Rebasing and merging your commits

When you select the **Rebase and merge** option on a pull request, all commits from the topic branch (or head branch) are added onto the base branch individually without a merge commit. In that way, the rebase and merge behavior resembles a [fast-forward merge](https://git-scm.com/docs/git-merge#_fast_forward_merge) by maintaining a linear project history. However, rebasing achieves this by re-writing the commit history on the base branch with new commits.

The rebase and merge behavior on GitHub deviates slightly from `git rebase` outside of GitHub. Rebase and merge on GitHub:

* Always updates the committer information and creates new commit SHAs, whereas `git rebase` does not change the committer information when the rebase happens on top of an ancestor commit.
* Drops commits that were empty to begin with, such as those created with `git commit --allow-empty`, whereas `git rebase` keeps originally-empty commits by default.

For more information about `git rebase`, see [git-rebase](https://git-scm.com/docs/git-rebase) in the Git documentation.

To rebase and merge pull requests, you must have [write permissions](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization) in the repository, and the repository must [allow rebase merging](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-rebasing-for-pull-requests).

For a visual representation of `git rebase`, see [The "Git Branching - Rebasing" chapter from the _Pro Git_ book](https://git-scm.com/book/en/v2/Git-Branching-Rebasing).

Before enabling commit rebasing, consider these disadvantages:
* Repository contributors may have to rebase on the command line, resolve any conflicts, and force push their changes to the pull request's topic branch (or remote head branch) before they can use the **rebase and merge** option on GitHub. Force pushing must be done carefully so contributors don't overwrite work that others have based their work on. To learn more about when the **Rebase and merge** option is disabled on GitHub and the workflow to re-enable it, see [Pull request merges](https://docs.github.com/en/pull-requests/reference/pull-request-merges#rebase-and-merge-your-commits).
*

For more information, see [Configuring commit rebasing for pull requests](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-rebasing-for-pull-requests).

## Reviewing proposed changes in a pull request

> Source: [GitHub Docs: Reviewing proposed changes in a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request) · CC BY 4.0

Review commits, file changes, and diffs in pull requests to provide feedback, approve changes, or request updates before merging.

### About reviewing pull requests

It's best to review changes in a pull request one file at a time:

* **Examine** each individual file changed in the pull request.
* **Leave comments** on specific changes.
* After reviewing a file, mark it as **Viewed** to collapse it and track your progress.
* The **progress bar** in the pull request header shows how many files you've viewed.
* When you've finished, you can **approve** the pull request or **request changes** by submitting your review with a summary comment.

 If the pull request was raised by GitHub Copilot, then Copilot will respond to your comments when you submit them. Copilot will push a new commit to the pull request with further changes. See [About cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent).

### Understanding the purpose of the pull request

Understanding the motivation behind a pull request helps you keep your review targeted and meaningful. It also helps you provide feedback that aligns with the pull request author’s intent and the project's goals.

You have several options to better understand the context and rationale for proposed changes.

#### Using the pull request sidebar for context

In the pull request sidebar, you can find valuable context, including:

* Linked **issues** or **discussions**: Review these to understand the problems or goals that the pull request aims to address. You can also gather information about background, design decisions, or current debates.
* Linked **projects** or **milestones**: Review how this pull request fits within larger projects or upcoming releases.

Use this information to frame your review and check if the goals of the pull request align with the original intent.

### Starting a review

1. Under your repository name, click **Pull requests**.
1. In the list of pull requests, click the pull request you'd like to review.
1. On the pull request, click **Files changed**.

To change the format of the diff view in this tab, click  and choose the unified or split view. The choice you make will apply when you view the diff for other pull requests.

   You can also hide whitespace differences. The choice you make only applies to this pull request and will be remembered the next time you visit this page.
1. Optionally, filter the files to show only the files you want to review or use the file tree to navigate to a specific file.

1. Optionally, if you have access to GitHub Copilot Enterprise, you can ask Copilot about the changes in a file in a pull request by clicking  at the top right of the file, clicking **Ask Copilot about this diff**, then typing a request such as "Explain these changes." See [Chat in github](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-on-github/chat-with-copilot/chat-in-github#asking-questions-about-a-specific-pull-request).

1. Hover over the line of code where you'd like to add a comment, and click the blue comment icon.

1. Optionally, you can add a comment on multiple lines. To select a range of lines, click the line number of the first line you want to comment on, then either drag down to the final line, or hold down <kbd>Shift</kbd> and click on the last line number. You can then click the blue comment icon on the last line you want to comment on. Alternatively, you can click the blue comment icon next to the first line you want to comment on, then drag down to the last line you want to comment on.
1. In the comment field, type your comment.
1. Optionally, to suggest a specific change to the line or lines, click , then edit the text within the suggestion block.

1. To comment directly on a file, to the right of the file, click  and type your comment.

1. When you're done, click **Start a review**. If you have already started a review, you can click **Add review comment**.

Before you submit your review, your line comments are _pending_ and only visible to you. You can edit pending comments anytime before you submit your review. To cancel a pending review, including all of its pending comments, click **Submit review**, then click **Discard review**.

### Reviewing a pull request

You can use [GitHub Codespaces](https://docs.github.com/en/codespaces/quickstart) to test, run, and review pull requests.

1. Open the pull request in a codespace, as described in [Using github codespaces for pull requests](https://docs.github.com/en/codespaces/developing-in-a-codespace/using-github-codespaces-for-pull-requests#opening-a-pull-request-in-codespaces).
1. In the Activity Bar, click the **GitHub Pull Request** view. This view only appears when you open a pull request in a codespace.

1. To review a specific file, click the **Open File** icon in the Side Bar.

1. To add review comments, click the **+** icon next to the line number. Type your review comment and then click **Start Review**.

1. Optionally, you can suggest a change that the author of the pull request can click to commit if they agree with your suggestion. To do this, click and hold the **+** sign next to the first line you want to suggest changing, then drag the **+** sign to the last line you want to suggest changing. Then click **Make a Suggestion** in the comment box that's displayed.

   The lines you selected are copied into the comment box, where you can edit them to suggest a change. You can add a comment above the line containing <code>```suggestion</code> to explain your suggested change.

   Click **Add Comment** to add your suggestion to the pull request.

1. When you are finished adding review comments, from the Side Bar you can choose to either submit the comments, approve the changes, or request changes.

For more information on reviewing pull requests in GitHub Codespaces, see [Using github codespaces for pull requests](https://docs.github.com/en/codespaces/developing-in-a-codespace/using-github-codespaces-for-pull-requests).

### Understanding changes in a pull request

> **Note:** You'll need access to GitHub Copilot. For more information, see [About github copilot](https://docs.github.com/en/copilot/get-started/about-github-copilot#get-access).

GitHub Copilot can help you quickly understand changes in a pull request by providing context and explanations for specific commits. If you’re unsure about the purpose of a particular change or need more details about how it fits into the broader codebase, you can ask Copilot questions about individual commits.

1. Navigate to a commit on GitHub.

1. In the top right of any page on GitHub, click the **Copilot** icon next to the search bar.

   The GitHub Copilot Chat panel is displayed. To resize the panel, click and drag the top or left edge.

1. If the panel contains a previous conversation you had with Copilot, click the  plus sign icon at the top right of the Copilot panel to start a new conversation.

1. At the bottom of the Copilot chat panel, in the "Ask Copilot" box, type a question and press <kbd>Enter</kbd>. For example, you could enter:

   * `Summarize the changes in this commit`
   * `Who committed these changes?`
   * `When was this commit made?`

   > **Tip:**
   > If you know the SHA for a commit, instead of navigating to the commit, you can ask Copilot about the commit from any page in the repository on GitHub by including the SHA in your message. For example, `What changed in commit a778e0eab?`

1. Optionally, after submitting a question, you can click  in the text box to stop the response.

### Marking a file as viewed

After you finish reviewing a file, you can mark the file as viewed. The file will collapse. If the file changes after you view the file, it will be unmarked as viewed.

1. On the pull request, click **Files changed**.

1. On the right of the header of the file you've finished reviewing, select **Viewed**.

### Submitting your review

After you've finished reviewing all the files you want in the pull request, submit your review.

1. On the pull request, click **Files changed**.

1. Above the changed code, click **Review changes**.

1. Type a comment summarizing your feedback on the proposed changes.
1. Select the type of review you'd like to leave:

    * Select **Comment** to leave general feedback without explicitly approving the changes or requesting additional changes.
    * Select **Approve** to submit your feedback and approve merging the changes proposed in the pull request.
    * Select **Request changes** to submit feedback that must be addressed before the pull request can be merged.
1. Click **Submit review**.

> **Tip:**
> * The **Request changes** option is purely informational and will not prevent merging unless a ruleset or classic branch protection rule is configured with the "require a pull request" option. If configured and a collaborator with `admin`, `owner`, or `write` access to the repository submits a review requesting changes, the pull request cannot be merged until the same collaborator submits another review approving the changes in the pull request.
> * Repository owners and administrators can merge a pull request even if it hasn't received an approving review, or if a reviewer who requested changes has left the organization or is unavailable.
> * If both required reviews and stale review dismissal are enabled and a code-modifying commit is pushed to the branch of an approved pull request, the approval is dismissed. The pull request must be reviewed and approved again before it can be merged.
> * When several open pull requests each have a head branch pointing to the same commit, you won’t be able to merge them if one or both have a pending or rejected review.
> * If your repository requires approving reviews from people with write or admin permissions, the reviewers sidebar groups approvals by permission level. Approvals can appear in two sections:
>     * The **top section** mostly contains approvals from people with write or admin permissions that count toward merge requirements. Approvals by GitHub Copilot also appear in this section even though GitHub Copilot reviews do not count toward those requirements.
>     * The **collapsible section (if present)** shows approvals from reviewers whose reviews do not affect whether the pull request can be merged.
> * Pull request authors cannot approve their own pull requests. You will also not be able to approve a pull request that was raised by GitHub Copilot if it was you who assigned Copilot to the issue to which the pull request relates.

## About code owners

> Source: [GitHub Docs: About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) · CC BY 4.0

You can use a CODEOWNERS file to define individuals or teams that are responsible for code in a repository.

The people you choose as code owners must have write permissions for the repository. When the code owner is a team, that team must be visible and it must have write permissions, even if all the individual members of the team already have write permissions directly, through organization membership, or through another team membership.

### About code owners

Code owners are automatically requested for review when someone opens a pull request that modifies code that they own. Code owners are not automatically requested to review draft pull requests. For more information about draft pull requests, see [Pull requests](https://docs.github.com/en/pull-requests/reference/pull-requests#draft-pull-requests). When you mark a draft pull request as ready for review, code owners are automatically notified. If you convert a pull request to a draft, people who are already subscribed to notifications are not automatically unsubscribed. For more information, see [Changing the stage of a pull request](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/changing-the-stage-of-a-pull-request).

When someone with admin or owner permissions has enabled required reviews, they also can optionally require approval from a code owner before the author can merge a pull request in the repository. For more information, see [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-pull-request-reviews-before-merging).

If a file has a code owner, you can see who the code owner is before you open a pull request. In the repository, you can browse to the file and hover over  to see a tool tip with codeownership details.

### CODEOWNERS file location

To use a CODEOWNERS file, create a new file called `CODEOWNERS` in the `.github/`, root, or `docs/` directory of the repository, in the branch where you'd like to add the code owners. If `CODEOWNERS` files exist in more than one of those locations, GitHub will search for them in that order and use the first one it finds.

Each CODEOWNERS file assigns the code owners for a single branch in the repository. Thus, you can assign different code owners for different branches, such as `@octo-org/codeowners-team` for a code base on the default branch and `@octocat` for a GitHub Pages site on the `gh-pages` branch.

For code owners to receive review requests, the CODEOWNERS file must be on the base branch of the pull request. For example, if you assign `@octocat` as the code owner for _.js_ files on the `gh-pages` branch of your repository, `@octocat` will receive review requests when a pull request with changes to _.js_ files is opened between the head branch and `gh-pages`.

### CODEOWNERS and forks

To trigger review requests, pull requests use the version of `CODEOWNERS` from the base branch of the pull request. The base branch is the branch that a pull request will modify if the pull request is merged.

If you create a pull request from a fork, and the base branch is in the upstream repository, then the pull request will use the `CODEOWNERS` file from that branch in the upstream repository. If the base branch is a branch within your fork, then the pull request will use the `CODEOWNERS` file from that branch in your fork, but this will only trigger review requests if the code owners are added to your fork specifically with `write` access.

When you view who is responsible for a file by hovering over , you will see information from the `CODEOWNERS` file for whichever branch in whichever repository you're looking at.

### CODEOWNERS syntax

> **Warning:**
> There are some syntax rules for gitignore files that _do not work_ in CODEOWNERS files:
> * Escaping a pattern starting with `#` using `\` so it is treated as a pattern and not a comment doesn't work
> * Using `!` to negate a pattern doesn't work
> * Using `[ ]` to define a character range doesn't work

A CODEOWNERS file uses a pattern that follows most of the same rules used in [gitignore](https://git-scm.com/docs/gitignore#_pattern_format) files. The pattern is followed by one or more GitHub usernames or team names using the standard `@username` or `@org/team-name` format. Users and teams must have explicit `write` access to the repository, even if the team's members already have access.

> **Note:**
> When using teams, only organization teams can be code owners. Enterprise teams are not supported as code owners. See [Teams in an enterprise](https://docs.github.com/en/admin/concepts/enterprise-fundamentals/teams-in-an-enterprise).

If you want to match two or more code owners with the same pattern, all the code owners must be on the same line. If the code owners are not on the same line, the pattern matches only the last mentioned code owner.

In most cases, you can also refer to a user by an email address that has been added to their account, for example `user@example.com`.  You cannot use an email address to refer to a GitHub. For more information about GitHub, see [Enterprise managed users](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users)" in the GitHub Enterprise Cloud documentation.

CODEOWNERS paths are case sensitive, because GitHub uses a case sensitive file system. Since CODEOWNERS are evaluated by GitHub, even systems that are case insensitive (for example, macOS) must use paths and files that are cased correctly in the CODEOWNERS file.

If any line in your CODEOWNERS file contains invalid syntax, that line will be skipped. When you navigate to the CODEOWNERS file in your repository, you can see any errors highlighted. A list of errors in a repository's CODEOWNERS file is also accessible via the API. For more information, see [Repos](https://docs.github.com/en/rest/repos/repos#list-codeowners-errors).

If you specify a user or team that doesn't exist or has insufficient access, a code owner will not be assigned.

#### Example of a CODEOWNERS file

```text
# This is a comment.
# Each line is a file pattern followed by one or more owners.

# These owners will be the default owners for everything in
# the repo. Unless a later match takes precedence,
# @global-owner1 and @global-owner2 will be requested for
# review when someone opens a pull request.
*       @global-owner1 @global-owner2

# Order is important; the last matching pattern takes the most
# precedence. When someone opens a pull request that only
# modifies JS files, only @js-owner and not the global
# owner(s) will be requested for a review.
*.js    @js-owner #This is an inline comment.

# You can also use email addresses if you prefer. They'll be
# used to look up users just like we do for commit author
# emails.
*.go docs@example.com

# Teams can be specified as code owners as well. Teams should
# be identified in the format @org/team-name. Teams must have
# explicit write access to the repository. In this example,
# the octocats team in the octo-org organization owns all .txt files.
*.txt @octo-org/octocats

# In this example, @doctocat owns any files in the build/logs
# directory at the root of the repository and any of its
# subdirectories.
/build/logs/ @doctocat

# The `docs/*` pattern will match files like
# `docs/getting-started.md` but not further nested files like
# `docs/build-app/troubleshooting.md`.
docs/* docs@example.com

# In this example, @octocat owns any file in an apps directory
# anywhere in your repository.
apps/ @octocat

# In this example, @doctocat owns any file in the `/docs`
# directory in the root of your repository and any of its
# subdirectories.
/docs/ @doctocat

# In this example, any change inside the `/scripts` directory
# will require approval from @doctocat or @octocat.
/scripts/ @doctocat @octocat

# In this example, @octocat owns any file in a `/logs` directory such as
# `/build/logs`, `/scripts/logs`, and `/deeply/nested/logs`. Any changes
# in a `/logs` directory will require approval from @octocat.
**/logs @octocat

# In this example, @octocat owns any file in the `/apps`
# directory in the root of your repository except for the `/apps/github`
# subdirectory, as its owners are left empty. Without an owner, changes
# to `apps/github` can be made with the approval of any user who has
# write access to the repository.
/apps/ @octocat
/apps/github

# In this example, @octocat owns any file in the `/apps`
# directory in the root of your repository except for the `/apps/github`
# subdirectory, as this subdirectory has its own owner @doctocat
/apps/ @octocat
/apps/github @doctocat
```

### CODEOWNERS and branch protection

Repository owners can update branch protection rules to ensure that changed code is reviewed by the owners of the changed files. Edit your branch protection rule and enable the option "Require review from Code Owners". For more information, see [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

> **Note:**
> When reviews from code owners are required, an approval from _any_ of the owners is sufficient to meet this requirement. For example, let's say that your CODEOWNERS file contains the following line:
>
> ```text
> *.js     @global-owner1 @global-owner2
> ```
>
> This means that changes to JavaScript files could be approved by either `@global-owner1` _or_ `@global-owner2`, but approvals from _both_ are not required.

To protect a repository fully against unauthorized changes, you also need to define an owner for the CODEOWNERS file itself. The most secure method is to define a CODEOWNERS file in the `.github` directory of the repository and define the repository owner as the owner of either the CODEOWNERS file (``/.github/CODEOWNERS @owner_username``) or the whole directory (``/.github/ @owner_username``).

As an alternative to branch protection rules, you can create rulesets. Rulesets have a few advantages over branch protection rules, such as statuses, and better discoverability without requiring admin access. You can also apply multiple rulesets at the same time. For more information, see [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).
