# GitHub Actions basics

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Quickstart for GitHub Actions](https://docs.github.com/en/actions/get-started/quickstart) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Understanding GitHub Actions

> Source: [GitHub Docs: Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions) · CC BY 4.0

Learn the basics of core concepts and essential terminology in GitHub Actions.

### Overview

GitHub Actions is a continuous integration and continuous delivery (CI/CD) platform that allows you to automate your build, test, and deployment pipeline. You can create workflows that build and test every pull request to your repository, or deploy merged pull requests to production.

GitHub Actions goes beyond just DevOps and lets you run workflows when other events happen in your repository. For example, you can run a workflow to automatically add the appropriate labels whenever someone creates a new issue in your repository.

GitHub provides Linux, Windows, and macOS virtual machines to run your workflows, or you can host your own self-hosted runners in your own data center or cloud infrastructure.

For more information about introducing GitHub Actions to your enterprise, see [Introducing github actions to your enterprise](https://docs.github.com/en/admin/managing-github-actions-for-your-enterprise/getting-started-with-github-actions-for-your-enterprise/introducing-github-actions-to-your-enterprise).

### The components of GitHub Actions

You can configure a GitHub Actions **workflow** to be triggered when an **event** occurs in your repository, such as a pull request being opened or an issue being created. Your workflow contains one or more **jobs** which can run in sequential order or in parallel. Each job will run inside its own virtual machine **runner**, or inside a container, and has one or more **steps** that either run a script that you define or run an **action**, which is a reusable extension that can simplify your workflow.

#### Workflows

A **workflow** is a configurable automated process that will run one or more jobs. Workflows are defined by a YAML file checked in to your repository and will run when triggered by an event in your repository, or they can be triggered manually, or at a defined schedule.

Workflows are defined in the `.github/workflows` directory in a repository. A repository can have multiple workflows, each of which can perform a different set of tasks such as:
* Building and testing pull requests
* Deploying your application every time a release is created
* Adding a label whenever a new issue is opened

You can reference a workflow within another workflow. For more information, see [Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).

For more information, see [Write workflows](https://docs.github.com/en/actions/how-tos/write-workflows).

#### Events

An **event** is a specific activity in a repository that triggers a **workflow** run. For example, an activity can originate from GitHub when someone creates a pull request, opens an issue, or pushes a commit to a repository. You can also trigger a workflow to run on a [schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), by [posting to a REST API](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event), or manually.

For a complete list of events that can be used to trigger workflows, see [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

#### Jobs

A **job** is a set of **steps** in a workflow that is executed on the same **runner**. Each step is either a shell script that will be executed, or an **action** that will be run. Steps are executed in order and are dependent on each other. Since each step is executed on the same runner, you can share data from one step to another. For example, you can have a step that builds your application followed by a step that tests the application that was built.

Steps run in order by default, but you can also run selected steps concurrently when your workflow benefits from parallel execution, such as starting a long-running service while later steps continue. For more information, see [Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idstepsbackground).

You can configure a job's dependencies with other jobs; by default, jobs have no dependencies and run in parallel. When a job takes a dependency on another job, it waits for the dependent job to complete before running.

You can also use a **matrix** to run the same job multiple times, each with a different combination of variables—like operating systems or language versions.

For example, you might configure multiple build jobs for different architectures without any job dependencies and a packaging job that depends on those builds. The build jobs run in parallel, and once they complete successfully, the packaging job runs.

For more information, see [Choose what workflows do](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do).

#### Actions

An **action** is a pre-defined, reusable set of jobs or code that performs specific tasks within a **workflow**, reducing the amount of repetitive code you write in your workflow files. Actions can perform tasks such as:

* Pulling your Git repository from GitHub
* Setting up the correct toolchain for your build environment
* Setting up authentication to your cloud provider

You can write your own actions, or you can find actions to use in your workflows in the GitHub Marketplace.

To share actions across your enterprise without publishing the actions publicly, you can store the actions in an internal repository, then configure the repository to allow access to GitHub Actions workflows in other repositories owned by the same organization or by any organization in the enterprise. For more information, see [Share with your enterprise](https://docs.github.com/en/actions/how-tos/reuse-automations/share-with-your-enterprise).

For more information on actions, see [Reuse automations](https://docs.github.com/en/actions/how-tos/reuse-automations).

#### Runners

A **runner** is a server that runs your workflows when they're triggered. Each runner can run a single **job** at a time.
GitHub provides Ubuntu Linux, Microsoft Windows, and macOS runners to run your **workflows**. Each workflow run executes in a fresh, newly-provisioned virtual machine.

 GitHub also offers larger runners, which are available in larger configurations. For more information, see [Larger runners](https://docs.github.com/en/actions/how-tos/manage-runners/larger-runners).

If you need a different operating system or require a specific hardware configuration, you can host your own runners.

For more information about self-hosted runners, see [Self hosted runners](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners).

### Next steps

GitHub Actions can help you automate nearly every aspect of your application development processes. Ready to get started? Here are some helpful resources for taking your next steps with GitHub Actions:

* To create a GitHub Actions workflow, see [Use workflow templates](https://docs.github.com/en/actions/how-tos/write-workflows/use-workflow-templates).
* For continuous integration (CI) workflows, see [Build and test code](https://docs.github.com/en/actions/tutorials/build-and-test-code).
* For building and publishing packages, see [Publish packages](https://docs.github.com/en/actions/tutorials/publish-packages).
* For deploying projects, see [Deploy to third party platforms](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms).
* For automating tasks and processes on GitHub, see [Manage your work](https://docs.github.com/en/actions/tutorials/manage-your-work).
* For examples that demonstrate more complex features of GitHub Actions, see [Choose what workflows do](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do). These detailed examples explain how to test your code on a runner, access the GitHub CLI, and use advanced features such as concurrency and test matrices.
* To certify your proficiency in automating workflows and accelerating development with GitHub Actions, earn a GitHub Actions certificate with GitHub Certifications. For more information, see [About github certifications](https://docs.github.com/en/get-started/showcase-your-expertise-with-github-certifications/about-github-certifications).

> **Note:**
> For automations that require contextual judgment about your repository's content, you can also author agentic workflows in natural language instead of a traditional GitHub Actions workflow. For more information, see [Quickstart](https://docs.github.com/en/copilot/how-tos/github-agentic-workflows/quickstart) and [Creating github agentic workflows](https://docs.github.com/en/copilot/how-tos/github-agentic-workflows/creating-github-agentic-workflows).

### Further reading

* [About github actions for enterprises](https://docs.github.com/en/admin/managing-github-actions-for-your-enterprise/getting-started-with-github-actions-for-your-enterprise/about-github-actions-for-enterprises)

## Quickstart for GitHub Actions

> Source: [GitHub Docs: Quickstart for GitHub Actions](https://docs.github.com/en/actions/get-started/quickstart) · CC BY 4.0

Try out the core features of GitHub Actions in minutes.

### Introduction

GitHub Actions is a continuous integration and continuous delivery (CI/CD) platform that allows you to automate your build, test, and deployment pipeline. You can create workflows that run tests whenever you push a change to your repository, or that deploy merged pull requests to production.

This quickstart guide shows you how to use the user interface of GitHub to add a workflow that demonstrates some of the essential features of GitHub Actions.

To get started with preconfigured workflows, browse through the list of templates in the [actions/starter-workflows](https://github.com/actions/starter-workflows) repository. For more information, see [Use workflow templates](https://docs.github.com/en/actions/how-tos/write-workflows/use-workflow-templates).

For an overview of GitHub Actions workflows, see [Workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows). If you want to learn about the various components that make up GitHub Actions, see [Understand github actions](https://docs.github.com/en/actions/get-started/understand-github-actions).

### Using workflow templates

GitHub provides preconfigured workflow templates that you can use as-is or customize to create your own workflow. GitHub analyzes your code and shows you workflow templates that might be useful for your repository. For example, if your repository contains Node.js code, you'll see suggestions for Node.js projects.

These workflow templates are designed to help you get up and running quickly, offering a range of configurations such as:
* CI: [Continuous Integration workflows](https://github.com/actions/starter-workflows/tree/main/ci)
* Deployments: [Deployment workflows](https://github.com/actions/starter-workflows/tree/main/deployments)
* Automation: [Automating workflows](https://github.com/actions/starter-workflows/tree/main/automation)
* Code Scanning: [Code Scanning workflows](https://github.com/actions/starter-workflows/tree/main/code-scanning)
* Pages: [Pages workflows](https://github.com/actions/starter-workflows/tree/main/pages)

Use these workflows as a starting place to build your custom workflow or use them as-is. You can browse the full list of workflow templates in the [actions/starter-workflows](https://github.com/actions/starter-workflows) repository.

### Prerequisites

This guide assumes that:
* You have at least a basic knowledge of how to use GitHub. If you don't, you'll find it helpful to read some of the articles in the documentation for repositories and pull requests first. For example, see [Quickstart for repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories), [Branches](https://docs.github.com/en/pull-requests/reference/branches), and [Pull requests](https://docs.github.com/en/pull-requests/reference/pull-requests).
* You have a repository on GitHub where you can add files.
* You have access to GitHub Actions.

  > **Note:** If the **Actions** tab is not displayed under the name of your repository on GitHub, it may be because Actions is disabled for the repository. For more information, see [Managing github actions settings for a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository).

### Creating your first workflow

1. In your repository on GitHub, create a workflow file called `github-actions-demo.yml` in the `.github/workflows` directory. To do this:
   * If the `.github/workflows` directory already exists, navigate to that directory on GitHub, click **Add file**, then click **Create new file**, and name the file `github-actions-demo.yml`.
   * If your repository doesn't have a `.github/workflows` directory, go to the main page of the repository on GitHub, click **Add file**, then click **Create new file**, and name the file `.github/workflows/github-actions-demo.yml`. This creates the `.github` and `workflows` directories and the `github-actions-demo.yml` file in a single step.

   > **Note:**
   > For GitHub to discover any GitHub Actions workflows in your repository, you must save the workflow files in a directory called `.github/workflows`.
   >
   > You can give the workflow file any name you like, but you must use `.yml` or `.yaml` as the file name extension. YAML is a markup language that's commonly used for configuration files.

1. Copy the following YAML contents into the `github-actions-demo.yml` file:

   ```yaml copy
   name: GitHub Actions Demo
   run-name: ${{ github.actor }} is testing out GitHub Actions 🚀
   on: [push]
   jobs:
     Explore-GitHub-Actions:
       runs-on: ubuntu-latest
       steps:
         - run: echo "🎉 The job was automatically triggered by a ${{ github.event_name }} event."
         - run: echo "🐧 This job is now running on a ${{ runner.os }} server hosted by GitHub!"
         - run: echo "🔎 The name of your branch is ${{ github.ref }} and your repository is ${{ github.repository }}."
         - name: Check out repository code
           uses: actions/checkout@v6
         - run: echo "💡 The ${{ github.repository }} repository has been cloned to the runner."
         - run: echo "🖥️ The workflow is now ready to test your code on the runner."
         - name: List files in the repository
           run: |
             ls ${{ github.workspace }}
         - run: echo "🍏 This job's status is ${{ job.status }}."
   ```

   At this stage you don't need to understand the details of this workflow. For now, you can just copy and paste the contents into the file. After completing this quickstart guide, you can learn about the syntax of workflow files in [Workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows), and for an explanation of GitHub Actions contexts, such as `${{ github.actor }}` and `${{ github.event_name }}`, see [Contexts](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts).

1. Click **Commit changes**.
1. In the "Propose changes" dialog, select either the option to commit to the default branch or the option to create a new branch and start a pull request. Then click **Commit changes** or **Propose changes**.

Committing the workflow file to a branch in your repository triggers the `push` event and runs your workflow.

If you chose to start a pull request, you can continue and create the pull request, but this is not necessary for the purposes of this quickstart because the commit has still been made to a branch and will trigger the new workflow.

### Viewing your workflow results

1. On GitHub, navigate to the main page of the repository.
1. Under your repository name, click **Actions**.

1. In the left sidebar, click the workflow you want to display, in this example "GitHub Actions Demo."

1. From the list of workflow runs, click the name of the run you want to see, in this example "USERNAME is testing out GitHub Actions."
1. In the left sidebar of the workflow run page, under **Jobs**, click the **Explore-GitHub-Actions** job.

1. The log shows you how each of the steps was processed. Expand any of the steps to view its details.

   For example, you can see the list of files in your repository:

The example workflow you just added is triggered each time code is pushed to the branch, and shows you how GitHub Actions can work with the contents of your repository. For an in-depth tutorial, see [Understand github actions](https://docs.github.com/en/actions/get-started/understand-github-actions).

### Next steps

GitHub Actions can help you automate nearly every aspect of your application development processes. Ready to get started? Here are some helpful resources for taking your next steps with GitHub Actions:

* To create a GitHub Actions workflow, see [Use workflow templates](https://docs.github.com/en/actions/how-tos/write-workflows/use-workflow-templates).
* For continuous integration (CI) workflows, see [Build and test code](https://docs.github.com/en/actions/tutorials/build-and-test-code).
* For building and publishing packages, see [Publish packages](https://docs.github.com/en/actions/tutorials/publish-packages).
* For deploying projects, see [Deploy to third party platforms](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms).
* For automating tasks and processes on GitHub, see [Manage your work](https://docs.github.com/en/actions/tutorials/manage-your-work).
* For examples that demonstrate more complex features of GitHub Actions, see [Choose what workflows do](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do). These detailed examples explain how to test your code on a runner, access the GitHub CLI, and use advanced features such as concurrency and test matrices.
* To certify your proficiency in automating workflows and accelerating development with GitHub Actions, earn a GitHub Actions certificate with GitHub Certifications. For more information, see [About github certifications](https://docs.github.com/en/get-started/showcase-your-expertise-with-github-certifications/about-github-certifications).
