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

function answer(req: ChatRequest): string {
  const lastUser = [...req.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  if (req.kind === 'tour') return mockTour(lastUser);
  if (req.kind === 'explain') return 'Mock explanation: Kitty would explain the selected text here.';
  return 'Mock answer: Kitty would answer your Git question here, citing the retrieved sources.';
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
