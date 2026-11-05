# 🐾 Kitty — your Git & GitHub companion

Kitty is a pixel cat that lives on **github.com** (Chrome extension) and turns GitKitty's learning material into help you can use while you work. It runs on the BharatCode model `qwen-3.8-27b`.

| | What it does |
|---|---|
| 🗺️ **Tour this repo** | Click the cat on any repository. Kitty picks the files that map the project (README, how it's built, the entry point, the core modules one per area, tests, CI: 5 steps for small repos, up to 12 for big ones) and starts walking at once. The model's "what it is / why it matters" for each file streams in while you read. |
| 💬 **Ask Kitty** | Side-panel chat. Answers are scenario-first (Situation → Commands → Why → How to undo) and cite their sources. It sees the page you're on, knows your tour step, and can send the cat: "find me a Docker issue", "tour pallets/flask" or "help me fix cli/cli#123" take your tab there and the cat takes over. |
| 🔍 **Explain this** | Select a command, diff, PR text or code (or right-click it) for a short explanation. Commands get a risk label: *Safe*, *Rewrites history* or *Can lose work*. |
| 🌱 **Find a good first issue** | On a repo page: open, unassigned issues ranked for newcomers (beginner labels, quiet threads, recent activity). No AI tokens. |
| 🛠️ **Help me fix this issue** | On an issue page (or from the list above): Kitty walks you through the files most likely involved, explains what to look for in each, and gives you a fix plan plus exact git commands for your fork, a branch named after the issue, and the link that opens the PR form. |
| ✈️ **Check my PR** | On a pull request: a pre-flight check for what maintainers send PRs back for (conflicts, out-of-date branch, empty or unfilled description, no linked issue, no tests, merge or WIP commits, and Conventional Commits or DCO sign-off when CONTRIBUTING asks), with a fix command for each. Rule-based, no AI tokens. |

## Install

1. Download `kitty-extension-v0.8.0.zip` from the [latest release](https://github.com/Krish6115/GitKitty/releases/latest) and unzip it.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the folder.
3. The welcome screen checks the server connection. Open any repo and click the cat.

The release uses the hosted server at `https://kitty-server.vercel.app` (20 requests per minute per user). You can also add your own BharatCode key in **Settings**.

## Run it locally

```bash
cd kitty
npm ci
cp server/.env.example server/.env   # add BHARATCODE_API_KEY, set LLM_PROVIDER=bharatcode
npm run dev -w server                # http://localhost:8787 (mock model until LLM_PROVIDER=bharatcode)
npm run build:e2e -w extension       # a build that talks to localhost; load kitty/extension/dist unpacked (plain build uses the hosted server)
```

| Command | What it does |
|---|---|
| `npm test` | 160+ unit tests (network disabled) |
| `npm run eval -w ingest` | Retrieval quality check: 52 questions, target ≥ 85% hit@6 |
| `npm run build-faq -w server` | Regenerate the saved instant answers (`server/data/faq.json`) with the real model |
| `npm run ingest` | Rebuild the knowledge index from the PDFs and references |
| `npm run e2e -w extension -- all` | Browser e2e suites ([details](extension/e2e/README.md)) |
| `VITE_KITTY_SERVER_URL=<url> npm run package -w extension` | Build the release zip |

## Host your own server (Vercel)

- **Root directory:** `kitty/server`
- **Framework:** Hono
- **Install command:** `cd .. && npm ci -w server --include-workspace-root`
- **Environment variables:** `LLM_PROVIDER=bharatcode`, `BHARATCODE_API_KEY`, and optionally `GITHUB_TOKEN`

Then set the URL in Kitty's **Settings**.

## How it works

```mermaid
flowchart LR
  subgraph EXT["Chrome extension on github.com"]
    direction TB
    CS["<b>On the page</b> (content script)<br/>Kitty the cat · repo / issue / PR tours<br/>Show me how · Explain this · button hints<br/>PR check · Copilot hand-off"]
    SP["<b>Side panel</b><br/>Ask Kitty chat · Learn: lessons, quizzes<br/>Practice (Git simulator) · First PR guide"]
    LOCAL[("Browser storage<br/>settings · progress · tour state<br/>(never leaves the browser)")]
    SW["<b>Service worker</b><br/>the only part that talks to the server"]
    CS --> SW
    SP --> SW
    CS -.-> LOCAL
    SP -.-> LOCAL
  end

  subgraph SRV["Kitty server · Hono on Vercel"]
    direction TB
    AI["<b>AI routes</b><br/>/tour · /tutor · /explain<br/>/ci-explain · /draft-pr"]
    RULES["<b>Rule-based routes</b> (no tokens)<br/>/issues · /search-issues · /preflight"]
    RAG[("Knowledge<br/>BM25 index over PDFs + Pro Git<br/>+ Git/GitHub docs · saved answers<br/>· 30 Git-error rules")]
    GUARD["Every request: rate limit · zod validation<br/>untrusted-text fencing · timeouts + retry"]
    AI --> RAG
  end

  subgraph OUT["External services"]
    direction TB
    BC["BharatCode<br/>qwen-3.8-27b"]
    GH["GitHub REST API<br/>repos · issues · PRs · CI logs · code search"]
    CP["GitHub Copilot<br/>(github.com/copilot)"]
  end

  SW -- "HTTPS, streamed (SSE)" --> AI
  SW --> RULES
  AI --> GH
  RULES --> GH
  AI -- "prompt + retrieved sources" --> BC
  CS -. "types the prepared prompt;<br/>you press Enter" .-> CP

  classDef ext fill:#dafbe1,stroke:#1a7f37,color:#1f2328
  classDef srv fill:#ddf4ff,stroke:#0969da,color:#1f2328
  classDef outside fill:#f6f8fa,stroke:#57606a,color:#1f2328
  class CS,SP,SW,LOCAL ext
  class AI,RULES,RAG,GUARD srv
  class GH,BC,CP outside
  style OUT fill:#f6f8fa,stroke:#57606a,color:#1f2328
  style EXT fill:#f0fff4,stroke:#1a7f37,color:#1a7f37
  style SRV fill:#f0f7ff,stroke:#0969da,color:#0969da
```

**How a request flows:** the cat or the side panel asks the service worker, which calls the Kitty server. The server pulls real context from GitHub (files, issues, diffs, CI logs), retrieves the best-matching learning material, and asks BharatCode to explain it, streaming the answer back. Issue ranking and the PR check are plain rules, and Practice mode and lessons run entirely in the browser, so they cost no tokens. For writing code, Kitty hands the request to GitHub Copilot.

- **GitHub token (optional, recommended):** set `GITHUB_TOKEN` on the server (a classic token with only the `public_repo` scope) or add your own in Kitty settings. It raises GitHub's rate limits and unlocks two things GitHub only serves to signed-in callers: code search for "where is X handled?" questions, and full CI logs for "Why did this fail?" (without it Kitty can only see GitHub's short summary).
- **Grounded answers:** the PDFs and `*/references/` are chunked into a prebuilt index (`server/data/index.json`). The tutor answers from the best-matching chunks and must cite them.
- **Safe by design:** API keys never ship in the extension. Repository and page text is treated as untrusted, so a README that tries to instruct the model is ignored. Answers stream with timeouts and retry on transient failures.

## Cost per request (measured on the live model)

| Feature | Typical tokens | Typical time |
|---|---|---|
| Repo tour | ~10k | walking in ~2 s; explanations done in 20–90 s |
| Tutor answer | ~3k | first words in 3–8 s |
| Common question (saved answer) | 0 | instant |
| Explain this | ~1k | 5–14 s |

Tours are cached per repository commit, so a second tour of the same repo costs nothing.

## Credits

Kitty's knowledge comes from GitKitty's PDFs plus adapted excerpts from [*Pro Git*](https://git-scm.com/book) by Scott Chacon and Ben Straub ([CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)), [GitHub Docs](https://github.com/github/docs) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)) and the [Git documentation](https://git-scm.com/docs) ([GPL-2.0](https://github.com/git/git/blob/master/COPYING)). Each excerpt is attributed in [`Git/references/SOURCES.md`](../Git/references/SOURCES.md) and keeps its own license. The cat is an original pixel design. UI icons are [GitHub Octicons](https://github.com/primer/octicons) (MIT License, © GitHub Inc.).
