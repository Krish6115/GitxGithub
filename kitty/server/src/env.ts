import { z } from 'zod';

export const EnvSchema = z.object({
  LLM_PROVIDER: z.enum(['mock', 'bharatcode']).default('mock'),
  PORT: z.coerce.number().int().positive().default(8787),
  BHARATCODE_BASE_URL: z.url().default('https://bharatcode.ai/api/model/v1'),
  BHARATCODE_MODEL: z.string().min(1).default('qwen-3.8-27b'),
  BHARATCODE_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(20),
  LLM_FIRST_TOKEN_MS: z.coerce.number().int().positive().default(60_000),
  LLM_IDLE_MS: z.coerce.number().int().positive().default(30_000),
  TOUR_CACHE_TTL_MIN: z.coerce.number().int().positive().default(360),
  TOUR_MAX_STEPS: z.coerce.number().int().min(4).max(15).default(10),
});

export type Env = z.infer<typeof EnvSchema>;

/** Parse and validate environment variables. Empty strings count as unset. */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== ''));
  const result = EnvSchema.safeParse(cleaned);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
