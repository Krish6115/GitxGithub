// POST /tutor: SSE stream of `sources`, then answer `delta`s, then `done` (or `error`).
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Env } from '../env.js';
import type { RateLimiter } from '../lib/rate-limit.js';
import { retrieve as defaultRetrieve, type RetrievedChunk } from '../rag/retrieve.js';
import { TutorRequestSchema } from '../tutor/history.js';
import { getFaqMatcher, type FaqMatcher } from '../tutor/faq.js';
import { streamTutor } from '../tutor/service.js';
import { guard, sendEvent, withPings, type RouteDeps } from './common.js';
import { createGitHubClient } from '../github/client.js';
import { findRepoFiles } from '../github/repo-files.js';

export interface TutorRouteDeps extends RouteDeps {
  retrieve?: (query: string, k: number) => RetrievedChunk[];
  /** Saved instant answers (defaults to data/faq.json; tests pass their own or none). */
  faq?: FaqMatcher | null;
}

export function tutorRoute(env: Env, limiter: RateLimiter, deps: TutorRouteDeps = {}): Hono {
  const route = new Hono();
  route.post('/tutor', async (c) => {
    const body = TutorRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ code: 'bad_request', message: 'Expected {"question": string (1-2000 chars), "history"?: [...]}.' }, 400);
    const g = guard(c, env, limiter, deps);
    if (g instanceof Response) return g;
    const retrieve = deps.retrieve ?? ((q: string, k: number) => defaultRetrieve(q, k));
    const faq = deps.faq === undefined ? getFaqMatcher() : deps.faq;
    const githubToken = c.req.header('x-kitty-github-token')?.trim() || env.GITHUB_TOKEN;
    const github = createGitHubClient({ token: githubToken, ...(deps.githubFetch ? { fetchImpl: deps.githubFetch } : {}) });
    const repoFiles = (owner: string, repo: string, q: string) => findRepoFiles(github, owner, repo, q, { canSearchCode: Boolean(githubToken) });

    return streamSSE(c, (stream) =>
      withPings(stream, deps.keepAliveMs ?? 10_000, async () => {
        for await (const ev of streamTutor({ provider: g.provider, retrieve, repoFiles, ...(faq ? { faq } : {}) }, body.data, c.req.raw.signal)) {
          if (ev.type === 'delta') await sendEvent(stream, 'delta', { text: ev.text });
          else await sendEvent(stream, ev.type, ev);
        }
      }),
    );
  });
  return route;
}
