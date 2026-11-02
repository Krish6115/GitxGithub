# Understanding an unfamiliar repository on GitHub

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: About the repository README file](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Navigating code on GitHub](https://docs.github.com/en/repositories/working-with-files/using-files/navigating-code-on-github) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: About GitHub Code Search](https://docs.github.com/en/search-github/github-code-search/about-github-code-search) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Dependency graph](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-graph) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Viewing a project's contributors](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-a-projects-contributors) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## About the repository README file

> Source: [GitHub Docs: About the repository README file](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) · CC BY 4.0

You can add a README file to your repository to tell other people why your project is useful, what they can do with your project, and how they can use it.

### About READMEs

You can add a README file to a repository to communicate important information about your project. A README, along with a repository license, citation file, contribution guidelines, and a code of conduct, communicates expectations for your project and helps you manage contributions.

For more information about providing guidelines for your project, see [Adding a code of conduct to your project](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-code-of-conduct-to-your-project) and [Setting up your project for healthy contributions](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions).

A README is often the first item a visitor will see when visiting your repository. README files typically include information on:
* What the project does
* Why the project is useful
* How users can get started with the project
* Where users can get help with your project
* Who maintains and contributes to the project

If you put your README file in your repository's hidden `.github`, root, or `docs` directory, GitHub will recognize and automatically surface your README to repository visitors.

If a repository contains more than one README file, then the file shown is chosen from locations in the following order: the `.github` directory, then the repository's root directory, and finally the `docs` directory.

When your README is viewed on GitHub, any content beyond 500 KiB will be truncated.

If you add a README file to the root of a public repository with the same name as your username, that README will automatically appear on your profile page. You can edit your profile README with GitHub Flavored Markdown to create a personalized section on your profile. For more information, see [Managing your profile readme](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme).

### Auto-generated table of contents for markdown files

For the rendered view of any Markdown file in a repository, including README files, GitHub will automatically generate a table of contents based on section headings. You can view the table of contents for a README file by clicking the "Outline" menu icon  in the top corner of the rendered page.

### Section links in markdown files and blob pages

You can link directly to any section that has a heading. To view the automatically generated anchor in a rendered file, hover over the section heading to expose the  icon and click the icon to display the anchor in your browser.

For more detailed information about section links, see [Section links](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#section-links).

### Relative links and image paths in markdown files

You can define relative links and image paths in your rendered files to help readers navigate to other files in your repository.

A relative link is a link that is relative to the current file. For example, if you have a README file in root of your repository, and you have another file in _docs/CONTRIBUTING.md_, the relative link to _CONTRIBUTING.md_ in your README might look like this:

```text
[Contribution guidelines for this project](docs/CONTRIBUTING.md)
```

GitHub will automatically transform your relative link or image path based on whatever branch you're currently on, so that the link or path always works. The path of the link will be relative to the current file. Links starting with `/` will be relative to the repository root. You can use all relative link operands, such as `./` and `../`.

Your link text should be on a single line. The example below will not work.

```markdown
[Contribution
guidelines for this project](docs/CONTRIBUTING.md)
```

Relative links are easier for users who clone your repository. Absolute links may not work in clones of your repository - we recommend using relative links to refer to other files within your repository.

### Wikis

A README should only contain information necessary for developers to get started using and contributing to your project. Longer documentation is best suited for wikis. For more information, see [About wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis).

### Further reading

* [Adding a file to a repository](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
* [5 tips for making your GitHub profile page accessible](https://github.blog/2023-10-26-5-tips-for-making-your-github-profile-page-accessible/) in the GitHub blog

* [Facilitating quick creation and resumption of codespaces](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/setting-up-your-repository/facilitating-quick-creation-and-resumption-of-codespaces)

## About code owners

> Source: [GitHub Docs: About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) · CC BY 4.0

You can use a CODEOWNERS file to define individuals or teams that are responsible for code in a repository.

### About code owners

Code owners are automatically requested for review when someone opens a pull request that modifies code that they own. Code owners are not automatically requested to review draft pull requests. For more information about draft pull requests, see [Pull requests](https://docs.github.com/en/pull-requests/reference/pull-requests#draft-pull-requests). When you mark a draft pull request as ready for review, code owners are automatically notified. If you convert a pull request to a draft, people who are already subscribed to notifications are not automatically unsubscribed. For more information, see [Changing the stage of a pull request](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/changing-the-stage-of-a-pull-request).

When someone with admin or owner permissions has enabled required reviews, they also can optionally require approval from a code owner before the author can merge a pull request in the repository. For more information, see [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-pull-request-reviews-before-merging).

If a file has a code owner, you can see who the code owner is before you open a pull request. In the repository, you can browse to the file and hover over  to see a tool tip with codeownership details.

### CODEOWNERS file location

To use a CODEOWNERS file, create a new file called `CODEOWNERS` in the `.github/`, root, or `docs/` directory of the repository, in the branch where you'd like to add the code owners. If `CODEOWNERS` files exist in more than one of those locations, GitHub will search for them in that order and use the first one it finds.

Each CODEOWNERS file assigns the code owners for a single branch in the repository. Thus, you can assign different code owners for different branches, such as `@octo-org/codeowners-team` for a code base on the default branch and `@octocat` for a GitHub Pages site on the `gh-pages` branch.

For code owners to receive review requests, the CODEOWNERS file must be on the base branch of the pull request. For example, if you assign `@octocat` as the code owner for _.js_ files on the `gh-pages` branch of your repository, `@octocat` will receive review requests when a pull request with changes to _.js_ files is opened between the head branch and `gh-pages`.

## Navigating code on GitHub

> Source: [GitHub Docs: Navigating code on GitHub](https://docs.github.com/en/repositories/working-with-files/using-files/navigating-code-on-github) · CC BY 4.0

You can understand the relationships within and across repositories by navigating code directly in GitHub.

<!-- If you make changes to this feature, check whether any of the changes affect languages listed in /get-started/learning-about-github/github-language-support. If so, please update the article accordingly. -->

### About navigating code on GitHub

Code navigation helps you to read, navigate, and understand code by showing and linking definitions of a named entity corresponding to a reference to that entity, as well as references corresponding to an entity's definition.

Code navigation uses the open source [`tree-sitter`](https://github.com/tree-sitter/tree-sitter) library. The following languages support code navigation.

* Bash
* C
* C#
* C++
* CodeQL
* Elixir
* Go
* JSX
* Java
* JavaScript
* Lua
* PHP
* Protocol Buffers
* Python
* R
* Ruby
* Rust
* Scala
* Starlark
* Swift
* Typescript

You do not need to configure anything in your repository to enable code navigation. We will automatically extract code navigation information for these supported languages in all repositories.

GitHub has developed a code navigation approach based on the open source [`tree-sitter`](https://github.com/tree-sitter/tree-sitter) library that searches all definitions and references across a repository to find entities with a given name.

You can use keyboard shortcuts to navigate within a code file. For more information, see [Keyboard shortcuts](https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts#navigating-within-code-files).

### Using the symbols pane

You can now quickly view and navigate between symbols such as functions or classes in your code with the symbols pane. You can search for a symbol in a single file, in all files in a repository, or even in all public repositories on GitHub.

Symbol search is a feature of code search. For more information, see [Understanding github code search syntax](https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax#symbol-qualifier).

1. Select a repository, then navigate to a file containing symbols.
1. To bring up the symbols pane, above the file content, click .

   Alternatively, you can open the symbols pane by clicking an eligible symbol in your file. Clickable symbols are highlighted in yellow when you hover over them.

1. Click the symbol you would like to find from the symbols pane or within the file itself.

   * To search for a symbol in the repository as a whole, in the symbols pane, click **Search for this symbol in this repository**. To search for a symbol in all repositories on GitHub, click **all repositories**.

1. To navigate between references to a symbol, click  or .
1. To navigate to a specific reference to a symbol, click a result of the symbol search under **In this file**.
1. To exit the search for a specific symbol, click **All Symbols**.

### Jumping to the definition of a function or method

You can jump to a function or method's definition within the same repository by clicking the function or method call in a file.

### Finding all references of a function or method

You can find all references for a function or method within the same repository by clicking the function or method call in a file.

### Troubleshooting code navigation

If code navigation is enabled for you but you don't see links to the definitions of functions and methods:
* Code navigation only works for active branches. Push to the branch and try again.
* Code navigation only works for repositories with fewer than 100,000 files.

### Further reading

* [About github code search](https://docs.github.com/en/search-github/github-code-search/about-github-code-search)

## About GitHub Code Search

> Source: [GitHub Docs: About GitHub Code Search](https://docs.github.com/en/search-github/github-code-search/about-github-code-search) · CC BY 4.0

You can search, navigate and understand code across GitHub with code search.

### About GitHub code search

GitHub code search lets you rapidly search, navigate and understand your code, your team's code, and the code of the open source community. This search engine is designed to be scalable, code-aware, and support searching code across GitHub using regular expressions, boolean operations, specialized qualifiers, and symbol search. For more information on the syntax of code search, see [Understanding github code search syntax](https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax).

Code search is integrated with features in the search interface on GitHub, such as suggestions and completions. Your searches will be saved automatically and can be deleted at any time. On GitHub Mobile, you can use the same methods to search through code directly from the home screen. For more information, see [Using github code search](https://docs.github.com/en/search-github/github-code-search/using-github-code-search).

You must be logged in to a GitHub account to use code search, including for searching code in public repositories.

Note that the syntax and qualifiers for searching for non-code content, such as issues, users, and discussions, is not the same as the syntax for code search. For more information on non-code search, see [About searching on github](https://docs.github.com/en/search-github/getting-started-with-searching-on-github/about-searching-on-github) and [Searching on github](https://docs.github.com/en/search-github/searching-on-github).

### Code navigation

GitHub code search provides code navigation for supported languages. This includes jumping to the definition of and finding references for programming language constructs like classes, structs, functions, and methods. See [Navigating code on github](https://docs.github.com/en/repositories/working-with-files/using-files/navigating-code-on-github).

### Limitations

We have indexed many public repositories for code search, and continue to index more. Additionally, the private repositories of GitHub users are indexed and searchable by those that already have access to those private repositories on GitHub. However, very large repositories may not be indexed at this time, and not all code is indexed.

The current limitations on indexed code are:

* Vendored and generated code is excluded
* Empty files and files over 350 KiB are excluded
* Lines over 1,024 characters long are truncated
* Binary files (PDF, etc.) are excluded
* Only UTF-8 encoded files are included
* Very large repositories may not be indexed
* Exhaustive search is not supported
* Files with more than one line over 4096 bytes are excluded

We currently only support searching for code on the default branch of a repository. The query length is limited to 1000 characters.

Results for any search with code search are restricted to 100 results (5 pages). Sorting is not supported for code search results at this time. This limitation only applies to searching code with the new code search and does not apply to other types of searches.

If you use the `path:` qualifier for a file that's in multiple repositories with similar content, GitHub will only show a few of those files. If this happens, you can choose to expand by clicking **Show identical files** at the bottom of the page.

Code search supports searching for symbol definitions in code, such as function or class definitions, using the `symbol:` qualifier. However, note that the `symbol:` qualifier only searches for definitions and not references, and not all symbol types or languages are fully supported yet. For a list of what languages are supported, see [Understanding github code search syntax](https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax#symbol-qualifier).

On GitHub Mobile, you can use code search directly from the home screen. For more information, see [Using github code search](https://docs.github.com/en/search-github/github-code-search/using-github-code-search#using-github-code-search-on-github-mobile).

### Feedback and support

You can view and share feedback about code search in our [discussion forum](https://github.com/orgs/community/discussions/categories/code-search-and-navigation).

## Dependency graph

> Source: [GitHub Docs: Dependency graph](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-graph) · CC BY 4.0

You can use the dependency graph to identify all your project's dependencies. The dependency graph supports a range of popular package ecosystems.

<!--Marketing-LINK: From /features/security and /features/security/software-supply-chain pages "How GitHub's dependency graph is generated".-->

### About the dependency graph

The dependency graph is a summary of the manifest and lock files stored in a repository and any dependencies that are submitted for the repository using the GitHub. For each repository, it shows:

* Dependencies, the ecosystems and packages it depends on
* Dependents, the repositories and packages that depend on it

For each dependency, you can see the version, license information, the manifest file which included it, and whether it has known vulnerabilities. For package ecosystems supporting transitive dependencies, the relationship status will be displayed and you can click "", then "Show paths", to see the transitive path which brought in the dependency.

You can also search for a specific dependency using the search bar. Dependencies are sorted automatically with vulnerable packages at the top.

For information on the supported ecosystems and manifest files, see [Dependency graph supported package ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/dependency-graph-supported-package-ecosystems#supported-package-ecosystems).

When you create a pull request containing changes to dependencies that targets the default branch, GitHub uses the dependency graph to add dependency reviews to the pull request. These indicate whether the dependencies contain vulnerabilities and, if so, the version of the dependency in which the vulnerability was fixed. For more information, see [Dependency review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review).

### How the dependency graph is built

The dependency graph automatically parses dependencies by analyzing manifests and lock files in your repository. You can also submit data yourself. For more information, see [Dependency graph data](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-graph-data).

### Dependency graph availability

Repository administrators can enable or disable the dependency graph for repositories. For more information, see [Managing security and analysis settings for your repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository).

Repository administrators can enable or disable the dependency graph for repositories. See [Enable dependency graph](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/enable-dependency-graph).

### Dependents and "used by" data

For public repositories, the dependency graph lists dependents. These are other public repositories that depend on the repository or on packages that it publishes. This information is not reported for private repositories.

Some repositories have a "Used by" section in the sidebar of the **Code** tab. This section shows the number of public references to a package that were found, and displays the avatars of some of the owners of the dependent projects. Clicking any item in this section takes you to the **Dependents** tab of the dependency graph.

Your repository will have a "Used by" section if:
* The dependency graph is enabled for the repository.
* Your repository contains a package that is published on a supported package ecosystem. See [Dependency graph supported package ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/dependency-graph-supported-package-ecosystems#supported-package-ecosystems).
* Within the ecosystem, your package has a link to a _public_ repository where the source is stored.
* More than 100 repositories depend on your package.

The "Used by" section represents a single package from the repository. If you have admin permissions to a repository that contains multiple packages, you can choose which package the "Used by" section represents. See [Change used by data](https://docs.github.com/en/code-security/how-tos/view-and-interpret-data/change-used-by-data).

### What you can do with the dependency graph

You can use the dependency graph to:

* Explore the repositories your code depends on, and those that depend on it. For more information, see [Explore dependencies](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/explore-dependencies).
* View a summary of the dependencies used in your organization's repositories in a single dashboard. For more information, see [Viewing insights for dependencies in your organization](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/viewing-insights-for-dependencies-in-your-organization#viewing-organization-dependency-insights).
* View and update vulnerable dependencies for your repository. For more information, see [Dependabot alerts](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts).
* See information about vulnerable dependencies in pull requests. For more information, see [Reviewing dependency changes in a pull request](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-dependency-changes-in-a-pull-request).
* Export a software bill of materials (SBOM) for audit or compliance purposes. This is a formal, machine-readable inventory of a project's dependencies. See [Export dependencies as sbom](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom).

### Further reading

* [Dependency graph](https://en.wikipedia.org/wiki/Dependency_graph) on Wikipedia
* [Explore dependencies](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/explore-dependencies)
* [View dependabot alerts](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-dependabot-alerts/view-dependabot-alerts)
* [Vulnerability detection](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/vulnerability-detection)

## Viewing a project's contributors

> Source: [GitHub Docs: Viewing a project's contributors](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-a-projects-contributors) · CC BY 4.0

You can see who contributed commits to a repository and its dependencies.

### About contributors

> **Note:**
> Certain contributor, commit, and code frequency insights are only available for repositories that have fewer than 10,000 commits.

You can view the top 100 contributors to a repository in the contributors graph. Merge commits and empty commits aren't counted as contributions for this graph.

To access the list of community contributors, visit `https://github.com/REPO-OWNER/REPO-NAME/graphs/contributors`.

### Accessing the contributors graph

1. On GitHub, navigate to the main page of the repository.
1. Under your repository name, click **Insights**.

1. In the left sidebar, click **Contributors**.
1. Optionally, to view contributors during a specific time period, to the right of "Contributors," click **Period: All**. Then select a time period.
1. Optionally, to view the graph as a table, in the top-right corner of the graph, click . Then click **View as table**.
1. Optionally, to download a CSV or PNG, in the top-right corner of the graph, click . Then click **Download CSV** or **Download PNG**.

### Troubleshooting contributors

If you don't appear in a repository's contributors graph, it may be because:
* You aren't one of the top 100 contributors.
* Your commits haven't been merged into the default branch.
* The email address you used to author the commits isn't connected to your GitHub account.

> **Tip:**
> To list all commit contributors in a repository, see [Repos](https://docs.github.com/en/rest/repos/repos#list-repository-contributors).

If all your commits in the repository are on non-default branches, you won't be in the contributors graph. For example, commits on the `gh-pages` branch aren't included in the graph unless `gh-pages` is the repository's default branch. To have your commits merged into the default branch, you can create a pull request. For more information, see [Pull requests](https://docs.github.com/en/pull-requests/reference/pull-requests).

If the email address you used to author the commits is not connected to your GitHub account, your commits won't be linked to your account, and you won't appear in the contributors graph. For more information, see [Setting your commit email address](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address) and [Adding an email address to your github account](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/adding-an-email-address-to-your-github-account).

#### Contributor data is stale after history changes

After force-pushing, rewriting history, or deleting commits, repository contributor displays and statistics can take about 24 hours to refresh.

If you're a repository owner and contributor data is still incorrect after waiting approximately 24 hours, you can contact GitHub depending on the support options available to your account. For more information, see [About github support](https://docs.github.com/en/support/learning-about-github-support/about-github-support).
