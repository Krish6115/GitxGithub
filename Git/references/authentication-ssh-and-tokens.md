# Authentication: HTTPS, SSH, tokens and credential storage

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: About authentication to GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Caching your GitHub credentials in Git](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [Pro Git, 2nd ed., §7.14 Credential Storage](https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)

## About authentication to GitHub

> Source: [GitHub Docs: About authentication to GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github) · CC BY 4.0

You can securely access your account's resources by authenticating to GitHub, using different credentials depending on where you authenticate.

### About authentication to GitHub

To keep your account secure, you must authenticate before you can access certain resources on GitHub. When you authenticate to GitHub, you supply or confirm credentials that are unique to you to prove that you are exactly who you declare to be.

You can access your resources in GitHub in a variety of ways: in the browser, via GitHub Desktop or another desktop application, with the API, or via the command line. Each way of accessing GitHub supports different modes of authentication.

* Username and password (or social login) with two-factor authentication, or a passkey (GitHub Free, and GitHub Enterprise Cloud only)
* Personal access token
* SSH key

### Authenticating with the API

You can authenticate with the API in different ways. For more information, see [Authenticating to the rest api](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api).

#### Authenticating to the API with a personal access token

If you want to use the GitHub REST API for personal use, you can create a personal access token. If possible, GitHub recommends that you use a fine-grained personal access token instead of a personal access token (classic). For more information about creating a personal access token, see [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

#### Authenticating to the API in a GitHub Actions workflow

If you want to use the API in a GitHub Actions workflow, GitHub recommends that you authenticate with the built-in `GITHUB_TOKEN` instead of creating a token. You can grant permissions to the `GITHUB_TOKEN` with the `permissions` key.

Note that `GITHUB_TOKEN` can only access resources within the repository that contains the workflow. If you need to make changes to resources outside of the workflow repository, you will need to use a personal access token or GitHub App.

For more information, see [Authenticate with github_token](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token).

### Authenticating with the command line

You can access repositories on GitHub from the command line in two ways, HTTPS and SSH, and both have a different way of authenticating. The method of authenticating is determined based on whether you choose an HTTPS or SSH remote URL when you clone the repository. For more information about which way to access, see [About remote repositories](https://docs.github.com/en/get-started/git-basics/about-remote-repositories).

#### HTTPS

You can work with all repositories on GitHub over HTTPS, even if you are behind a firewall or proxy.

If you authenticate with GitHub CLI, you can either authenticate with a personal access token or via the web browser. For more information about authenticating with GitHub CLI, see [`gh auth login`](https://cli.github.com/manual/gh_auth_login).

If you authenticate without GitHub CLI, you must authenticate with a personal access token. When Git prompts you for your password, enter your personal access token. Alternatively, you can use a credential helper like [Git Credential Manager](https://github.com/GitCredentialManager/git-credential-manager/blob/main/README.md). Password-based authentication for Git has been removed in favor of more secure authentication methods. For more information, see [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). Every time you use Git to authenticate with GitHub, you'll be prompted to enter your credentials, unless you cache them with a [credential helper](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git).

#### SSH

You can work with all repositories on GitHub over SSH, although firewalls and proxies might refuse to allow SSH connections.

If you authenticate with GitHub CLI, the CLI will find SSH public keys on your machine and will prompt you to select one for upload. If GitHub CLI does not find a SSH public key for upload, it can generate a new SSH public/private keypair and upload the public key to your account on GitHub. Then, you can either authenticate with a personal access token or via the web browser. For more information about authenticating with GitHub CLI, see [`gh auth login`](https://cli.github.com/manual/gh_auth_login).

If you authenticate without GitHub CLI, you will need to generate an SSH public/private keypair on your local machine and add the public key to your account on GitHub. For more information, see [Generating a new ssh key and adding it to the ssh agent](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent). Every time you use Git to authenticate with GitHub, you'll be prompted to enter your SSH key passphrase, unless you've [stored the key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent#adding-your-ssh-key-to-the-ssh-agent).

### GitHub's token formats

GitHub issues tokens that begin with a prefix to indicate the token's type.

> **Note:**
> Starting April 27, 2026, GitHub began a staged rollout of a stateless format (`ghs_APPID_JWT`) to all newly minted GitHub App installation tokens, making them more performant and improving the reliability of our API surface. If your application expects or relies on installation tokens being exactly 40 characters long, it may not handle this new token format correctly. You can now validate your apps and workflows using a temporary request header that lets you enable the token format on demand. For more information about the temporary header, see [the GitHub blog](https://github.blog/changelog/2026-05-15-github-app-installation-tokens-per-request-override-header).

| Token type | Prefix | More information |
| :- | :- | :- |
| Personal access token (classic) | `ghp_` | [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)  |
| Fine-grained personal access token | `github_pat_` | [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) |
| OAuth access token | `gho_` | [Authorizing oauth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) |
| User access token for a GitHub App | `ghu_` | [Authenticating with a github app on behalf of a user](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-with-a-github-app-on-behalf-of-a-user) |
| Installation access token for a GitHub App | `ghs_` | [Authenticating as a github app installation](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation) |
| Refresh token for a GitHub App | `ghr_` | [Refreshing user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens) |

For more information GitHub's token types and their management, see [Github credential types](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/github-credential-types).

## Managing your personal access tokens

> Source: [GitHub Docs: Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) · CC BY 4.0

You can use a personal access token in place of a password when authenticating to GitHub in the command line or with the API.

> **Warning:**
> Treat your access tokens like passwords. For more information, see [Keeping your personal access tokens secure](#keeping-your-personal-access-tokens-secure).

### About personal access tokens

Personal access tokens are an alternative to using passwords for authentication to GitHub when using the [GitHub API](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api) or the [command line](#using-a-personal-access-token-on-the-command-line).

Personal access tokens are intended to access GitHub resources on behalf of yourself. To access resources on behalf of an organization, or for long-lived integrations, you should use a GitHub App. For more information, see [About creating github apps](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps).

A token has the same capabilities to access resources and perform actions on those resources that the owner of the token has, and is further limited by any scopes or permissions granted to the token. A token cannot grant additional access capabilities to a user. For example, a personal access token can be configured with an `admin:org` scope, but if the owner of the token is not an organization owner, the token will not give administrative access to the organization.

#### Types of personal access tokens

GitHub currently supports two types of personal access tokens: fine-grained personal access tokens and personal access tokens (classic). GitHub recommends that you use fine-grained personal access tokens instead of personal access tokens (classic) whenever possible.

> **Note:**
> Fine-grained personal access tokens, while more secure and controllable, cannot accomplish every task that a personal access token (classic) can. See the section on [Fine-grained personal access tokens limitations](#fine-grained-personal-access-tokens-limitations) below to learn more.

Both fine-grained personal access tokens and personal access tokens (classic) are tied to the user who generated them and will become inactive if the user loses access to the resource.

Organization owners can set a policy to restrict the access of personal access tokens (classic) to their organization, and enterprise owners can restrict the access of personal access tokens (classic) to the enterprise or organizations owned by the enterprise. For more information, see [Setting a personal access token policy for your organization](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization#restricting-access-by-personal-access-tokens).

##### Fine-grained personal access tokens

Fine-grained personal access tokens have several security advantages over personal access tokens (classic), but also have limitations that may prevent you from using them in every scenario. These limits, and our plans to fix them, can be found in the [section below](#fine-grained-personal-access-tokens-limitations).

If you can use a fine-grained personal access token for your scenario, you'll benefit from these improvements:

* Each token is limited to access resources owned by a single user or organization.
* Each token can be further limited to only access specific repositories for that user or organization.
* Each token is granted specific, fine-grained permissions, which offer more control than the scopes granted to personal access tokens (classic).
* Organization owners can require approval for any fine-grained personal access tokens that can access resources in the organization.
* Enterprise owners can require approval for any fine-grained personal access tokens that can access resources in organizations owned by the enterprise.

###### Fine-grained personal access tokens limitations

Fine-grained personal access tokens do not support every feature of personal access tokens (classic). These feature gaps are not permanent - GitHub is working to close them. You can review [our public roadmap](https://github.com/github/roadmap) for more details on when these scenarios will be supported.

The major gaps in fine-grained personal access tokens are:

* Using fine-grained personal access token to contribute to public repos where the user is not a member.
* Using fine-grained personal access token to contribute to repositories where the user is an outside or repository collaborator.
* Using fine-grained personal access token to access multiple organizations at once.
* Using fine-grained personal access token to access `internal` resources within an enterprise the user belongs to.
* Using fine-grained personal access token to call APIs that manage the Enterprise account.
* Using fine-grained personal access token to access Packages.
* Using fine-grained personal access token to call the Checks API.
* Using fine-grained personal access token to access Projects owned by a user account.

All of these gaps will be solved over time, as GitHub continues to invest in more secure access patterns.

##### Personal access tokens (classic)

Personal access tokens (classic) are less secure. However, some features currently will only work with personal access tokens (classic):

* Only personal access tokens (classic) have write access for public repositories that are not owned by you or an organization that you are not a member of.
* Only personal access tokens (classic) automatically have write access for internal repositories that are owned by your enterprise. Fine-grained personal access tokens must be granted access to internal repositories.
* Outside collaborators can only use personal access tokens (classic) to access organization repositories that they are a collaborator on.
* Only personal access tokens (classic) can access enterprises. (Fine-grained personal access token can access organizations owned by enterprises.)
* A few REST API endpoints are only available with a personal access tokens (classic). To check whether an endpoint also supports fine-grained personal access tokens, see the documentation for that endpoint, or see [Endpoints available for fine grained personal access tokens](https://docs.github.com/en/rest/authentication/endpoints-available-for-fine-grained-personal-access-tokens).

If you choose to use a personal access token (classic), keep in mind that it will grant access to all repositories within the organizations that you have access to, as well as all personal repositories in your personal account.

As a security precaution, GitHub automatically removes personal access tokens that haven't been used in a year. To provide additional security, we highly recommend adding an expiration to your personal access tokens.

#### Keeping your personal access tokens secure

Personal access tokens are like passwords, and they share the same inherent security risks. Before creating a new personal access token, consider if there is a more secure method of authentication available to you:

* To access GitHub from the command line, you can use [GitHub CLI](https://docs.github.com/en/github-cli/github-cli/about-github-cli) or [Git Credential Manager](https://github.com/GitCredentialManager/git-credential-manager/blob/main/README.md) instead of creating a personal access token.
* When using a personal access token in a GitHub Actions workflow, consider whether you can use the built-in `GITHUB_TOKEN` instead. For more information, see [Authenticate with github_token](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token).

If these options are not possible, and you must create a personal access token, consider using another CLI service to store your token securely.

When using a personal access token in a script, you can store your token as a secret and run your script through GitHub Actions. For more information, see [Use secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets). You can also store your token as a Codespaces secret and run your script in Codespaces. For more information, see [Managing your account specific secrets for github codespaces](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces).

For more information about best practices, see [Keeping your api credentials secure](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure).

### Creating a fine-grained personal access token

> **Note:**
> There is a limit of 50 fine-grained personal access tokens you can create. If you require more tokens or are building automations, consider using a GitHub App for better scalability and management. For more information, see [Deciding when to build a github app](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/deciding-when-to-build-a-github-app#choosing-between-a-github-app-or-a-personal-access-token).

1. [Verify your email address](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/verifying-your-email-address), if it hasn't been verified yet.
1. In the upper-right corner of any page on GitHub, click your profile picture, then click **Settings**.
1. In the left sidebar, click **Developer settings**.
1. In the left sidebar, under **Personal access tokens**, click **Fine-grained tokens**.
1. Click **Generate new token**.
1. Under **Token name**, enter a name for the token.
1. Under **Expiration**, select an expiration for the token. Infinite lifetimes are allowed but may be blocked by a maximum lifetime policy set by your organization or enterprise owner. For more information, See [Enforcing a maximum lifetime policy for personal access tokens](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization#enforcing-a-maximum-lifetime-policy-for-personal-access-tokens).
1. Optionally, under **Description**, add a note to describe the purpose of the token.
1. Under **Resource owner**, select a resource owner. The token will only be able to access resources owned by the selected resource owner. Organizations that you are a member of will not appear if the organization has blocked the use of fine-grained personal access tokens. For more information, see [Setting a personal access token policy for your organization](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization). You may be required to perform single sign-on (SSO) if the selected organization requires it and you do not already have an active session.
1. Optionally, if the resource owner is an organization that requires approval for fine-grained personal access tokens, below the resource owner, in the box, enter a justification for the request.
1. Under **Repository access**, select which repositories you want the token to access. You should choose the minimal repository access that meets your needs. Tokens always include read-only access to all public repositories on GitHub.
1. If you selected **Only select repositories** in the previous step, under the **Selected repositories** dropdown, select the repositories that you want the token to access.
1. Under **Permissions**, select which permissions to grant the token. Depending on which resource owner and which repository access you specified, there are repository, organization, and account permissions. You should choose the minimal permissions necessary for your needs.

   The REST API reference document for each endpoint states whether the endpoint works with fine-grained personal access tokens and states what permissions are required in order for the token to use the endpoint. Some endpoints may require multiple permissions, and some endpoints may require one of multiple permissions. For an overview of which REST API endpoints a fine-grained personal access token can access with each permission, see [Permissions required for fine grained personal access tokens](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens).

1. Click **Generate token**.

If you selected an organization as the resource owner and the organization requires approval for fine-grained personal access tokens, then your token will be marked as `pending` until it is reviewed by an organization administrator. Your token will only be able to read public resources until it is approved. If you are an owner of the organization, your request is automatically approved. For more information, see [Reviewing and revoking personal access tokens in your organization](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/reviewing-and-revoking-personal-access-tokens-in-your-organization).

### Creating a personal access token (classic)

> **Note:**
> Organization owners can restrict the access of personal access token (classic) to their organization. If you try to use a personal access token (classic) to access resources in an organization that has disabled personal access token (classic) access, your request will fail with a 403 response. Instead, you must use a GitHub App, OAuth app, or fine-grained personal access token.

> **Warning:**
> Your personal access token (classic) can access every repository that you can access. GitHub recommends that you use fine-grained personal access tokens instead, which you can restrict to specific repositories. Fine-grained personal access tokens also enable you to specify fine-grained permissions instead of broad scopes.

1. [Verify your email address](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/verifying-your-email-address), if it hasn't been verified yet.
1. In the upper-right corner of any page on GitHub, click your profile picture, then click **Settings**.
1. In the left sidebar, click **Developer settings**.
1. In the left sidebar, under **Personal access tokens**, click **Tokens (classic)**.
1. Select **Generate new token**, then click **Generate new token (classic)**.
1. In the "Note" field, give your token a descriptive name.
1. To give your token an expiration, select **Expiration**, then choose a default option or click **Custom** to enter a date.
1. Select the scopes you'd like to grant this token. To use your token to access repositories from the command line, select **repo**. A token with no assigned scopes can only access public information. For more information, see [Scopes for oauth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes).
1. Click **Generate token**.
1. Optionally, to copy the new token to your clipboard, click .

1. To use your token to access resources owned by an organization that uses SAML single sign-on, authorize the token. For more information, see [Authorizing a personal access token for use with single sign on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-single-sign-on/authorizing-a-personal-access-token-for-use-with-single-sign-on) in the GitHub Enterprise Cloud documentation.

### Deleting a personal access token

You should delete a personal access token if it is no longer needed. If you delete a personal access token that was used to create a deploy key, the deploy key will also be deleted.

1. In the upper-right corner of any page on GitHub, click your profile picture, then click **Settings**.
1. In the left sidebar, click **Developer settings**.
1. In the left sidebar, under **Personal access tokens**, click either **Fine-grained tokens** or **Tokens (classic)**, depending on which type of personal access token you'd like to delete.
1. To the right of the personal access token you want to delete, click **Delete**.

> **Note:**
> If you find a leaked personal access token belonging to someone else, you can submit a revocation request through the REST API. See [Prevent data leaks](https://docs.github.com/en/code-security/tutorials/secure-your-organization/prevent-data-leaks#mitigate-data-leaks).

### Using a personal access token on the command line

Once you have a personal access token, you can enter it instead of your password when performing Git operations over HTTPS.

For example, to clone a repository on the command line you would enter the following `git clone` command. You would then be prompted to enter your username and password. When prompted for your password, enter your personal access token instead of a password.

```shell
$ git clone https://github.com/USERNAME/REPO.git
Username: YOUR-USERNAME
Password: YOUR-PERSONAL-ACCESS-TOKEN
```

Although you are required to enter your username along with your personal access token, the username is not used to authenticate you. Instead, the personal access token is used to authenticate you. If you do not enter a username, you will receive an error message that your credentials are invalid.

Personal access tokens can only be used for HTTPS Git operations. If your repository uses an SSH remote URL, you will need to [switch the remote from SSH to HTTPS](https://docs.github.com/en/get-started/git-basics/managing-remote-repositories#switching-remote-urls-from-ssh-to-https).

If you are not prompted for your username and password, your credentials may be cached on your computer. You can [update your credentials in the Keychain](https://docs.github.com/en/get-started/git-basics/updating-credentials-from-the-macos-keychain) to replace your old password with the token.

Instead of manually entering your personal access token for every HTTPS Git operation, you can cache your personal access token with a Git client. Git will temporarily store your credentials in memory until an expiry interval has passed. You can also store the token in a plain text file that Git can read before every request. For more information, see [Caching your github credentials in git](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git).

## Caching your GitHub credentials in Git

> Source: [GitHub Docs: Caching your GitHub credentials in Git](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git) · CC BY 4.0

If you're [cloning GitHub repositories using HTTPS](/github/getting-started-with-github/about-remote-repositories), we recommend you use GitHub CLI or Git Credential Manager (GCM) to remember your credentials.

> **Tip:**
> If you clone GitHub repositories using SSH, then you can authenticate using an SSH key instead of using other credentials. For information about setting up an SSH connection, see [Connecting to github with ssh](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).

### GitHub CLI

GitHub CLI will automatically store your Git credentials for you when you choose `HTTPS` as your preferred protocol for Git operations and answer "yes" to the prompt asking if you would like to authenticate to Git with your GitHub credentials.

1. [Install](https://github.com/cli/cli#installation) GitHub CLI on macOS, Windows, or Linux.
1. In the command line, enter `gh auth login`, then follow the prompts.
   * When prompted for your preferred protocol for Git operations, select `HTTPS`.
   * When asked if you would like to authenticate to Git with your GitHub credentials, enter `Y`.

For more information about authenticating with GitHub CLI, see [`gh auth login`](https://cli.github.com/manual/gh_auth_login).

### Git Credential Manager

[Git Credential Manager](https://github.com/GitCredentialManager/git-credential-manager) (GCM) is another way to store your credentials securely and connect to GitHub over HTTPS. With GCM, you don't have to manually [create and store a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), as GCM manages authentication on your behalf, including 2FA (two-factor authentication).

**macOS:**

1. Install Git using [Homebrew](https://brew.sh/):

   ```shell
   brew install git
   ```

1. Install GCM using Homebrew:

   ```shell
   brew install --cask git-credential-manager
   ```

  For macOS, you don't need to run `git config` because GCM automatically configures Git for you.

The next time you clone an HTTPS URL that requires authentication, Git will prompt you to log in using a browser window. You may first be asked to authorize an OAuth app. If your account or organization requires [two-factor auth](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa), you'll also need to complete the 2FA challenge.

> **Tip:**
>
> If you're a member of an enterprise that uses Enterprise Managed Users, your enterprise view has the "Users managed by ACCOUNT NAME" header bar at the top of the screen. In that case you will need to disable account filtering locally in GCM to prevent getting prompted for authentication each time a remote Git operation is performed. For more details, see the [`git-credential-manager` repository](https://github.com/git-ecosystem/git-credential-manager/blob/main/docs/configuration.md#credentialgithubaccountfiltering).
>
> To configure the Git Credential Manager run the following command:
>
> ```bash
> git config --global credential.gitHubAccountFiltering "false"
> ```

Once you've authenticated successfully, your credentials are stored in the macOS keychain and will be used every time you clone an HTTPS URL. Git will not require you to type your credentials in the command line again unless you change your credentials.

**Windows:**

1. Install Git for Windows, which includes GCM. For more information, see [Git for Windows releases](https://github.com/git-for-windows/git/releases/latest) from its [releases page](https://github.com/git-for-windows/git/releases/latest).

We recommend always installing the latest version. At a minimum, install version 2.29 or higher, which is the first version offering OAuth support for GitHub.

The next time you clone an HTTPS URL that requires authentication, Git will prompt you to log in using a browser window. You may first be asked to authorize an OAuth app. If your account or organization requires [two-factor auth](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa), you'll also need to complete the 2FA challenge.

> **Tip:**
>
> If you're a member of an enterprise that uses Enterprise Managed Users, your enterprise view has the "Users managed by ACCOUNT NAME" header bar at the top of the screen. In that case you will need to disable account filtering locally in GCM to prevent getting prompted for authentication each time a remote Git operation is performed. For more details, see the [`git-credential-manager` repository](https://github.com/git-ecosystem/git-credential-manager/blob/main/docs/configuration.md#credentialgithubaccountfiltering).
>
> To configure the Git Credential Manager run the following command:
>
> ```bash
> git config --global credential.gitHubAccountFiltering "false"
> ```

Once you've authenticated successfully, your credentials are stored in the Windows credential manager and will be used every time you clone an HTTPS URL. Git will not require you to type your credentials in the command line again unless you change your credentials.

<br>

> **Warning:**
> Older versions of Git for Windows came with Git Credential Manager for Windows. This older product is no longer supported and cannot connect to GitHub via OAuth. We recommend you upgrade to [the latest version of Git for Windows](https://github.com/git-for-windows/git/releases/latest).

> **Warning:**
> If you cached incorrect or outdated credentials in Credential Manager for Windows, Git will fail to access GitHub. To reset your cached credentials so that Git prompts you to enter your credentials, access the Credential Manager in the Windows Control Panel under User Accounts > Credential Manager. Look for the GitHub entry and delete it.

**Linux:**

For Linux, install Git and GCM, then configure Git to use GCM.

1. Install Git from your distro's packaging system. Instructions will vary depending on the flavor of Linux you run.

1. Install GCM. See the [instructions in the GCM repo](https://github.com/git-ecosystem/git-credential-manager/blob/main/docs/install.md), as they'll vary depending on the flavor of Linux you run.

1. Configure Git to use GCM. There are several backing stores that you may choose from, so see the GCM docs to complete your setup. For more information, see [GCM Linux](https://aka.ms/gcmcore-linuxcredstores).

The next time you clone an HTTPS URL that requires authentication, Git will prompt you to log in using a browser window. You may first be asked to authorize an OAuth app. If your account or organization requires [two-factor auth](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa), you'll also need to complete the 2FA challenge.

> **Tip:**
>
> If you're a member of an enterprise that uses Enterprise Managed Users, your enterprise view has the "Users managed by ACCOUNT NAME" header bar at the top of the screen. In that case you will need to disable account filtering locally in GCM to prevent getting prompted for authentication each time a remote Git operation is performed. For more details, see the [`git-credential-manager` repository](https://github.com/git-ecosystem/git-credential-manager/blob/main/docs/configuration.md#credentialgithubaccountfiltering).
>
> To configure the Git Credential Manager run the following command:
>
> ```bash
> git config --global credential.gitHubAccountFiltering "false"
> ```

Once you've authenticated successfully, your credentials are stored on your system and will be used every time you clone an HTTPS URL. Git will not require you to type your credentials in the command line again unless you change your credentials.

For more options for storing your credentials on Linux, see [Credential Storage](https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage) in Pro Git.

<br>

For more information or to report issues with GCM, see the official GCM docs at [Git Credential Manager](https://github.com/GitCredentialManager/git-credential-manager).

## Credential Storage

> Source: [Pro Git, 2nd ed., §7.14 Credential Storage](https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage) · CC BY-NC-SA 3.0

If you use the SSH transport for connecting to remotes, it's possible for you to have a key without a passphrase, which allows you to securely transfer data without typing in your username and password.
However, this isn't possible with the HTTP protocols — every connection needs a username and password.
This gets even harder for systems with two-factor authentication, where the token you use for a password is randomly generated and unpronounceable.

Fortunately, Git has a credentials system that can help with this.
Git has a few options provided in the box:

* The default is not to cache at all.
  Every connection will prompt you for your username and password.
* The "cache" mode keeps credentials in memory for a certain period of time.
  None of the passwords are ever stored on disk, and they are purged from the cache after 15 minutes.
* The "store" mode saves the credentials to a plain-text file on disk, and they never expire.
  This means that until you change your password for the Git host, you won't ever have to type in your credentials again.
  The downside of this approach is that your passwords are stored in cleartext in a plain file in your home directory.
* If you're using macOS, Git comes with an "osxkeychain" mode, which caches credentials in the secure keychain that's attached to your system account.
  This method stores the credentials on disk, and they never expire, but they're encrypted with the same system that stores HTTPS certificates and Safari auto-fills.
* If you're using Windows, you can enable the **Git Credential Manager** feature when installing [Git for Windows](https://gitforwindows.org/) or separately install [the latest GCM](https://github.com/git-ecosystem/git-credential-manager/releases/latest) as a standalone service.
  This is similar to the "osxkeychain" helper described above, but uses the Windows Credential Store to control sensitive information.
  It can also serve credentials to WSL1 or WSL2.
  See [GCM Install Instructions](https://github.com/git-ecosystem/git-credential-manager#readme) for more information.

You can choose one of these methods by setting a Git configuration value:

```console
$ git config --global credential.helper cache
```

Some of these helpers have options.
The "store" helper can take a `--file <path>` argument, which customizes where the plain-text file is saved (the default is `~/.git-credentials`).
The "cache" helper accepts the `--timeout <seconds>` option, which changes the amount of time its daemon is kept running (the default is "900", or 15 minutes).
Here's an example of how you'd configure the "store" helper with a custom file name:

```console
$ git config --global credential.helper 'store --file ~/.my-credentials'
```

Git even allows you to configure several helpers.
When looking for credentials for a particular host, Git will query them in order, and stop after the first answer is provided.
When saving credentials, Git will send the username and password to **all** of the helpers in the list, and they can choose what to do with them.
Here's what a `.gitconfig` would look like if you had a credentials file on a thumb drive, but wanted to use the in-memory cache to save some typing if the drive isn't plugged in:

```ini
[credential]
    helper = store --file /mnt/thumbdrive/.git-credentials
    helper = cache --timeout 30000
```
