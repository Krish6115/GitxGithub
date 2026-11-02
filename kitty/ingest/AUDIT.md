# Knowledge audit (Phase 0.5)

Audit of the learning PDFs Kitty will be grounded in, measured against the topic checklist
for Kitty's tutor and repo-tour features. Text was extracted with PyMuPDF on 2026-11-02;
one PDF has no text layer and was reviewed visually.

## 1. Sources reviewed

| File | Pages | Words | Text layer | Ownership / license | Use in Kitty index |
|---|---:|---:|---|---|---|
| `Git/Git_GitHub_101.pdf` | 3 | ~890 | yes | Repo author's study notes (Notion export) | **Yes** |
| `Git/git_missing_topics(...).pdf` | 21 | ~2,970 | yes | Repo author (Krish6115/GitxGithub) | **Yes** |
| `Scenario-Based_Guide/git_scenarios.pdf` | 22 | ~3,230 | yes | Repo author (Krish6115/GitxGithub) | **Yes** |
| `Git/git-cheat-sheet-education.pdf` | 2 | ~720 | yes | GitHub Education cheat sheet (github/training-kit, CC BY 4.0, verified via the repo license) | **Yes, with attribution** |
| `Git/Git_Github Notes.pdf` | 4 | 16 | **no (photos)** | Repository owner (pages signed `@girlie_mac`; see §4) | **Yes, via transcript** |

Total usable text is about 7,800 words, roughly 15–20 chunks of ~500 tokens. That's small:
on its own the tutor would often have nothing relevant to retrieve, so filling the gaps matters.

## 2. What each PDF covers

- **Git_GitHub_101**: shell basics (ls/mkdir/cd/rm/vim); init, status, add, commit,
  `restore --staged`, log, reset, stash/pop/clear; remotes (`remote add`, `-v`), push; checkout and
  merge; fork → clone → upstream → branch → PR flow; three ways to sync a fork; squashing with `rebase -i`;
  a one-paragraph explanation of what merge conflicts are. Depth: beginner, terse.
- **git_missing_topics**: reflog, cherry-pick (single and range, `--no-commit`), revert (with a reset-vs-revert table,
  `-m 1` for merges), `commit --amend` + `--force-with-lease`, tags (lightweight/annotated, push/delete),
  bisect (manual and `run`), blame (`-L`, `-w`), advanced log flags, `git clean`, aliases, SSH keys + PATs,
  a gh CLI command table, advanced .gitignore patterns plus `rm --cached`, and one paragraph each on GitHub
  Issues/PRs/Actions/Pages/Releases/branch protection. Depth: intermediate, command-focused.
- **git_scenarios**: 10 situation → commands → why scenarios: first-time setup, first push
  (clone vs init), feature branches, fork contribution, merge conflicts, undo matrix
  (restore/reset modes/revert/reflog), fork sync (reset/rebase/pull, `rebase --continue/--abort`), team
  workflow (conventional commits, `rebase -i` squash, gh PR create/merge `--squash`), tagging +
  SemVer + `gh release`, cherry-pick/bisect/blame. Depth: intermediate. **This matches the tone Kitty's
  tutor should use (scenario-first).**
- **git-cheat-sheet-education**: setup, init/clone, stage/snapshot, branch/merge, remotes,
  `rm`/`mv`, `log --follow`, the `A..B` vs `A...B` ranges, stash list/drop, `rebase`, `reset --hard`, ignore patterns.
  Depth: one-line reference.

## 3. Gap analysis against the checklist

Legend: **Covered** (enough to answer common questions) · **Partial** (basics only; important parts
missing) · **Minimal** (a passing mention) · **Missing**.

| # | Topic | Status | What exists | What's missing |
|---|---|---|---|---|
| 1 | Config / setup | Covered | user.name/email, init.defaultBranch, color.ui, aliases, `--list` | config levels (system/global/local), core.editor, core.autocrlf on Windows |
| 2 | Staging | Partial | add, add ., restore --staged, diff --staged | interactive / partial staging (`add -p`), the index as a concept |
| 3 | Commits | Covered | commit -m, amend, conventional commits | commit-message guidelines (50/72), `commit -a` caveats |
| 4 | Branching | Covered | branch, checkout, `checkout -b`, `switch -c`, delete local/remote | branches as pointers, detached HEAD |
| 5 | Merging | Partial | merge, merge before push | fast-forward vs three-way, `--no-ff`, `--squash`, merge commits explained |
| 6 | Rebase (incl. interactive) | Partial | rebase, `rebase -i` squash, continue/abort | reword/edit/fixup/drop, `--autosquash`, `--onto`, **the "don't rebase public history" rule** |
| 7 | Conflicts | Partial | merge-conflict markers, resolve, `merge --abort`, VS Code UI | conflicts during rebase (ours/theirs are **swapped**), diff3 style, mergetool, rerere, resolving on GitHub |
| 8 | Undoing | Covered | restore, reset soft/mixed/hard, revert (+merge), reflog, clean | the "three trees" mental model behind reset |
| 9 | Stash | Partial | stash, pop, list, drop, clear | `stash -u`, `apply` vs `pop`, `stash push -m`, `stash branch` |
| 10 | Remotes | Partial | remote add/-v/set-url, fetch, pull, push -u, `--prune` | remote-tracking branches, upstream tracking, `pull --rebase` config, rename/remove |
| 11 | Fork / upstream sync | Covered | 4 methods incl. the Sync fork button | — |
| 12 | PRs + code review | Partial | create (web/gh), draft PRs, squash merge, `Closes #42` | **reviewing** (comments, suggestions, approve/request changes), merge-method comparison, updating a PR after review, CODEOWNERS |
| 13 | Issues | Minimal | one paragraph, `Fixes #42`, gh issue | closing-keyword list, issue/PR templates, labels/milestones in practice |
| 14 | Tags / releases | Covered | lightweight/annotated, push/delete, gh release, SemVer | — (one factual error, see §5) |
| 15 | Cherry-pick | Covered | single, range (both forms), `--no-commit` | conflict handling during cherry-pick |
| 16 | Bisect | Covered | manual + `bisect run` | — |
| 17 | Blame | Covered | `-L`, `-w`, GitHub Blame UI | `--ignore-revs-file`, `-C` |
| 18 | .gitignore | Covered | patterns, negation, `rm --cached`, global excludes | — |
| 19 | SSH / auth / tokens | Partial | ed25519 keys, agent, test, set-url, PAT basics | fine-grained vs classic PATs, credential managers (GCM), HTTPS vs SSH, **`credential.helper store` stores tokens in plain text** |
| 20 | gh CLI | Covered | auth/repo/pr/issue/release/run commands | — |
| 21 | GitHub Actions basics | Minimal | one paragraph, `gh run list/watch` | workflows/jobs/steps/runners, triggers, a minimal workflow, reading a failed run |
| 22 | Branch protection | Minimal | one paragraph + settings path | rulesets, required checks, required reviews in detail |
| 23 | Commit signing | **Missing** | — | GPG/SSH signing, "Verified" badge, vigilant mode |
| 24 | Submodules | **Missing** | — | add/clone `--recurse-submodules`/update |
| 25 | Worktrees | **Missing** | — | `git worktree add/list/remove` |
| 26 | Hooks | **Missing** | — | client vs server hooks, pre-commit/commit-msg |
| 27 | Git LFS | **Missing** | — | when and why, track/install, GitHub storage limits |
| 28 | Git internals | Minimal | "HEAD is a pointer", "SHA-1 checksum" | blobs/trees/commits/tags, refs, HEAD, packfiles |
| 29 | OSS contribution workflow & etiquette | Partial | fork → branch → PR mechanics, small PRs | reading CONTRIBUTING/CoC, issue-first, good first issues, responding to review, DCO/CLA |
| 30 | Reading an unfamiliar repo | **Missing** | — | **README/CONTRIBUTING/CODEOWNERS, repo structure, entry points, insights/graphs, code search, dependency graph**. This is the core of Kitty's Repo Walkthrough. |

**Summary:** 12 Covered · 10 Partial · 4 Minimal · 4 Missing. The weakest areas are GitHub-platform topics
(#12, #13, #21, #22, #30) and intermediate/advanced Git (#6, #7, #23–#28).

## 4. `Git_Github Notes.pdf` (image-only)

The 4 pages are photographed hand-drawn notes on pull, push, merge, rebase, cherry-pick and log. The pages are signed
`@girlie_mac`. The repository owner confirmed (2026-11-02) that it is their own material to include.

**Decision: included.** The PDF has no text layer, so ingest reads a hand transcription instead,
[`kitty/ingest/transcripts/Git_Github Notes.md`](transcripts/Git_Github%20Notes.md). Chunks still cite the PDF.
OCR was not used because handwriting on illustrated pages recognises poorly. Kitty's cat sprite remains an original pixel design.

## 5. Accuracy issues in the PDFs (Kitty must not repeat these)

| Where | Claim | Correction |
|---|---|---|
| 101 p.2 | `git fetch --all --prune` — "prune gets deleted commits too" | `--prune` removes remote-tracking branches that no longer exist on the remote. It doesn't touch commits. (Scenarios p.14 has this right.) |
| 101 p.2 | `git reset <hash>` — "all the commits *before* this" go to unstaged | It's the commits **after** `<hash>` whose changes become unstaged (mixed reset). |
| 101 p.1 | Vim: "press the left-right arrow key to disable writing mode" | Press `Esc` to leave insert mode, then `:x` or `:wq`. |
| 101 p.2 | Conflicts "have to be resolved manually by repo maintainer" | Usually the PR author resolves them, either locally or in GitHub's conflict editor. |
| Missing p.8 | "GitHub automatically creates a Release when you push an annotated tag" | Pushing a tag only creates a tag. A Release must be created (web, `gh release create`, or an Actions workflow). |
| Missing p.16 | Store PAT with `git config --global credential.helper store` | `store` writes the token **in plain text** to `~/.git-credentials`. Prefer Git Credential Manager / osxkeychain / libsecret. |
| Missing p.3 | Reflog entries are GC'd "after 90 days" | Defaults: 90 days for reachable entries (`gc.reflogExpire`), **30 days for unreachable** (`gc.reflogExpireUnreachable`). Lost commits are usually the unreachable kind. |
| Scenarios p.13 | Remove a leaked `.env` with `git revert` + `git filter-branch` | `revert` leaves the secret in history. Git's own docs warn against `filter-branch`; use `git filter-repo` (or BFG) per GitHub Docs, and **rotate the leaked credential first**. |
| Scenarios p.4 | "Once SSH is set up, you never need a password or token again" | SSH covers git transport only. gh CLI, the API, and HTTPS remotes still use tokens, and a passphrase-protected key still prompts unless the agent caches it. |
| Scenarios p.11 | "<<< to === is YOUR code" | True for merges. **During a rebase, the sides are swapped** (HEAD is the upstream being rebased onto). |

These corrections will be written into the gap-fill references and the tutor's system prompt. The PDFs themselves stay untouched.

## 6. Other findings

- The README links a `LICENSE` (MIT badge), but **no LICENSE file exists** in the repo.
- Openly licensed material will be **mixed-license**: Pro Git excerpts are CC BY-NC-SA 3.0
  (ShareAlike: adapted text must stay under that license; NonCommercial: fine for the hackathon, but revisit
  if Kitty is ever commercial), GitHub Docs are CC BY 4.0, git docs are GPLv2. Every reference file will carry its own
  license header, and `SOURCES.md` will state that `references/` is **not** covered by the repo's MIT license.

## 7. Gap-fill material

**Status (2026-11-02): done.** All 24 files plus `Git/references/SOURCES.md` were generated from 56 source pages
(progit2 `a013e32`, github/docs `b8fe410`, git/git `ebdc087`). Total is about 74k words, above the estimate below,
because whole sections were kept instead of being cut mid-section. The largest file is about 5k words. All source URLs were checked.

**How:** fetch the sources as raw files from their own repos rather than scraping HTML:
`progit/progit2` (AsciiDoc), `github/docs` (Markdown + Liquid), `git/git` `Documentation/` (AsciiDoc).
Convert each to Markdown and keep only the relevant sections (~800–3,000 words per file). Strip Liquid/version
tags and mark every file "adapted" (CC BY requires saying what changed). Every file starts with a header like this:

```md
<!-- Source: <canonical URL(s)> · Retrieved: 2026-11-xx · License: <name + URL>
     Attribution: <author/org> · Changes: excerpted and converted to Markdown -->
```

### `Git/references/` (concepts and reference)

| File | Fills | Sources (licenses) |
|---|---|---|
| `SOURCES.md` | — | Every source, URL, license, attribution; states `references/` is not MIT |
| `interactive-staging.md` | #2 | Pro Git 7.2 Interactive Staging (CC BY-NC-SA 3.0) |
| `branches-and-merging.md` | #4, #5 | Pro Git 3.1 Branches in a Nutshell, 3.2 Basic Branching and Merging (CC BY-NC-SA 3.0); `git-merge` docs (GPLv2) |
| `rebasing.md` | #6 | Pro Git 3.6 Rebasing (incl. "The Perils of Rebasing"), 7.6 Rewriting History (CC BY-NC-SA 3.0); `git-rebase` docs (GPLv2) |
| `advanced-merging-and-conflicts.md` | #7 | Pro Git 7.8 Advanced Merging, 7.9 Rerere (CC BY-NC-SA 3.0); `git-mergetool` docs (GPLv2) |
| `reset-demystified.md` | #8 | Pro Git 7.7 Reset Demystified (CC BY-NC-SA 3.0) |
| `stashing-and-cleaning.md` | #9 | Pro Git 7.3 Stashing and Cleaning (CC BY-NC-SA 3.0) |
| `remotes-and-tracking-branches.md` | #10 | Pro Git 2.5 Working with Remotes, 3.5 Remote Branches (CC BY-NC-SA 3.0) |
| `pull-requests-and-code-review.md` | #12 | GitHub Docs: About pull requests; About merge methods on GitHub; Reviewing proposed changes in a pull request; About code owners (CC BY 4.0) |
| `issues-and-templates.md` | #13 | GitHub Docs: About issues; Linking a pull request to an issue; About issue and pull request templates (CC BY 4.0) |
| `authentication-ssh-and-tokens.md` | #19 | GitHub Docs: About authentication to GitHub; Managing your personal access tokens; Caching your GitHub credentials in Git (CC BY 4.0); Pro Git 7.14 Credential Storage (CC BY-NC-SA 3.0) |
| `github-actions-basics.md` | #21 | GitHub Docs: Understanding GitHub Actions; Quickstart for GitHub Actions (CC BY 4.0) |
| `branch-protection-and-rulesets.md` | #22 | GitHub Docs: About protected branches; About rulesets (CC BY 4.0) |
| `commit-signing.md` | #23 | GitHub Docs: About commit signature verification; Signing commits (CC BY 4.0); Pro Git 7.4 Signing Your Work (CC BY-NC-SA 3.0) |
| `submodules.md` | #24 | Pro Git 7.11 Submodules (CC BY-NC-SA 3.0) |
| `worktrees.md` | #25 | `git-worktree` docs (GPLv2) |
| `hooks.md` | #26 | Pro Git 8.3 Git Hooks (CC BY-NC-SA 3.0); `githooks` docs (GPLv2) |
| `git-lfs.md` | #27 | GitHub Docs: About Git Large File Storage; Configuring Git Large File Storage (CC BY 4.0) |
| `git-internals.md` | #28 | Pro Git 10.1 Plumbing and Porcelain, 10.2 Git Objects, 10.3 Git References (CC BY-NC-SA 3.0) |

### `Scenario-Based_Guide/references/` (scenario-style)

| File | Fills | Sources (licenses) |
|---|---|---|
| `understanding-an-unfamiliar-repo.md` | #30 | GitHub Docs: About READMEs; About code owners; Navigating code on GitHub; About GitHub Code Search; About the dependency graph; Viewing a project's contributors (CC BY 4.0) |
| `contributing-to-open-source.md` | #29 | GitHub Docs: Finding ways to contribute to open source on GitHub; Setting guidelines for repository contributors; Contributing to a project (CC BY 4.0); Pro Git 5.2 Contributing to a Project (CC BY-NC-SA 3.0) |
| `updating-a-pr-after-review.md` | #12 | GitHub Docs: Incorporating feedback in your pull request; Keeping your pull request in sync with the base branch; Committing changes to a pull request branch created from a fork (CC BY 4.0) |
| `resolving-conflicts-during-rebase.md` | #7 | GitHub Docs: Resolving merge conflicts after a Git rebase (CC BY 4.0); `git-rebase` docs (GPLv2) |
| `resolving-conflicts-on-github.md` | #7 | GitHub Docs: Resolving a merge conflict on GitHub; Resolving a merge conflict using the command line (CC BY 4.0) |
| `removing-sensitive-data.md` | §5 fix | GitHub Docs: Removing sensitive data from a repository (CC BY 4.0) |

**Totals:** 24 topic files + `SOURCES.md`, estimated 40–55k words, which comes to roughly 100–130 chunks.
Covered topics (#1, #3, #11, #14–#18, #20) get no new files; they're handled by the PDFs.

### Ingest changes (done in Phase 1)
- `Git/references/**/*.md` and `Scenario-Based_Guide/references/**/*.md` are indexed alongside the PDFs.
- `Git/Git_Github Notes.pdf` is indexed via its transcript (see §4).
- Each chunk carries `{ sourceFile, sourceUrl, license }` so tutor answers can cite correctly.
