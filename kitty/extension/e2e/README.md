# Extension end-to-end checks

Real-browser checks that load `kitty/extension/dist` unpacked into a throwaway Chromium profile and drive github.com.
They are not part of `npm test`: they need a browser, network access and the Kitty server.

```bash
cd kitty
npm run build -w extension
npm run dev -w server            # in another terminal (mock model by default; LLM_PROVIDER=bharatcode for the real one)
npm run e2e -w extension -- all  # or: cat | tour | chat | explain
```

| Suite | What it checks |
|---|---|
| `cat` | The cat renders on github.com and survives GitHub's in-page navigation. |
| `onboarding` | The welcome tab opens on install; Test connection reaches the server; finishing shows the normal tabs. Option: `--server URL`. |
| `tour` | Start a tour from the cat menu; Next/Next/Back across file pages; browser back button; leave and resume. Option: `--repo owner/name`. |
| `chat` | Cat menu "Ask Kitty" opens the side panel chat tab; a question streams an answer with citations. Option: `--question "..."`. |
| `features` | "Why did this fail?" on a failed CI run (`--run owner/repo/actions/runs/N`); a PR tour at the head commit; the context pack; the PR draft; the learning-path quiz. |
| `explain` | Selecting a git command shows the pill; the explanation streams; "Ask a follow-up"; the right-click path (simulated: Chrome's native menu can't be automated); Esc closes. |

**Browser:** branded Chrome no longer loads unpacked extensions from the command line, so a Playwright Chromium is used.
Install one with `npx playwright install chromium`, or point `KITTY_E2E_CHROME` at a Chromium executable.

Screenshots are written to `e2e/out/` (gitignored).
