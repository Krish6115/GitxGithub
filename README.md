<div align="center">

# 🐾 GitKitty

**Learn Git & GitHub the practical way: cheat sheets, real-world scenarios, and Kitty, a pixel cat that tours repos and tutors you right on github.com.**

[![Stars](https://img.shields.io/github/stars/Krish6115/GitKitty?style=for-the-badge&color=orange)](https://github.com/Krish6115/GitKitty/stargazers)
[![Release](https://img.shields.io/github/v/release/Krish6115/GitKitty?style=for-the-badge&color=blueviolet)](https://github.com/Krish6115/GitKitty/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<a href="docs/kitty-promo.mp4"><img src="docs/kitty-promo.gif" alt="GitKitty promo: Kitty touring a repository in seconds, answering a common Git question instantly, finding a Docker issue and explaining it on the page, and pre-flight checking a pull request" width="820"></a>

<sub>▶ <a href="docs/kitty-promo.mp4">Watch the full-quality video (MP4)</a></sub>

</div>

## 🐱 Meet Kitty

A Chrome extension that lives on github.com:

- 🗺️ **Tour this repo:** a guided walk through the key files of any repository.
- 💬 **Ask Kitty:** a side-panel tutor with scenario-first answers that cite their sources.
- 🔍 **Explain this:** select a command, diff or PR text and get a short explanation with a risk label.
- 🌱 **Find a good first issue:** Kitty ranks a repo's open, unassigned issues for newcomers.
- 🛠️ **Help me fix this issue:** a walkthrough of the files that matter for one issue, plus the exact git commands for your fork and branch.
- ✈️ **Check my PR:** a pre-flight check for what maintainers usually send back, with a fix command for each problem.

**Install:** download `kitty-extension-v0.6.2.zip` from the [latest release](https://github.com/Krish6115/GitKitty/releases/latest), unzip it, open `chrome://extensions`, turn on **Developer mode**, then **Load unpacked**.

➡️ How it works, running your own server, and costs: **[kitty/README.md](kitty/README.md)**

## 📚 Learning material

| Resource | What's inside |
|---|---|
| [`Git/Git_GitHub_101.pdf`](Git/Git_GitHub_101.pdf) | Basics: CLI, init/clone/commit/push, branching, PRs |
| [`Git/Git_Github Notes.pdf`](Git/Git_Github%20Notes.pdf) | Workflow notes and command reference |
| [`Git/git-cheat-sheet-education.pdf`](Git/git-cheat-sheet-education.pdf) | GitHub's official cheat sheet |
| [`Git/git_missing_topics.pdf`](Git/git_missing_topics%28other%20than%20101%2Cnotes%2Ccheatsheet%29.pdf) | Reflog, cherry-pick, bisect, blame, amend, `gh`, SSH, `.gitignore` |
| [`Scenario-Based_Guide/git_scenarios.pdf`](Scenario-Based_Guide/git_scenarios.pdf) | 10 real-world scenarios, from first setup to bisect |
| [`*/references/`](Git/references/) | Openly licensed deep dives (Pro Git, GitHub Docs, git docs) |

## ⚡ The everyday loop

```bash
git add .
git commit -m "feat: your change"
git pull --rebase    # if someone pushed first
git push
```

Made a mistake? `git restore <file>` drops unsaved edits, `git reset --soft HEAD~1` undoes the last commit and keeps its changes, and `git revert <sha>` safely undoes a pushed commit.

## 🤝 Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

<div align="center">

Made by **[Krish6115](https://github.com/Krish6115)** · ⭐ Star it if it helped you

</div>
