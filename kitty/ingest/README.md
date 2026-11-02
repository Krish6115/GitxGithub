# @kitty/ingest

Builds Kitty's knowledge index from the repository's learning material.

| Command (run in `kitty/`) | What it does |
|---|---|
| `npm run ingest` | Reads the learning sources and writes `kitty/server/data/index.json` (committed). |
| `npm run refs:fetch -w ingest` | Downloads the pinned upstream files for the knowledge references into `kitty/ingest/.cache/` (gitignored). |
| `npm run refs:build -w ingest` | Regenerates `Git/references/*.md`, `Scenario-Based_Guide/references/*.md` and `Git/references/SOURCES.md` from that cache. |

`AUDIT.md` records which topics the PDFs cover and why the references exist.

## Regenerating the knowledge references

The files under `*/references/` are adapted excerpts from three openly licensed upstreams, each pinned to an exact commit
in [`scripts/references/pins.ts`](scripts/references/pins.ts):

| Upstream | Pinned commit | License |
|---|---|---|
| [progit/progit2](https://github.com/progit/progit2) (*Pro Git*, 2nd ed.) | `a013e3230a1207cfa5ae94d28ba7d2021063c337` | CC BY-NC-SA 3.0 |
| [github/docs](https://github.com/github/docs) (GitHub Docs) | `b8fe41031dc00ff247641ca75bd7e6d25267d6e1` | CC BY 4.0 |
| [git/git](https://github.com/git/git) (`Documentation/`) | `ebdc087dc99d68bb340c282b2ba5f722def28d19` | GPL-2.0 |

```bash
cd kitty
npm run refs:fetch -w ingest   # downloads ~280 raw files from raw.githubusercontent.com at the pinned SHAs
npm run refs:build -w ingest   # rewrites the reference files + SOURCES.md
git diff --stat                # with unchanged pins and spec, there should be no diff
```

Building from the same pins and spec is deterministic. Running these steps from a clean cache on 2026-11-02 reproduced
every committed reference file byte for byte.

### Changing what's included

- **Which sections go where:** edit [`scripts/references/spec.ts`](scripts/references/spec.ts). Each output file lists its parts:
  `p()` for a Pro Git section, `g()` for a GitHub Docs page, `d()` for a git man page. `keep` and `drop` select sections by heading title.
  The build fails if a named heading doesn't exist, which catches upstream renames.
- **Updating upstream:** change the SHAs (and `RETRIEVED`) in `pins.ts`, delete `kitty/ingest/.cache/`, fetch, build, then
  review the diff. Upstream edits can change wording or headings.
- **Licensing:** only add openly licensed sources. Each generated file states its sources and licenses, and `SOURCES.md` is regenerated
  with every build. Pro Git material is ShareAlike: anything adapted from it stays CC BY-NC-SA 3.0.

### How the conversion works

| File | Role |
|---|---|
| `pins.ts` | Upstream repos, pinned SHAs, licenses, cache paths |
| `spec.ts` | Output files and the upstream sections each one contains |
| `fetch.ts` | Downloads the files in `spec.ts`, plus GitHub Docs variables and shared snippets (resolved recursively) |
| `adoc.ts` | AsciiDoc to Markdown (Pro Git and man pages). Drops figures and points figure references at the caption. |
| `liquid.ts` | GitHub Docs Liquid to Markdown, rendered for GitHub.com only (no Enterprise Server variants) |
| `sections.ts` | Code-fence-aware section selection and heading shifts |
| `build.ts`, `sources-md.ts` | Assemble each file with its license header and write `SOURCES.md` |
