// Deterministic offline provider (LLM_PROVIDER=mock). Same request -> same answer, no network.
import type { ChatRequest, ChatResult, Provider, StreamEvent } from './types.js';

const estimate = (s: string): number => Math.ceil(s.length / 4);

/** Builds a schema-valid tour from the context the tour service sends (repo name + "### File:" sections). */
function mockTour(prompt: string): string {
  const repo = prompt.match(/^Repository: (.+)$/m)?.[1]?.trim() ?? 'this repository';
  // headings look like "### File: <path>  (why picked: …)"; paths may contain spaces
  const paths = [...prompt.matchAll(/^### File: (.+?)(?: {2}\(why picked:.*\))?$/gm)].map((m) => m[1]?.trim() ?? '').filter(Boolean);
  const manifests = paths.filter((p) => /(^|\/)(package\.json|pyproject\.toml|go\.mod|Cargo\.toml|pom\.xml|Gemfile)$/.test(p));
  const steps = paths.slice(0, 8).map((path) => ({
    path,
    title: `Look at ${path.split('/').pop() ?? path}`,
    what: `${path} is one of the key files Kitty picked for ${repo} (mock answer: no model was called).`,
    why_it_matters: 'Reading the key files first gives you a map of the project before you change anything.',
  }));
  return JSON.stringify({
    summary: `Mock tour of ${repo}. Set LLM_PROVIDER=bharatcode (or add your own key) for a real walkthrough.`,
    stack: manifests.length ? manifests.map((m) => m.split('/').pop() ?? m) : ['Unknown (mock)'],
    steps,
    how_to_run: 'Not stated in the repo (mock answer).',
    how_to_contribute: 'Read CONTRIBUTING.md if the repo has one, then open a small, focused pull request (mock answer).',
    good_first_issue_tips: ['Look for issues labelled "good first issue".', 'Start with docs or tests to learn the codebase.'],
  });
}

/** Scenario-format answer citing the first sources in the prompt (tests and offline UI work). */
function mockTutor(prompt: string): string {
  // "find me an issue about X": answer with a find_issues action, like the real model does
  const ask = /QUESTION: (.*)$/s.exec(prompt)?.[1] ?? '';
  const find = /\bfind\b.*\bissues?\b.*\b(?:about|with|using|uses|for|on)\s+([\w .+#-]{2,40})/i.exec(ask);
  if (find?.[1]) {
    const query = find[1].replace(/\s+(and|then)\b.*$/i, '').trim();
    return `Looking for beginner-friendly ${query} issues (mock answer).\nACTION: ${JSON.stringify({ type: 'find_issues', query })}`;
  }
  // "show me how to open a pull request" on a repo page: a show-me-how walkthrough
  const repo = /URL: https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/.exec(prompt)?.[1];
  if (repo && /\bshow me how\b.*\bpull request\b/i.test(ask)) return `I'll walk you through it on GitHub (mock answer).\nACTION: ${JSON.stringify({ type: 'guide', repo, guide: 'open-pr' })}`;
  // "write / implement / refactor …": that is GitHub Copilot's job
  if (/^\s*(please )?(write|implement|refactor|generate|build)\b/i.test(ask)) {
    return `Writing code is GitHub Copilot's job; I've prepared the question for it (mock answer).\nACTION: ${JSON.stringify({ type: 'copilot', prompt: `${repo ? `Repository: ${repo}\n\n` : ''}${ask.trim()}` })}`;
  }
  const titles = [...prompt.matchAll(/^\[(\d+)\] (.+)$/gm)].slice(0, 2).map((m) => ({ n: m[1] ?? '1', title: m[2] ?? '' }));
  if (titles.length === 0 || prompt.includes('NOTE: no closely relevant sources')) {
    return "I'm not sure, and my sources don't cover this. See the official docs: https://git-scm.com/docs (mock answer).";
  }
  const cite = titles.map((t) => `[${t.n}]`).join('');
  return [
    `**Situation:** You asked a Git question; Kitty found ${titles.map((t) => `"${t.title}"`).join(' and ')} ${cite}.`,
    '',
    '**Commands:**',
    '```bash',
    'git status   # see where you are',
    '```',
    '',
    `**Why:** This is a mock answer, so no model was called. The real answer would explain the commands from the sources ${cite}.`,
  ].join('\n');
}

function answer(req: ChatRequest): string {
  const lastUser = [...req.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  if (req.kind === 'tour') return mockTour(lastUser);
  const system = req.messages[0]?.content ?? '';
  if (system.startsWith('You write pull request descriptions')) {
    return JSON.stringify({ title: 'Mock PR title (no model was called)', description: '## What\nMock description: the real model writes this from your diff.\n\n## Why\n…\n\n## How I tested it\nDescribe how you tested this.', commit_message: 'Mock commit subject\n\nMock body line.' });
  }
  if (system.startsWith("You turn a learner's question")) return 'NONE';
  if (req.kind === 'explain') {
    const label = /RISK LABEL \(computed by Kitty, use it as given\): ([^:\n]+)/.exec(lastUser)?.[1];
    return `${label ? `**${label}.** ` : ''}Mock explanation: Kitty would explain the selected text here (no model was called).`;
  }
  return mockTutor(lastUser);
}

export function createMockProvider(): Provider {
  const run = (req: ChatRequest): ChatResult => {
    const text = answer(req);
    const promptTokens = estimate(req.messages.map((m) => m.content).join('\n'));
    const completionTokens = estimate(text);
    return {
      text,
      finishReason: 'stop',
      truncated: false,
      usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
      model: 'mock',
    };
  };
  return {
    name: 'mock',
    chat: async (req) => run(req),
    async *stream(req): AsyncGenerator<StreamEvent> {
      const result = run(req);
      for (let i = 0; i < result.text.length; i += 64) yield { type: 'delta', text: result.text.slice(i, i + 64) };
      yield { type: 'done', result };
    },
  };
}
