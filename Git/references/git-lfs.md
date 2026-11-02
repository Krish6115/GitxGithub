# Git Large File Storage (LFS)

> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved
> 2026-11-02. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.
> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.
>
> - [GitHub Docs: About Git Large File Storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> - [GitHub Docs: Configuring Git Large File Storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/configuring-git-large-file-storage) · GitHub, Inc., GitHub Docs · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## About Git Large File Storage

> Source: [GitHub Docs: About Git Large File Storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage) · CC BY 4.0

GitHub limits the size of files allowed in repositories. To track files beyond this limit, you can use GitHub.

### About GitHub

GitHub handles large files by storing references to the file in the repository, but not the actual file itself. To work around Git's architecture, GitHub creates a pointer file which acts as a reference to the actual file (which is stored somewhere else). GitHub manages this pointer file in your repository. When you clone the repository down, GitHub uses the pointer file as a map to go and find the large file for you.

Different maximum size limits for GitHub apply depending on your GitHub plan.

| Product | Maximum file size |
|------- | ------- |
| GitHub Free | 2 GB |
| GitHub Pro | 2 GB |
| GitHub Team | 4 GB |
| GitHub Enterprise Cloud | 5 GB |

If you exceed the per-file limit of 5 GB, the file will be rejected by Git LFS with an error message.

You can also use GitHub with GitHub Desktop. For more information about cloning Git LFS repositories in GitHub Desktop, see [Cloning a repository from github to github desktop](https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-a-repository-from-github-to-github-desktop).

You can choose whether GitHub objects are included in [source code archives](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives), such as ZIP files and tarballs, that GitHub creates for your repository. For more information, see [Managing git lfs objects in archives of your repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-git-lfs-objects-in-archives-of-your-repository).

### Pointer file format

GitHub's pointer file looks like this:

```text
version GitHub
oid sha256:4cac19622fc3ada9c0fdeadb33f88f367b541f38b89102a3f1261ac81fd5bcb5
size 84977953
```

It tracks the `version` of GitHub you're using, followed by a unique identifier for the file (`oid`). It also stores the `size` of the final file.

> **Note:**
> * GitHub cannot be used with GitHub Pages sites.
> * GitHub cannot be used with template repositories.

### Further reading

* [Collaboration with git large file storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/collaboration-with-git-large-file-storage)
* [Git lfs](https://docs.github.com/en/billing/concepts/product-billing/git-lfs)

## Configuring Git Large File Storage

> Source: [GitHub Docs: Configuring Git Large File Storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/configuring-git-large-file-storage) · CC BY 4.0

Once [GitHub is installed](/articles/installing-git-large-file-storage/), you need to associate it with a large file in your repository.

If there are existing files in your repository that you'd like to use with GitHub, you need to first remove them from the repository and then add them to GitHub locally. For more information, see [Moving a file in your repository to git large file storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/moving-a-file-in-your-repository-to-git-large-file-storage).

If there are referenced GitHub files that did not upload successfully, you will receive an error message. For more information, see [Resolving git large file storage upload failures](https://docs.github.com/en/repositories/working-with-files/managing-large-files/resolving-git-large-file-storage-upload-failures).

1. Open <span class="platform-mac">Terminal</span><span class="platform-linux">Terminal</span><span class="platform-windows">Git Bash</span>.
1. Change your current working directory to an existing repository you'd like to use with GitHub.
1. To associate a file type in your repository with GitHub, enter `git GitHub track` followed by the name of the file extension you want to automatically upload to GitHub.

   For example, to associate a _.psd_ file, enter the following command:

   ```shell
   $ git GitHub track "*.psd"
   > Tracking "*.psd"
   ```

   Every file type you want to associate with GitHub will need to be added with `git GitHub track`. This command amends your repository's _.gitattributes_ file and associates large files with GitHub.

   > **Note:**
   > We strongly suggest that you commit your local _.gitattributes_ file into your repository.
   >
   > * Relying on a global _.gitattributes_ file associated with GitHub may cause conflicts when contributing to other Git projects.
   > * Including the _.gitattributes_ file in the repository allows people creating forks or fresh clones to more easily collaborate using GitHub.
   > * Including the _.gitattributes_ file in the repository allows GitHub objects to optionally be included in ZIP file and tarball archives.

1. Add a file to the repository matching the extension you've associated:

   ```shell
   git add path/to/file.psd
   ```

1. Commit the file and push it to GitHub:

   ```shell
   git commit -m "add file.psd"
   git push
   ```

   You should see some diagnostic information about your file upload:

   ```shell
   > Sending file.psd
   > 44.74 MB / 81.04 MB  55.21 % 14s
   > 64.74 MB / 81.04 MB  79.21 % 3s
   ```

### Further reading

* [Collaboration with git large file storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/collaboration-with-git-large-file-storage)
* [Managing git lfs objects in archives of your repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-git-lfs-objects-in-archives-of-your-repository)
