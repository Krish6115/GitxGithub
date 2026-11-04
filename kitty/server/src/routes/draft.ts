// POST /draft-pr: a suggested PR title, description and squash-commit message (JSON). Kitty never posts it.
import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../env.js';
import { createGitHubClient } from '../github/client.js';
import { draftPr } from '../github/draft-pr.js';
import type { RateLimiter } from '../lib/rate-limit.js';
import { toKittyError } from '../llm/errors.js';
import { guard, type RouteDeps } from './common.js';

const name = z.string().regex(/^[A-Za-z0-9_.-]{1,100}$/);
const DraftRequest = z.object({ owner: name, repo: name, pr: z.number().int().positive().max(100_000_000) });

export function draftRoute(env: Env, limiter: RateLimiter, deps: RouteDeps = {}): Hono {
  const route = new Hono();
  route.post('/draft-pr', async (c) => {
    const body = DraftRequest.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ code: 'bad_request', message: 'Expected {"owner": string, "repo": string, "pr": number}.' }, 400);
    const g = guard(c, env, limiter, deps);
    if (g instanceof Response) return g;
    const token = c.req.header('x-kitty-github-token')?.trim() || env.GITHUB_TOKEN;
    const github = createGitHubClient({ token, ...(deps.githubFetch ? { fetchImpl: deps.githubFetch } : {}) });
    try {
      return c.json(await draftPr({ github, provider: g.provider }, body.data.owner, body.data.repo, body.data.pr, c.req.raw.signal));
    } catch (e) {
      const err = toKittyError(e);
      return c.json({ code: err.code, message: err.message }, err.status as 400);
    }
  });
  return route;
}
