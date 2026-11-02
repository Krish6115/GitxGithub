# Contributing to an open source project

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: Finding ways to contribute to open source on GitHub](https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Setting guidelines for repository contributors](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Contributing to a project](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [Pro Git, 2nd ed., §5.2 Contributing to a Project](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)

## Finding ways to contribute to open source on GitHub

> Source: [GitHub Docs: Finding ways to contribute to open source on GitHub](https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github) · CC BY 4.0

You can find ways to contribute to open source projects on GitHub that are relevant to you.

Open source software powers much of the technology you use daily, from the web browser on your screen to the [NASA Ingenuity helicopter that flew on Mars](https://github.com/readme/featured/nasa-ingenuity-helicopter).

Contributing to open source software allows you to build upon your technical expertise, boost your portfolio, help shape the future of technology, and connect with developers across the globe.

### Discovering relevant projects

With the vast array of available open source projects spanning numerous domains and technologies, finding where to begin your contribution journey can seem overwhelming. If you have open source software that you use daily, that's a great place to get started! GitHub also provides several tools that can help narrow down your search to a project that fits your domain.

#### Using Copilot Chat to find open source projects

You can use Copilot Chat to help find open source repositories that match an area you want to improve or boost your skills in.

Open [Copilot Chat](https://github.com/copilot) and start a general purpose chat. In this example, we'll ask Copilot to find open source projects written in the Python programming language.

```text copy
 I'm looking for a list of open source projects written in Python that are accepting new contributors. Narrow down the list to repositories that use the `good first issue` or `help wanted` labels and have over 100 stars on GitHub.
```

Using the `good first issue` and `help wanted` labels in the search will help Copilot filter for repositories that open for first-time contributors. After searching, Copilot will provide a link to a full list of repositories with those labels in the context of your search.

#### Using other resources to find projects to contribute to

If there's a particular topic that interests you, visit `github.com/topics/<topic>`. For example, if you are interested in machine learning, you can find relevant projects and good first issues by visiting https://github.com/topics/machine-learning. You can also search for repositories that match a topic you're interested in. See [Searching for repositories](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories#search-by-topic). You can browse popular repositories of the day by visiting [Trending](https://github.com/trending).

If you're interested in contributing to projects that **reduce the carbon emissions of software**, review [GitHub's Green Software Directory](https://github.com/github/GreenSoftwareDirectory).

If you've been active on GitHub, you can find personalized recommendations for projects and good first issues based on your past contributions, stars, and other activities in [Explore GitHub](https://github.com/explore).

### Checking if the repository is actively maintained

Before getting started contributing to an open source repository, it's recommended to check if the repository is being actively maintained. Copilot can analyze a repository and tell you about its recent activity.

1. On the GitHub website, go to the repository you want to chat about.
1. Click the **Copilot** icon at the top right of the page.
   GitHub Copilot Chat is displayed. The heading at the top of the chat panel will show the name of the repository as an attachment.
1. In the prompt box, type "Is this repository being actively maintained?" and press <kbd>Enter</kbd>.  Copilot replies in the chat panel.

You can also visit the **Pulse** view under the **Insights** tab in the repository to get an overview of recent activity. See the [`github/docs` Pulse](https://github.com/github/docs/pulse) for an example of what an active open source project looks like.

### Finding ways to contribute

There are many ways to contribute to open source projects.

* **Looking through the issue tracker**: Look for bugs that need fixing or reproduction, feature requests, or documentation improvements. Many open source projects use the `good first issue` or `help wanted` labels to make it easier for new contributors to find issues to work on.
* **Testing a pull request**: You can contribute by merging a pull request into your local copy of the project and testing the changes. Add the outcome of your testing in a comment on the pull request.
* **Installing and testing the project**: As you use an open source project, note any bugs, usability issues, or missing features you encounter. Sharing these pain points can provide valuable feedback to other contributors.
* **Improving the documentation**: Documentation improvements are almost always welcome, and can be an excellent way to start contributing while learning the project.
* **Adding tests**: Many projects need better test coverage, which helps you learn the codebase while adding value.

Each open source project will have a different approach to how they want to accept contributions. If you're looking to add a new feature or have discovered a bug, you'll want to open an issue outlining your proposed approach before investing significant development time. This can save effort by aligning with maintainer expectations early on.

Remember that non-code contributions like improving documentation, design, or community support are just as valuable as code contributions, and often have a lower barrier to entry.

### Next steps

Now that you've found an open source project to work on and have learned about different ways to contribute, you are ready to make your first contribution. Head over to [Contributing to open source](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-open-source) to walk through the end-to-end process of making a contribution.

## Setting guidelines for repository contributors

> Source: [GitHub Docs: Setting guidelines for repository contributors](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors) · CC BY 4.0

You can create guidelines to communicate how people should contribute to your project.

### About contributing guidelines

To help your project contributors do good work, you can add a file with contribution guidelines to your project repository's root, `docs`, or `.github` folder. When someone opens a pull request or creates an issue, they will see a link to that file. The link to the contributing guidelines also appears on your repository's `contribute` page. For an example of a `contribute` page, see [github/docs/contribute](https://github.com/github/docs/contribute).

If your repository includes a `CONTRIBUTING.md` file, GitHub also surfaces it in two other places to make it easier for contributors to discover:

* A " Contributing" tab in the repository overview (next to the " README" and " Code of conduct")
* A "Contributing" link in the repository sidebar

For the repository owner, contribution guidelines are a way to communicate how people should contribute.

For contributors, the guidelines help them verify that they're submitting well-formed pull requests and opening useful issues.

For both owners and contributors, contribution guidelines save time and hassle caused by improperly created pull requests or issues that have to be rejected and re-submitted.

You can create default contribution guidelines for your organization or personal account. For more information, see [Creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file).

> **Tip:**
> Repository maintainers can set specific guidelines for issues by creating an issue or pull request template for the repository. For more information, see [About issue and pull request templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates).

### Adding a `CONTRIBUTING.md` file

1. On GitHub, navigate to the main page of the repository.
1. Above the list of files, select the **Add file**  dropdown menu, then click **Create new file**.

   Alternatively, you can click  in the file tree view on the left.

1. Decide whether to store your contributing guidelines in your repository's root, `docs`, or `.github` directory. Then, in the filename field, type the name and extension for the file. Contributing guidelines filenames are not case sensitive. Files are rendered in rich text format if the file extension is in a supported format. For more information, see [Working with non code files](https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files#rendering-differences-in-prose-documents).
    * To make your contributing guidelines visible in the repository's root directory, type _CONTRIBUTING_.
    * To make your contributing guidelines visible in the repository's `docs` directory, type _docs/_ to create the new directory, then _CONTRIBUTING_.
    * If a repository contains more than one _CONTRIBUTING_ file, then the file shown in links is chosen from locations in the following order: the `.github` directory, then the repository's root directory, and finally the `docs` directory.
1. In the new file, add contribution guidelines. These could include:
    * Steps for creating good issues or pull requests.
    * Links to external documentation, mailing lists, or a code of conduct.
    * Community and behavioral expectations.
1. Click **Commit changes...**

1. In the "Commit message" field, type a short, meaningful commit message that describes the change you made to the file. You can attribute the commit to more than one author in the commit message. For more information, see [Creating a commit with multiple authors](https://docs.github.com/en/pull-requests/how-tos/commit-changes/creating-a-commit-with-multiple-authors).
1. Below the commit message fields, decide whether to add your commit to the current branch or to a new branch. If your current branch is the default branch, you should choose to create a new branch for your commit and then create a pull request. For more information, see [Creating a pull request](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request).

1. Click **Commit changes** or **Propose changes**.

### Examples of contribution guidelines

If you're stumped, here are some good examples of contribution guidelines:

* The GitHub Docs [contribution guidelines](https://docs.github.com/en/contributing).
* The Ruby on Rails [contribution guidelines](https://github.com/rails/rails/blob/main/CONTRIBUTING.md).
* The Open Government [contribution guidelines](https://github.com/opengovernment/opengovernment/blob/master/CONTRIBUTING.md).

### Further reading

* The Open Source Guides' section [Starting an Open Source Project](https://opensource.guide/starting-a-project/)
* [GitHub Skills](https://skills.github.com/)
* [Adding a license to a repository](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-license-to-a-repository)

## Contributing to a project

> Source: [GitHub Docs: Contributing to a project](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project) · CC BY 4.0

Learn how to contribute to a project through forking.

Contributing to a project on GitHub is an essential skill for developers and collaborators working together to achieve shared goals. Whether you're fixing bugs, adding features, or improving documentation, the process of contributing ensures structured and efficient collaboration.

By following the GitHub flow of forking repositories, creating branches, and submitting pull requests, you can propose changes to a project and get feedback without disrupting other people's work.

This guide provides instructions on contributing to a project using the GitHub UI and the command line. For more information on contributing with GitHub Desktop, see [Cloning and forking repositories from github desktop](https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-and-forking-repositories-from-github-desktop). For the same with GitHub CLI (Command Line Interface), see [Quickstart](https://docs.github.com/en/github-cli/github-cli/quickstart).

### About forking

If you want to contribute to someone else's project but don’t have permission to make changes directly, you can create your own copy of the project, make updates, and then suggest those updates for inclusion in the main project. This process is often called a "fork and pull request" workflow.

When you create your own copy (or "fork") of a project, it’s like making a new workspace that shares code with the original project. This is useful for open-source projects or anytime you don’t have write access to the original project.

Once you’ve made your changes in your copy, you can submit them as a pull request, which is a way to propose changes back to the main project. For more information, see [Fork a repo](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo).

### Creating your own copy of a project

This tutorial uses [the Spoon-Knife project](https://github.com/octocat/Spoon-Knife), a test repository that's hosted on GitHub that lets you test the fork and pull request workflow.

1. Navigate to the `Spoon-Knife` project at https://github.com/octocat/Spoon-Knife.
1. In the top-right corner of the page, click **Fork**.

1. Under "Owner," select the dropdown menu and click an owner for the forked repository.
   > **Note:** If your username is grayed out, it's because the fork already exists. Instead, you should bring your existing fork up to date. For more information, see [Syncing a fork](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/syncing-a-fork#syncing-a-fork-branch-from-the-web-ui).
1. By default, forks are named the same as their upstream repositories. Optionally, to further distinguish your fork, in the "Repository name" field, type a name.
1. Optionally, in the "Description" field, type a description of your fork.
1. Optionally, select **Copy the DEFAULT branch only**.

    For many forking scenarios, such as contributing to open-source projects, you only need to copy the default branch. If you do not select this option, all branches will be copied into the new fork.
1. Click **Create fork**.

> **Note:**
> If you want to copy additional branches from the upstream repository, you can do so from the **Branches** page. For more information, see [Managing branches within your repository](https://docs.github.com/en/pull-requests/how-tos/commit-changes/managing-branches-within-your-repository).

### Cloning a fork to your computer

You've successfully forked the Spoon-Knife repository, but so far, it only exists on GitHub. To be able to work on the project, you will need to clone it to your computer.

You can clone your fork with the command line, GitHub CLI, or GitHub Desktop.

1. On GitHub, navigate to **your fork** of the Spoon-Knife repository.
1. Above the list of files, click **Code**.

1. Copy the URL for the repository.

   * To clone the repository using HTTPS, under "HTTPS", click .
   * To clone the repository using an SSH key, including a certificate issued by your organization's SSH certificate authority, click **SSH**, then click .
   * To clone a repository using GitHub CLI, click **GitHub CLI**, then click .

1. On Mac or Linux, open Terminal. On Windows, open Git Bash.
1. Change the current working directory to the location where you want the cloned directory.
1. Type `git clone`, and then paste the URL you copied earlier. It will look like this, with your GitHub username instead of `YOUR-USERNAME`:

   ```shell
   git clone https://github.com/YOUR-USERNAME/Spoon-Knife
   ```

1. Press **Enter**. Your local clone will be created.

   ```shell
   $ git clone https://github.com/YOUR-USERNAME/Spoon-Knife
   > Cloning into `Spoon-Knife`...
   > remote: Counting objects: 10, done.
   > remote: Compressing objects: 100% (8/8), done.
   > remove: Total 10 (delta 1), reused 10 (delta 1)
   > Unpacking objects: 100% (10/10), done.
   ```

### Creating a branch to work on

Before making changes to the project, you should create a new branch and check it out. By keeping changes in their own branch, you follow GitHub flow and ensure that it will be easier to contribute to the same project again in the future. See [Github flow](https://docs.github.com/en/get-started/using-github/github-flow#following-github-flow).

```shell
git branch BRANCH-NAME
git checkout BRANCH-NAME
```

### Making and pushing changes

Go ahead and make a few changes to the project using your favorite text editor, like [Visual Studio Code](https://code.visualstudio.com). You could, for example, change the text in `index.html` to add your GitHub username.

When you're ready to submit your changes, stage and commit your changes. `git add .` tells Git that you want to include all of your changes in the next commit. `git commit` takes a snapshot of those changes.

```shell
git add .
git commit -m "a short description of the change"
```

When you stage and commit files, you essentially tell Git, "Take a snapshot of my changes." You can continue to make more changes and take more commit snapshots.

Right now, your changes only exist locally. When you're ready to push your changes up to GitHub, push your changes to the remote.

```shell
git push
```

### Making a pull request

Creating a pull request is the final step in producing a fork of someone else's project. When you've made a beneficial change and want to propose it to the original repository, you'll create a pull request for a maintainer to review.

To do so, navigate to the repository on GitHub where your project lives. For this example, it would be at `https://github.com/<your_username>/Spoon-Knife`. You'll see a banner indicating that your branch is one commit ahead of `octocat:main`. Click **Contribute** and then **Open a pull request**.

GitHub will bring you to a page that shows the differences between your fork and the `octocat/Spoon-Knife` repository. Click **Create pull request**.

GitHub will bring you to a page where you can enter a title and a description of your changes. It's important to provide as much useful information and a rationale for why you're making this pull request in the first place. The project owner needs to be able to determine whether your change is as useful to everyone as you think it is. Finally, click **Create pull request**.

### Familiarizing yourself with a project

If you're new to a project, you can use Copilot to help you understand the purpose of the repository, examine files, and dive into specific lines of code. See [Using github copilot to explore projects](https://docs.github.com/en/get-started/exploring-projects-on-github/using-github-copilot-to-explore-projects).

## Contributing to a Project

> Source: [Pro Git, 2nd ed., §5.2 Contributing to a Project](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project) · CC BY-NC-SA 3.0

The main difficulty with describing how to contribute to a project are the numerous variations on how to do that.
Because Git is very flexible, people can and do work together in many ways, and it's problematic to describe how you should contribute — every project is a bit different.
Some of the variables involved are active contributor count, chosen workflow, your commit access, and possibly the external contribution method.

The first variable is active contributor count — how many users are actively contributing code to this project, and how often?
In many instances, you'll have two or three developers with a few commits a day, or possibly less for somewhat dormant projects.
For larger companies or projects, the number of developers could be in the thousands, with hundreds or thousands of commits coming in each day.
This is important because with more and more developers, you run into more issues with making sure your code applies cleanly or can be easily merged.
Changes you submit may be rendered obsolete or severely broken by work that is merged in while you were working or while your changes were waiting to be approved or applied.
How can you keep your code consistently up to date and your commits valid?

The next variable is the workflow in use for the project.
Is it centralized, with each developer having equal write access to the main codeline?
Does the project have a maintainer or integration manager who checks all the patches?
Are all the patches peer-reviewed and approved?
Are you involved in that process?
Is a lieutenant system in place, and do you have to submit your work to them first?

The next variable is your commit access.
The workflow required in order to contribute to a project is much different if you have write access to the project than if you don't.
If you don't have write access, how does the project prefer to accept contributed work?
Does it even have a policy?
How much work are you contributing at a time?
How often do you contribute?

All these questions can affect how you contribute effectively to a project and what workflows are preferred or available to you.
We'll cover aspects of each of these in a series of use cases, moving from simple to more complex; you should be able to construct the specific workflows you need in practice from these examples.

### Commit Guidelines

Before we start looking at the specific use cases, here's a quick note about commit messages.
Having a good guideline for creating commits and sticking to it makes working with Git and collaborating with others a lot easier.
The Git project provides a document that lays out a number of good tips for creating commits from which to submit patches — you can read it in the Git source code in the `Documentation/SubmittingPatches` file.

First, your submissions should not contain any whitespace errors.
Git provides an easy way to check for this — before you commit, run `git diff --check`, which identifies possible whitespace errors and lists them for you.

If you run that command before committing, you can tell if you're about to commit whitespace issues that may annoy other developers.

Next, try to make each commit a logically separate changeset.
If you can, try to make your changes digestible — don't code for a whole weekend on five different issues and then submit them all as one massive commit on Monday.
Even if you don't commit during the weekend, use the staging area on Monday to split your work into at least one commit per issue, with a useful message per commit.
If some of the changes modify the same file, try to use `git add --patch` to partially stage files (covered in detail in "Interactive Staging" (Pro Git)).
The project snapshot at the tip of the branch is identical whether you do one commit or five, as long as all the changes are added at some point, so try to make things easier on your fellow developers when they have to review your changes.

This approach also makes it easier to pull out or revert one of the changesets if you need to later.
"Rewriting History" (Pro Git) describes a number of useful Git tricks for rewriting history and interactively staging files — use these tools to help craft a clean and understandable history before sending the work to someone else.

The last thing to keep in mind is the commit message.
Getting in the habit of creating quality commit messages makes using and collaborating with Git a lot easier.
As a general rule, your messages should start with a single line that's no more than about 50 characters and that describes the changeset concisely, followed by a blank line, followed by a more detailed explanation.
The Git project requires that the more detailed explanation include your motivation for the change and contrast its implementation with previous behavior — this is a good guideline to follow.
Write your commit message in the imperative: "Fix bug" and not "Fixed bug" or "Fixes bug."
Here is a template you can follow, which we've lightly adapted from one [originally written by Tim Pope](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html):

```text
Capitalized, short (50 chars or less) summary

More detailed explanatory text, if necessary.  Wrap it to about 72
characters or so.  In some contexts, the first line is treated as the
subject of an email and the rest of the text as the body.  The blank
line separating the summary from the body is critical (unless you omit
the body entirely); tools like rebase will confuse you if you run the
two together.

Write your commit message in the imperative: "Fix bug" and not "Fixed bug"
or "Fixes bug."  This convention matches up with commit messages generated
by commands like git merge and git revert.

Further paragraphs come after blank lines.

- Bullet points are okay, too

- Typically a hyphen or asterisk is used for the bullet, followed by a
  single space, with blank lines in between, but conventions vary here

- Use a hanging indent
```

If all your commit messages follow this model, things will be much easier for you and the developers with whom you collaborate.
The Git project has well-formatted commit messages — try running `git log --no-merges` there to see what a nicely-formatted project-commit history looks like.

> **Note — Do as we say, not as we do.:**
>
> For the sake of brevity, many of the examples in this book don't have nicely-formatted commit messages like this; instead, we simply use the `-m` option to `git commit`.
>
> In short, do as we say, not as we do.

### Forked Public Project

Contributing to public projects is a bit different.
Because you don't have the permissions to directly update branches on the project, you have to get the work to the maintainers some other way.
This first example describes contributing via forking on Git hosts that support easy forking.
Many hosting sites support this (including GitHub, BitBucket, repo.or.cz, and others), and many project maintainers expect this style of contribution.
The next section deals with projects that prefer to accept contributed patches via email.

First, you'll probably want to clone the main repository, create a topic branch for the patch or patch series you're planning to contribute, and do your work there.
The sequence looks basically like this:

```console
$ git clone <url>
$ cd project
$ git checkout -b featureA
  ... work ...
$ git commit
  ... work ...
$ git commit
```

> **Note:**
>
> You may want to use `rebase -i` to squash your work down to a single commit, or rearrange the work in the commits to make the patch easier for the maintainer to review — see "Rewriting History" (Pro Git) for more information about interactive rebasing.

When your branch work is finished and you're ready to contribute it back to the maintainers, go to the original project page and click the "Fork" button, creating your own writable fork of the project.
You then need to add this repository URL as a new remote of your local repository; in this example, let's call it `myfork`:

```console
$ git remote add myfork <url>
```

You then need to push your new work to this repository.
It's easiest to push the topic branch you're working on to your forked repository, rather than merging that work into your `master` branch and pushing that.
The reason is that if your work isn't accepted or is cherry-picked, you don't have to rewind your `master` branch (the Git `cherry-pick` operation is covered in more detail in "Rebase Cherry Pick" (Pro Git)).
If the maintainers `merge`, `rebase`, or `cherry-pick` your work, you'll eventually get it back via pulling from their repository anyhow.

In any event, you can push your work with:

```console
$ git push -u myfork featureA
```

Once your work has been pushed to your fork of the repository, you need to notify the maintainers of the original project that you have work you'd like them to merge.
This is often called a _pull request_, and you typically generate such a request either via the website — GitHub has its own "Pull Request" mechanism that we'll go over in "Github" (Pro Git) — or you can run the `git request-pull` command and email the subsequent output to the project maintainer manually.

The `git request-pull` command takes the base branch into which you want your topic branch pulled and the Git repository URL you want them to pull from, and produces a summary of all the changes you're asking to be pulled.
For instance, if Jessica wants to send John a pull request, and she's done two commits on the topic branch she just pushed, she can run this:

```console
$ git request-pull origin/master myfork
The following changes since commit 1edee6b1d61823a2de3b09c160d7080b8d1b3a40:
Jessica Smith (1):
        Create new function

are available in the git repository at:

  https://githost/simplegit.git featureA

Jessica Smith (2):
      Add limit to log function
      Increase log output to 30 from 25

 lib/simplegit.rb |   10 +++++++++-
 1 files changed, 9 insertions(+), 1 deletions(-)
```

This output can be sent to the maintainer — it tells them where the work was branched from, summarizes the commits, and identifies from where the new work is to be pulled.

On a project for which you're not the maintainer, it's generally easier to have a branch like `master` always track `origin/master` and to do your work in topic branches that you can easily discard if they're rejected.
Having work themes isolated into topic branches also makes it easier for you to rebase your work if the tip of the main repository has moved in the meantime and your commits no longer apply cleanly.
For example, if you want to submit a second topic of work to the project, don't continue working on the topic branch you just pushed up — start over from the main repository's `master` branch:

```console
$ git checkout -b featureB origin/master
  ... work ...
$ git commit
$ git push myfork featureB
$ git request-pull origin/master myfork
  ... email generated request pull to maintainer ...
$ git fetch origin
```

Now, each of your topics is contained within a silo — similar to a patch queue — that you can rewrite, rebase, and modify without the topics interfering or interdepending on each other, like so:

Let's say the project maintainer has pulled in a bunch of other patches and tried your first branch, but it no longer cleanly merges.
In this case, you can try to rebase that branch on top of `origin/master`, resolve the conflicts for the maintainer, and then resubmit your changes:

```console
$ git checkout featureA
$ git rebase origin/master
$ git push -f myfork featureA
```

This rewrites your history to now look like the figure "Commit history after `featureA` work" (in the online book).

Because you rebased the branch, you have to specify the `-f` to your push command in order to be able to replace the `featureA` branch on the server with a commit that isn't a descendant of it.
An alternative would be to push this new work to a different branch on the server (perhaps called `featureAv2`).

Let's look at one more possible scenario: the maintainer has looked at work in your second branch and likes the concept but would like you to change an implementation detail.
You'll also take this opportunity to move the work to be based off the project's current `master` branch.
You start a new branch based off the current `origin/master` branch, squash the `featureB` changes there, resolve any conflicts, make the implementation change, and then push that as a new branch:

```console
$ git checkout -b featureBv2 origin/master
$ git merge --squash featureB
  ... change implementation ...
$ git commit
$ git push myfork featureBv2
```

The `--squash` option takes all the work on the merged branch and squashes it into one changeset producing the repository state as if a real merge happened, without actually making a merge commit.
This means your future commit will have one parent only and allows you to introduce all the changes from another branch and then make more changes before recording the new commit.
Also the `--no-commit` option can be useful to delay the merge commit in case of the default merge process.

At this point, you can notify the maintainer that you've made the requested changes, and that they can find those changes in your `featureBv2` branch.
