// "Explain this" pipeline: classify -> (retrieve for commands) -> streamed explanation -> flag check.
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { streamWithEarlyRetry } from '../llm/early-retry.js';
import type { Provider, Usage } from '../llm/types.js';
import type { RetrievedChunk } from '../rag/retrieve.js';
import type { TutorSource } from '../tutor/service.js';
import { unverifiedFlags } from '../tutor/verify-flags.js';
import { classifySelection, commandRisk, type CommandRisk, type SelectionKind } from './classify.js';
import { explainMessages, type PageType } from './prompt.js';

export const MAX_SELECTION = 4000;

export const ExplainRequestSchema = z.object({
  text: z.string().trim().min(1).max(20_000),
  page: z
    .object({
      url: z.string().max(1000).optional(),
      pageType: z.enum(['pull_request_diff', 'pull_request', 'commit', 'file', 'issue', 'compare', 'repo', 'other']).optional(),
    })
    .default({}),
});
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;

export type ExplainEvent =
  | { type: 'meta'; kind: SelectionKind; risk: CommandRisk | null; truncated: boolean }
  | { type: 'sources'; sources: TutorSource[] }
  | { type: 'delta'; text: string }
  | { type: 'done'; usage: Usage | null; truncated: boolean; unverifiedFlags: string[] };

export interface ExplainDeps {
  provider: Provider;
  retrieve: (query: string, k: number) => RetrievedChunk[];
}

export async function* streamExplain(deps: ExplainDeps, req: ExplainRequest, signal?: AbortSignal): AsyncGenerator<ExplainEvent> {
  const cut = req.text.length > MAX_SELECTION;
  const text = cut ? req.text.slice(0, MAX_SELECTION) : req.text;
  const kind = classifySelection(text);
  const risk = kind === 'command' ? commandRisk(text) : null;
  yield { type: 'meta', kind, risk, truncated: cut };

  // Only commands are grounded in Kitty's sources; diffs, prose and code are about the page itself.
  const chunks = kind === 'command' ? deps.retrieve(text, 2) : [];
  if (chunks.length) {
    yield {
      type: 'sources',
      sources: chunks.map((c, i) => ({ n: i + 1, title: c.title, headingPath: c.headingPath, sourceFile: c.sourceFile, sourceUrl: c.sourceUrl, license: c.license })),
    };
  }
  const messages = explainMessages({ text, kind, risk, pageType: req.page.pageType ?? 'other', sources: chunks, nonce: randomBytes(6).toString('hex'), truncated: cut });
  let answer = '';
  for await (const ev of streamWithEarlyRetry(deps.provider, { kind: 'explain', messages, ...(signal ? { signal } : {}) })) {
    if (ev.type === 'delta') {
      answer += ev.text;
      yield ev;
    } else {
      // flags are checked against the selection too: explaining a flag the user selected is fine
      const known = [text, ...chunks.map((c) => c.text)];
      yield { type: 'done', usage: ev.result.usage, truncated: ev.result.truncated, unverifiedFlags: kind === 'command' ? unverifiedFlags(answer, known) : [] };
    }
  }
}
