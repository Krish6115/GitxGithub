// Contributor helpers that need GitHub but no model (so no tokens): POST /issues (good first issues) and
// POST /preflight (PR pre-flight check). They share the per-IP budget with the model routes.
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import type { Env } from '../env.js';
import { createGitHubClient } from '../github/client.js';
import { rankBeginnerIssues, type BeginnerIssues } from '../github/issues.js';
import { runPreflight } from '../github/preflight.js';
import { LruCache } from '../lib/lru.js';
import { clientIp, type RateLimiter } from '../lib/rate-limit.js';
import { toKittyError } from '../llm/errors.js';
import type { RouteDeps } from './common.js';

const name = z.string().regex(/^[A-Za-z0-9_.-]{1,100}$/);
const IssuesRequest = z.object({ owner: name, repo: name });
const PreflightRequest = z.object({ owner: name, repo: name, pr: z.number().int().positive().max(100_000_000) });

export function contributeRoute(env: Env, limiter: RateLimiter, deps: RouteDeps = {}): Hono {
  const route = new Hono();
  const issueCache = new LruCache<BeginnerIssues>(200, 10 * 60_000);

  const setup = (c: Context): ReturnType<typeof createGitHubClient> | Response => {
    const rl = limiter.take(clientIp(c.req.raw.headers));
    if (!rl.ok) {
      c.header('Retry-After', String(rl.retryAfterSec));
      return c.json({ code: 'rate_limited', message: `Too many requests. Try again in ${rl.retryAfterSec}s.` }, 429);
    }
    const token = c.req.header('x-kitty-github-token')?.trim() || env.GITHUB_TOKEN;
    return createGitHubClient({ token, ...(deps.githubFetch ? { fetchImpl: deps.githubFetch } : {}) });
  };
  const fail = (c: Context, e: unknown): Response => {
    const err = toKittyError(e);
    return c.json({ code: err.code, message: err.message }, err.status as 400);
  };

  route.post('/issues', async (c) => {
    const body = IssuesRequest.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ code: 'bad_request', message: 'Expected {"owner": string, "repo": string}.' }, 400);
    const key = `${body.data.owner}/${body.data.repo}`.toLowerCase();
    const hit = issueCache.get(key);
    if (hit) return c.json(hit);
    const github = setup(c);
    if (github instanceof Response) return github;
    try {
      const result = rankBeginnerIssues(await github.listOpenIssues(body.data.owner, body.data.repo));
      issueCache.set(key, result);
      return c.json(result);
    } catch (e) {
      return fail(c, e);
    }
  });

  route.post('/preflight', async (c) => {
    const body = PreflightRequest.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ code: 'bad_request', message: 'Expected {"owner": string, "repo": string, "pr": number}.' }, 400);
    const github = setup(c);
    if (github instanceof Response) return github;
    try {
      return c.json(await runPreflight(github, body.data.owner, body.data.repo, body.data.pr));
    } catch (e) {
      return fail(c, e);
    }
  });
  return route;
}
