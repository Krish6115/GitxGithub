import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env.js';

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv({});
    expect(env.LLM_PROVIDER).toBe('mock');
    expect(env.PORT).toBe(8787);
    expect(env.BHARATCODE_MODEL).toBe('qwen-3.8-27b');
    expect(env.BHARATCODE_API_KEY).toBeUndefined();
  });

  it('treats empty strings as unset and coerces numbers', () => {
    const env = loadEnv({ BHARATCODE_API_KEY: '', PORT: '9000', LLM_PROVIDER: '' });
    expect(env.BHARATCODE_API_KEY).toBeUndefined();
    expect(env.PORT).toBe(9000);
    expect(env.LLM_PROVIDER).toBe('mock');
  });

  it('rejects an unknown provider', () => {
    expect(() => loadEnv({ LLM_PROVIDER: 'openai' })).toThrow(/Invalid environment/);
  });
});
