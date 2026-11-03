// Provider-agnostic chat types.

export type Role = 'system' | 'user' | 'assistant';
export interface ChatMessage {
  role: Role;
  content: string;
}

export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high';
export type TaskKind = 'tour' | 'tutor' | 'explain';

export interface ChatRequest {
  /** Which feature is calling (used for logging and by the mock provider). */
  kind: TaskKind;
  messages: ChatMessage[];
  /** Output cap override; defaults to CALL_BUDGETS[kind]. Includes reasoning tokens on BharatCode. */
  maxTokens?: number;
  /** Override; defaults to CALL_BUDGETS[kind]. */
  reasoningEffort?: ReasoningEffort;
  temperature?: number;
  signal?: AbortSignal;
  /** Per-request limits (ms), tighter than the defaults: give up sooner when the model is busy. */
  firstTokenMs?: number;
  totalMs?: number;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResult {
  text: string;
  finishReason: string;
  /** True when the model hit the output limit (`finish_reason: "length"`); `text` is the partial output. */
  truncated: boolean;
  usage: Usage | null;
  model: string;
}

export type StreamEvent = { type: 'delta'; text: string } | { type: 'done'; result: ChatResult };

export interface Provider {
  readonly name: 'mock' | 'bharatcode';
  chat(req: ChatRequest): Promise<ChatResult>;
  stream(req: ChatRequest): AsyncIterable<StreamEvent>;
}
