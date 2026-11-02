# Contributing to GitKitty

Thanks for helping! Small fixes are as welcome as big features.

## Good first contributions

- 📝 Fix a typo or an unclear explanation
- ➕ Add a missing command or scenario
- 🌍 Add Windows examples (most examples use macOS/Linux)
- 🐾 Improve Kitty: see the open [issues](https://github.com/Krish6115/GitKitty/issues)

## Workflow

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/GitKitty.git
cd GitKitty

# 2. Create a branch
git checkout -b fix/short-description

# 3. Commit and push
git add .
git commit -m "docs: clarify git rebase scenario"
git push origin fix/short-description
```

Then open a pull request from your fork to `main`.

## Working on Kitty

Setup and commands are in [kitty/README.md](kitty/README.md). Before opening a PR:

```bash
cd kitty
npm run build && npm test && npm run eval -w ingest
```

- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:` …), one logical change per commit.
- TypeScript strict; validate external input with zod; keep files small.
- Changed the PDFs or `*/references/`? Run `npm run ingest` and commit the updated `kitty/server/data/index.json` (CI checks it).
- Never commit API keys or `.env` files.

By contributing you agree that your work is licensed under the [MIT License](LICENSE) and that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
