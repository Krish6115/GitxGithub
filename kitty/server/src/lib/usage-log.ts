// One JSON log line per LLM request, so token cost can be reported. Never logs keys or prompts.
import type { ChatResult, TaskKind } from '../llm/types.js';

export interface UsageEntry {
  kind: TaskKind;
  provider: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  finishReason: string;
  truncated: boolean;
  ms: number;
}

export type UsageLogger = (entry: UsageEntry) => void;

export const consoleUsageLogger: UsageLogger = (entry) => console.log(JSON.stringify({ event: 'llm_usage', ...entry }));

export function usageEntry(kind: TaskKind, provider: string, result: ChatResult, ms: number): UsageEntry {
  return {
    kind,
    provider,
    model: result.model,
    promptTokens: result.usage?.promptTokens ?? null,
    completionTokens: result.usage?.completionTokens ?? null,
    totalTokens: result.usage?.totalTokens ?? null,
    finishReason: result.finishReason,
    truncated: result.truncated,
    ms: Math.round(ms),
  };
}
