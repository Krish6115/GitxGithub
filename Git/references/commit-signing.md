# Signing commits and tags

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: About commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [Pro Git, 2nd ed., §7.4 Signing Your Work](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work) · Scott Chacon and Ben Straub, *Pro Git*, 2nd ed. (Apress) · [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)

## About commit signature verification

> Source: [GitHub Docs: About commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification) · CC BY 4.0

Using GPG, SSH, or S/MIME, you can sign tags and commits locally. These tags or commits are marked as verified on GitHub so other people can be confident that the changes come from a trusted source.

### About commit signature verification

You can sign commits and tags locally, to give other people confidence about the origin of a change you have made. If a commit or tag has a GPG, SSH, or S/MIME signature that is cryptographically verifiable, GitHub marks the commit or tag "Verified" or "Partially verified."

For most individual users, GPG or SSH will be the best choice for signing commits. S/MIME signatures are usually required in the context of a larger organization. SSH signatures are the simplest to generate. You can even upload your existing authentication key to GitHub to also use as a signing key. Generating a GPG signing key is more involved than generating an SSH key, but GPG has features that SSH does not. A GPG key can expire or be revoked when no longer used. The GPG signature may include the information about it being expired or revoked.

Commits and tags have the following verification statuses, depending on whether you have enabled vigilant mode. By default vigilant mode is not enabled. For information on how to enable vigilant mode, see [Displaying verification statuses for all of your commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/displaying-verification-statuses-for-all-of-your-commits).

Signing commits differs from signing off on a commit. For more information about signing off on commits, see [Managing the commit signoff policy for your repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-the-commit-signoff-policy-for-your-repository).

#### Default statuses

| Status         | Description |
| -------------- | ----------- |
| **Verified**   | The commit is signed and the signature was successfully verified.
| **Unverified** | The commit is signed but the signature could not be verified.
| No verification status | The commit is not signed.

#### Persistent commit signature verification

Regardless of the signature choice - GPG, SSH, or S/MIME - once a commit signature is verified, it remains verified within its repository's network. See [Understanding connections between repositories](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/understanding-connections-between-repositories).

When a commit signature is verified upon being pushed to GitHub, a verification record is stored alongside the commit. This record can't be edited and will persist so that signatures remain verified over time, even if signing keys are rotated, revoked, or if contributors leave the organization.

The verification record includes a timestamp marking when the verification was completed. This persistent record ensures a consistent verified state, providing a stable history of contributions within the repository. You can view this timestamp by hovering over the "Verified" badge on GitHub or by accessing the commit via the REST API, which includes a `verified_at` field. See [Commits](https://docs.github.com/en/rest/commits/commits).

Persistent commit signature verification applies to new commits pushed to GitHub. For any commits that predate this feature, a persistent record will be created the next time the commit's signature is verified on GitHub, helping ensure that verified statuses remain stable and reliable across the repository's history.

##### Records persist even after revocation and expiration

Persistent commit signature verification reflects the verified state of a commit at the time of verification. This means that if a signing key is later revoked, expired, or otherwise altered, previously verified commits retain their verified status based on the record created during the initial verification. GitHub will not re-verify previously signed commits or retroactively adjust their verification status in response to changes in the key's state. Organizations may need to manage key states directly to align with their security policies, especially if frequent key rotation or revocation is planned.

##### The verification record is scoped to its repository network

The verification record is persistent across the repository network, meaning that if the same commit is pushed again to the same repository or to any of its forks, the existing verification record is reused. This allows GitHub to maintain a consistent verified status across related repositories without re-verifying the commit each time it appears within the network. This persistence reinforces a unified and reliable view of commit authenticity across all instances of the commit within the repository network.

#### Signature verification for rebase and merge

When using the **Rebase and Merge** option on a pull request, it's important to note that the commits in the head branch are added to the base branch without commit signature verification.
When you use this option, GitHub creates a modified commit, using the data and content of the original commit. This means that GitHub didn't truly create this commit, and can't therefore sign it as a generic system user.
GitHub doesn't have access to the committer's private signing keys, so it can't sign the commit on the user's behalf.

A workaround for this is to rebase and merge locally, and then push the changes to the pull request's base branch.

For more information, see [About merge methods on github](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github#rebasing-and-merging-your-commits).

#### Statuses with vigilant mode enabled

| Status         | Description |
| -------------- | ----------- |
| **Verified**   | The commit is signed, the signature was successfully verified, and the committer is the only author who has enabled vigilant mode.
| **Partially&nbsp;verified** | The commit is signed, and the signature was successfully verified, but the commit has an author who: a) is not the committer and b) has enabled vigilant mode. In this case, the commit signature doesn't guarantee the consent of the author, so the commit is only partially verified.
| **Unverified** | Any of the following is true:<br>- The commit is signed but the signature could not be verified.<br>- The commit is not signed and the committer has enabled vigilant mode.<br>- The commit is not signed and an author has enabled vigilant mode.<br>

Repository administrators can enforce required commit signing on a branch to block all commits that are not signed and verified. For more information, see [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-signed-commits).

You can check the verification status of your signed commits or tags on GitHub and view why your commit signatures might be unverified. For more information, see [Checking your commit and tag signature verification status](https://docs.github.com/en/authentication/troubleshooting-commit-signature-verification/checking-your-commit-and-tag-signature-verification-status).

GitHub will automatically use GPG to sign commits you make using the web interface. Commits signed by GitHub will have a verified status. You can verify the signature locally using the public key available at https://github.com/web-flow.gpg.

You can optionally choose to have GitHub GPG sign commits you make in GitHub Codespaces. For more information about enabling GPG verification for your codespaces, see [Managing gpg verification for github codespaces](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-gpg-verification-for-github-codespaces).

### GPG commit signature verification

You can use GPG to sign commits with a GPG key that you generate yourself.

GitHub uses OpenPGP libraries to confirm that your locally signed commits and tags are cryptographically verifiable against a public key you have added to your account on GitHub.

To sign commits using GPG and have those commits verified on GitHub, follow these steps:

1. [Check for existing GPG keys](https://docs.github.com/en/authentication/managing-commit-signature-verification/checking-for-existing-gpg-keys)
1. [Generate a new GPG key](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key)
1. [Add a GPG key to your GitHub account](https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account)
1. [Tell Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key)
1. [Sign commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
1. [Sign tags](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-tags)

### SSH commit signature verification

You can use SSH to sign commits with an SSH key that you generate yourself. For more information, see the [Git reference documentation](https://git-scm.com/docs/git-config#Documentation/git-config.txt-usersigningKey) for `user.Signingkey`. If you already use an SSH key to authenticate with GitHub,
you can also upload that same key again for use as a signing key. There's no limit on the number of signing keys you can add to your account.

GitHub uses [ssh_data](https://github.com/github/ssh_data), an open source Ruby library, to confirm that your locally signed commits and tags are cryptographically verifiable against a public key you have added to your account on GitHub.

> **Note:**
> SSH signature verification is available in Git 2.34 or later. To update your version of Git, see the [Git](https://git-scm.com/downloads) website.

To sign commits using SSH and have those commits verified on GitHub, follow these steps:

1. [Check for existing SSH keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/checking-for-existing-ssh-keys)
1. [Generate a new SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
1. [Add a SSH signing key to your GitHub account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
1. [Tell Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key)
1. [Sign commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
1. [Sign tags](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-tags)

### S/MIME commit signature verification

You can use S/MIME to sign commits with an X.509 key issued by your organization.

GitHub uses [the Debian ca-certificates package](https://packages.debian.org/bullseye/ca-certificates), the same trust store used by Mozilla browsers, to confirm that your locally signed commits and tags are cryptographically verifiable against a public key in a trusted root certificate.

> **Note:**
> S/MIME signature verification is available in Git 2.19 or later. To update your version of Git, see the [Git](https://git-scm.com/downloads) website.

To sign commits using S/MIME and have those commits verified on GitHub, follow these steps:

1. [Tell Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key)
1. [Sign commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
1. [Sign tags](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-tags)

You don't need to upload your public key to GitHub.

### Signature verification for bots

Organizations and GitHub Apps that require commit signing can use bots to sign commits. If a commit or tag has a bot signature that is cryptographically verifiable, GitHub marks the commit or tag as verified.

Signature verification for bots will only work if the request is verified and authenticated as the GitHub App or bot and contains no custom author information, custom committer information, and no custom signature information, such as Commits API.

### Further reading

* [Signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
* [Signing tags](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-tags)
* [Troubleshooting commit signature verification](https://docs.github.com/en/authentication/troubleshooting-commit-signature-verification)

## Signing commits

> Source: [GitHub Docs: Signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits) · CC BY 4.0

You can sign commits locally using GPG, SSH, or S/MIME.

> **Note:**
> [GitHub Desktop](https://desktop.github.com/) only supports commit signing if your Git client is configured to sign commits by default.

> **Tip:**
> To configure your Git client to sign commits by default for a local repository, in Git versions 2.0.0 and above, run `git config commit.gpgsign true`. To sign all commits by default in any local repository on your computer, run `git config --global commit.gpgsign true`.
>
> To store your GPG key passphrase so you don't have to enter it every time you sign a commit, we recommend using the following tools:
> * For Mac users, the [GPG Suite](https://gpgtools.org/) allows you to store your GPG key passphrase in the macOS Keychain.
> * For Windows users, the [Gpg4win](https://www.gpg4win.org/) integrates with other Windows tools.
>
> You can also manually configure [gpg-agent](http://linux.die.net/man/1/gpg-agent) to save your GPG key passphrase, but this doesn't integrate with macOS Keychain like ssh-agent and requires more setup.

If you have multiple keys or are attempting to sign commits or tags with a key that doesn't match your committer identity, you should [tell Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key).

1. When committing changes in your local branch, add the -S flag to the git commit command:

   ```shell
   $ git commit -S -m "YOUR_COMMIT_MESSAGE"
   # Creates a signed commit
   ```

1. If you're using GPG, after you create your commit, provide the passphrase you set up when you [generated your GPG key](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key).
1. When you've finished creating commits locally, push them to your remote repository on GitHub:

   ```shell
   $ git push
   # Pushes your local commits to the remote repository
   ```

1. On GitHub, navigate to your pull request.
1. On the pull request, click **Commits**.

1. To view more detailed information about the verified signature, click **Verified.**

### Further reading

* [Telling git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key)
* [Signing tags](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-tags)
* [Managing gpg verification for github codespaces](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-gpg-verification-for-github-codespaces)

## Signing Your Work

> Source: [Pro Git, 2nd ed., §7.4 Signing Your Work](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work) · CC BY-NC-SA 3.0

Git is cryptographically secure, but it's not foolproof.
If you're taking work from others on the internet and want to verify that commits are actually from a trusted source, Git has a few ways to sign and verify work using GPG.

### GPG Introduction

First of all, if you want to sign anything you need to get GPG configured and your personal key installed.

```console
$ gpg --list-keys
/Users/schacon/.gnupg/pubring.gpg
---------------------------------
pub   2048R/0A46826A 2014-06-04
uid                  Scott Chacon (Git signing key) <schacon@gmail.com>
sub   2048R/874529A9 2014-06-04
```

If you don't have a key installed, you can generate one with `gpg --gen-key`.

```console
$ gpg --gen-key
```

Once you have a private key to sign with, you can configure Git to use it for signing things by setting the `user.signingkey` config setting.

```console
$ git config --global user.signingkey 0A46826A!
```

Now Git will use your key by default to sign tags and commits if you want.

### Signing Tags

If you have a GPG private key set up, you can now use it to sign new tags.
All you have to do is use `-s` instead of `-a`:

```console
$ git tag -s v1.5 -m 'my signed 1.5 tag'

You need a passphrase to unlock the secret key for
user: "Ben Straub <ben@straub.cc>"
2048-bit RSA key, ID 800430EB, created 2014-05-04
```

If you run `git show` on that tag, you can see your GPG signature attached to it:

```console
$ git show v1.5
tag v1.5
Tagger: Ben Straub <ben@straub.cc>
Date:   Sat May 3 20:29:41 2014 -0700

my signed 1.5 tag
-----BEGIN PGP SIGNATURE-----
Version: GnuPG v1

iQEcBAABAgAGBQJTZbQlAAoJEF0+sviABDDrZbQH/09PfE51KPVPlanr6q1v4/Ut
LQxfojUWiLQdg2ESJItkcuweYg+kc3HCyFejeDIBw9dpXt00rY26p05qrpnG+85b
hM1/PswpPLuBSr+oCIDj5GMC2r2iEKsfv2fJbNW8iWAXVLoWZRF8B0MfqX/YTMbm
ecorc4iXzQu7tupRihslbNkfvfciMnSDeSvzCpWAHl7h8Wj6hhqePmLm9lAYqnKp
8S5B/1SSQuEAjRZgI4IexpZoeKGVDptPHxLLS38fozsyi0QyDyzEgJxcJQVMXxVi
RUysgqjcpT8+iQM1PblGfHR4XAhuOqN5Fx06PSaFZhqvWFezJ28/CLyX5q+oIVk=
=EFTF
-----END PGP SIGNATURE-----

commit ca82a6dff817ec66f44342007202690a93763949
Author: Scott Chacon <schacon@gee-mail.com>
Date:   Mon Mar 17 21:52:11 2008 -0700

    Change version number
```

### Verifying Tags

To verify a signed tag, you use `git tag -v <tag-name>`.
This command uses GPG to verify the signature.
You need the signer's public key in your keyring for this to work properly:

```console
$ git tag -v v1.4.2.1
object 883653babd8ee7ea23e6a5c392bb739348b1eb61
type commit
tag v1.4.2.1
tagger Junio C Hamano <junkio@cox.net> 1158138501 -0700

GIT 1.4.2.1

Minor fixes since 1.4.2, including git-mv and git-http with alternates.
gpg: Signature made Wed Sep 13 02:08:25 2006 PDT using DSA key ID F3119B9A
gpg: Good signature from "Junio C Hamano <junkio@cox.net>"
gpg:                 aka "[jpeg image of size 1513]"
Primary key fingerprint: 3565 2A26 2040 E066 C9A7  4A7D C0C6 D9A4 F311 9B9A
```

If you don't have the signer's public key, you get something like this instead:

```console
gpg: Signature made Wed Sep 13 02:08:25 2006 PDT using DSA key ID F3119B9A
gpg: Can't check signature: public key not found
error: could not verify the tag 'v1.4.2.1'
```

### Signing Commits

In more recent versions of Git (v1.7.9 and above), you can now also sign individual commits.
If you're interested in signing commits directly instead of just the tags, all you need to do is add a `-S` to your `git commit` command.

```console
$ git commit -a -S -m 'Signed commit'

You need a passphrase to unlock the secret key for
user: "Scott Chacon (Git signing key) <schacon@gmail.com>"
2048-bit RSA key, ID 0A46826A, created 2014-06-04

[master 5c3386c] Signed commit
 4 files changed, 4 insertions(+), 24 deletions(-)
 rewrite Rakefile (100%)
 create mode 100644 lib/git.rb
```

To see and verify these signatures, there is also a `--show-signature` option to `git log`.

```console
$ git log --show-signature -1
commit 5c3386cf54bba0a33a32da706aa52bc0155503c2
gpg: Signature made Wed Jun  4 19:49:17 2014 PDT using RSA key ID 0A46826A
gpg: Good signature from "Scott Chacon (Git signing key) <schacon@gmail.com>"
Author: Scott Chacon <schacon@gmail.com>
Date:   Wed Jun 4 19:49:17 2014 -0700

    Signed commit
```

Additionally, you can configure `git log` to check any signatures it finds and list them in its output with the `%G?` format.

```console
$ git log --pretty="format:%h %G? %aN  %s"

5c3386c G Scott Chacon  Signed commit
ca82a6d N Scott Chacon  Change the version number
085bb3b N Scott Chacon  Remove unnecessary test code
a11bef0 N Scott Chacon  Initial commit
```

Here we can see that only the latest commit is signed and valid and the previous commits are not.

In Git 1.8.3 and later, `git merge` and `git pull` can be told to inspect and reject when merging a commit that does not carry a trusted GPG signature with the `--verify-signatures` command.

If you use this option when merging a branch and it contains commits that are not signed and valid, the merge will not work.

```console
$ git merge --verify-signatures non-verify
fatal: Commit ab06180 does not have a GPG signature.
```

If the merge contains only valid signed commits, the merge command will show you all the signatures it has checked and then move forward with the merge.

```console
$ git merge --verify-signatures signed-branch
Commit 13ad65e has a good GPG signature by Scott Chacon (Git signing key) <schacon@gmail.com>
Updating 5c3386c..13ad65e
Fast-forward
 README | 2 ++
 1 file changed, 2 insertions(+)
```

You can also use the `-S` option with the `git merge` command to sign the resulting merge commit itself.
The following example both verifies that every commit in the branch to be merged is signed and furthermore signs the resulting merge commit.

```console
$ git merge --verify-signatures -S  signed-branch
Commit 13ad65e has a good GPG signature by Scott Chacon (Git signing key) <schacon@gmail.com>

You need a passphrase to unlock the secret key for
user: "Scott Chacon (Git signing key) <schacon@gmail.com>"
2048-bit RSA key, ID 0A46826A, created 2014-06-04

Merge made by the 'recursive' strategy.
 README | 2 ++
 1 file changed, 2 insertions(+)
```

### Everyone Must Sign

Signing tags and commits is great, but if you decide to use this in your normal workflow, you'll have to make sure that everyone on your team understands how to do so.
This can be achieved by asking everyone working with the repository to run `git config --local commit.gpgsign true` to automatically have all of their commits in the repository signed by default.
If you don't, you'll end up spending a lot of time helping people figure out how to rewrite their commits with signed versions.
Make sure you understand GPG and the benefits of signing things before adopting this as part of your standard workflow.
