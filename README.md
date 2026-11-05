<div align="center">

# GitKitty

**Learn Git & GitHub the practical way: cheat sheets, real-world scenarios, and Kitty, a pixel cat that tours repos and tutors you right on github.com.**

[![Stars](https://img.shields.io/github/stars/Krish6115/GitKitty?style=for-the-badge&color=orange)](https://github.com/Krish6115/GitKitty/stargazers)
[![Release](https://img.shields.io/github/v/release/Krish6115/GitKitty?style=for-the-badge&color=blueviolet)](https://github.com/Krish6115/GitKitty/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<a href="docs/kitty-promo.mp4"><img src="docs/kitty-promo.gif" alt="GitKitty promo: Kitty touring a repository in seconds, answering a common Git question instantly, finding a Docker issue and explaining it on the page, and pre-flight checking a pull request" width="820"></a>

<sub>▶ <a href="docs/kitty-promo.mp4">Watch the full-quality video (MP4)</a></sub>

</div>

## Meet Kitty

A Chrome extension that lives on github.com and teaches Git and GitHub on the pages you are already using.

**Learn**
- **Ask Kitty:** a side-panel tutor with scenario-first answers that cite their sources, at your level (beginner, intermediate or advanced).
- **Explain my mistake:** paste a Git error and get what happened, the exact recovery commands and a risk label, instantly.
- **Lessons and quizzes:** 16 guided lessons, spaced-review quizzes and a Git health score (stored only in your browser).
- **Practice mode:** a safe, simulated repository with a live commit graph: try reset, rebase, revert, force push and recover with reflog without risking real work.

**On GitHub**
- **Tour this repo:** a guided walk through the key files of any repository.
- **Show me how:** the cat walks through GitHub's own pages and points at the real buttons: find your way around, fork and clone, open a pull request, review one, find CI results.
- **Why this button?:** hover Sync fork, Squash and merge, Update branch and more to see what they do in Git terms.
- **Explain this:** select a command, diff or PR text and get a short explanation with a risk label.
- **Why did this fail?:** on a failed GitHub Actions run, Kitty finds the real error in the log and explains the fix.
- **Ask about the code:** "where is X handled?" on a repository reads the matching files and links them.

**Contribute**
- **Find a good first issue:** by repository or by topic ("find me a Docker issue and take me there").
- **Help me fix this issue:** the files that matter for one issue, plus the exact git commands for your fork and branch.
- **First PR guide:** one checklist from picking an issue to a merged pull request, ticked as you go.
- **Check my PR:** what maintainers usually send back (including secrets, conflict markers and debug code in the diff), a merge-conflict rescue, and a drafted description and commit message.
- **Tour the changes:** walk through a pull request's changed files, each diff explained.

**Works with GitHub Copilot**
- Kitty teaches; Copilot writes code. When you ask for code to be written or changed, Kitty prepares the request, opens Copilot on github.com and types it in for you to review and send. Any tour can also be copied as context for Copilot or another assistant.

**Install:** download `kitty-extension-v0.8.0.zip` from the [latest release](https://github.com/Krish6115/GitKitty/releases/latest), unzip it, open `chrome://extensions`, turn on **Developer mode**, then **Load unpacked**.

How it works, running your own server, and costs: **[kitty/README.md](kitty/README.md)**

## Learning material

| Resource | What's inside |
|---|---|
| [`Git/Git_GitHub_101.pdf`](Git/Git_GitHub_101.pdf) | Basics: CLI, init/clone/commit/push, branching, PRs |
| [`Git/Git_Github Notes.pdf`](Git/Git_Github%20Notes.pdf) | Workflow notes and command reference |
| [`Git/git-cheat-sheet-education.pdf`](Git/git-cheat-sheet-education.pdf) | GitHub's official cheat sheet |
| [`Git/git_missing_topics.pdf`](Git/git_missing_topics%28other%20than%20101%2Cnotes%2Ccheatsheet%29.pdf) | Reflog, cherry-pick, bisect, blame, amend, `gh`, SSH, `.gitignore` |
| [`Scenario-Based_Guide/git_scenarios.pdf`](Scenario-Based_Guide/git_scenarios.pdf) | 10 real-world scenarios, from first setup to bisect |
| [`*/references/`](Git/references/) | Openly licensed deep dives (Pro Git, GitHub Docs, git docs) |

## The everyday loop

```bash
git add .
git commit -m "feat: your change"
git pull --rebase    # if someone pushed first
git push
```

Made a mistake? `git restore <file>` drops unsaved edits, `git reset --soft HEAD~1` undoes the last commit and keeps its changes, and `git revert <sha>` safely undoes a pushed commit.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

<div align="center">

Made by **[Krish6115](https://github.com/Krish6115)** · ⭐ Star it if it helped you

</div>
