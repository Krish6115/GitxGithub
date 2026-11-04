// A provider that streams a fixed reply and records what it was asked.
import type { ChatRequest, Provider, StreamEvent } from '../../src/llm/types.js';

export function scripted(text: string): Provider & { reqs: ChatRequest[] } {
  const reqs: ChatRequest[] = [];
  return {
    name: 'bharatcode',
    reqs,
    chat: async (req) => {
      reqs.push(req);
      return { text, finishReason: 'stop', truncated: false, usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }, model: 'x' };
    },
    async *stream(req): AsyncGenerator<StreamEvent> {
      reqs.push(req);
      yield { type: 'delta', text };
      yield { type: 'done', result: { text, finishReason: 'stop', truncated: false, usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }, model: 'x' } };
    },
  };
}

export async function collect<T>(it: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const e of it) out.push(e);
  return out;
}
