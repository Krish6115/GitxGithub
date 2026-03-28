<div align="center">

# 🐙 Git × GitHub — Cheat Sheet & Scenario Guide

> Everything you need to go from **zero to confident** with Git & GitHub  
> Cheat sheets · Illustrated PDFs · Real-world scenarios · Basic → Advanced

[![Stars](https://img.shields.io/github/stars/Krish6115/GitxGithub?style=for-the-badge&color=orange)](https://github.com/Krish6115/GitxGithub/stargazers)
[![Forks](https://img.shields.io/github/forks/Krish6115/GitxGithub?style=for-the-badge&color=blue)](https://github.com/Krish6115/GitxGithub/forks)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](https://github.com/Krish6115/GitxGithub/pulls)

</div>

---

## 📌 Why This Repo?

Most Git tutorials either drown you in theory or show you 3 commands and call it a day.  
This repo takes a **scenario-first approach** — real situations, exact commands, and explanations of *why* each one works.

Whether you're:
- 🆕 Pushing your first file to GitHub
- 🤝 Collaborating on a team project
- 🔥 Recovering from a bad `git reset`
- 🚀 Tagging releases and working with PRs

...this repo has you covered.

---

## 📂 What's Inside
```
GitxGithub/
├── 📁 Git/
│   ├── 📄 Git_GitHub_101.pdf          ← Basics: CLI, branching, forking, stash, rebase
│   ├── 📄 Git_Github Notes.pdf        ← Workflow notes & command reference
│   └── 📄 git-cheat-sheet-education.pdf ← Official GitHub cheat sheet
└── 📄 README.md                       ← You're here
```

---

## 🚀 Quick Start — The Everyday Loop

> **New to Git?** Run these 4 commands. That's it.
```bash
# 1️⃣  One-time setup (first time on any machine)
git config --global user.name "YourName"
git config --global user.email "you@example.com"

# 2️⃣  Clone the repo once
git clone https://github.com/YourUsername/YourRepo.git
cd YourRepo

# 3️⃣  Stage → Commit → Push  (repeat for every change)
git add path/to/YourFile.java
git commit -m "Add InsertLinkedList.java to LinkedList folder"
git push origin main
```

> 🔥 **If push is rejected** (someone else pushed first):
> ```bash
> git pull origin main --rebase
> git push origin main
> ```

---

## 📋 10 Real-World Scenarios Covered

| # | Scenario | What You'll Learn |
|---|----------|-------------------|
| 01 | **First-Time Setup** | git config, SSH keys, no-password auth |
| 02 | **Upload Your First File** | clone → add → commit → push |
| 03 | **Working with Branches** | feature branches, merge, cleanup |
| 04 | **Contributing via Fork** | fork, upstream remote, pull requests |
| 05 | **Handling Merge Conflicts** | conflict markers, manual resolve |
| 06 | **Undoing Mistakes** | restore, reset, revert — matched to situation |
| 07 | **Keeping Fork in Sync** | fetch, rebase, reset --hard upstream |
| 08 | **Team Feature Branch Workflow** | squash commits, PR review, protect main |
| 09 | **Tagging & Releasing Versions** | annotated tags, GitHub Releases, semver |
| 10 | **Cherry-pick & Bisect** | apply one commit anywhere, binary-search bugs |

---

## 📘 What the PDFs Cover

<table>
<tr>
<td width="50%">

### 🔰 Git & GitHub 101
- Basic CLI commands (`ls`, `mkdir`, `cd`)
- `git init`, `git clone`, `git status`
- Staging, committing, pushing
- Branching, checkout, merge
- Forking, upstream, pull requests
- Stash, rebase, squash commits
- Merge conflict resolution

</td>
<td width="50%">

### 🎓 GitHub Education Cheat Sheet
- Setup & init
- Stage & snapshot
- Branch & merge
- Inspect & compare
- Tracking path changes
- Ignoring patterns
- Rewriting history
- Temporary commits (stash)

</td>
</tr>
</table>

---

## 🧠 The Commands You Actually Need to Know
```bash
# ── Daily workflow ────────────────────────────────────────────
git status                        # what's changed?
git add .                         # stage everything
git commit -m "feat: your msg"    # commit
git push                          # push

# ── Branches ─────────────────────────────────────────────────
git checkout -b feature/my-thing  # create + switch
git checkout main                 # go back to main
git merge feature/my-thing        # merge in

# ── Oops recovery ────────────────────────────────────────────
git restore filename.txt          # undo unsaved edits
git restore --staged filename.txt # unstage a file
git reset HEAD~1 --soft           # undo last commit, keep changes
git revert abc1234                # safely undo a pushed commit

# ── Inspect ──────────────────────────────────────────────────
git log --oneline --graph --all   # visual branch history
git diff                          # what changed (unstaged)
git blame filename.js             # who wrote each line
git reflog                        # full history — recover anything
```

---

## 🤝 Contributing

Contributions are welcome! Found a missing scenario? A cleaner explanation?
```bash
# 1. Fork this repo (click Fork button above)
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/GitxGithub.git

# 3. Create a branch
git checkout -b improve/scenario-name

# 4. Make your changes, commit
git add .
git commit -m "Add: scenario for GitHub Actions workflow"

# 5. Push and open a Pull Request
git push origin improve/scenario-name
```

Then open a Pull Request from your fork → this repo's `main`.

**Good first contributions:**
- 📝 Fix a typo or unclear explanation
- ➕ Add a missing command or scenario
- 🌍 Add examples for Windows (most examples use Mac/Linux)
- 🖼 Improve illustrations or diagrams in the PDFs

---

## 🌟 Share This Repo

If this helped you, consider:

- ⭐ **Starring** the repo (top right of this page)
- 🍴 **Forking** it to build your own version
- 📢 **Sharing** in your dev community, discord, or college group

> *Every star helps more developers find this resource.*

---

## 📬 Connect

Made by **[Krish6115](https://github.com/Krish6115)** — CS undergraduate, backend developer, competitive programmer.

Feel free to open an [issue](https://github.com/Krish6115/GitxGithub/issues) if something's unclear or missing.

---

<div align="center">

**⭐ Star · 🍴 Fork · 📢 Share**

*Built for developers who want to understand Git, not just memorize commands.*

</div>
