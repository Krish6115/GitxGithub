// Repo tour pipeline: GitHub -> rank -> context -> model (streamed) -> validate/repair -> cache.
import type { GitHubClient } from '../github/client.js';
import { buildTourContext } from '../github/context.js';
import { findDoc, rankFiles, topLevelLayout } from '../github/rank.js';
import type { LruCache } from '../lib/lru.js';
import { KittyError } from '../llm/errors.js';
import type { ChatMessage, ChatResult, Provider } from '../llm/types.js';
import { validateTour } from './parse.js';
import { repairMessages, tourMessages } from './prompt.js';
import type { TourResult } from './schema.js';

export type TourStage = 'fetching' | 'ranking' | 'thinking' | 'writing' | 'repairing';
export type OnProgress = (stage: TourStage, message: string) => void;

export interface TourServiceDeps {
  github: GitHubClient;
  provider: Provider;
  cache: LruCache<TourResult>;
  maxSteps: number;
}

export interface TourRequest {
  owner: string;
  repo: string;
  signal?: AbortSignal;
  onProgress?: OnProgress;
}

/** Run async tasks with limited concurrency, keeping input order. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Tours always stream so first-token / idle timeouts apply; the first content chunk switches the UI to "writing". */
async function streamToResult(provider: Provider, messages: ChatMessage[], signal: AbortSignal | undefined, onFirst: () => void): Promise<ChatResult> {
  let first = true;
  for await (const ev of provider.stream({ kind: 'tour', messages, ...(signal ? { signal } : {}) })) {
    if (ev.type === 'delta' && first) {
      first = false;
      onFirst();
    }
    if (ev.type === 'done') return ev.result;
  }
  throw new KittyError('upstream_error', 'The model stream ended without a result.');
}

export async function getTour(deps: TourServiceDeps, req: TourRequest): Promise<TourResult> {
  const { github, provider, cache, maxSteps } = deps;
  const { owner, repo, signal } = req;
  const progress: OnProgress = req.onProgress ?? (() => {});

  progress('fetching', `Fetching ${owner}/${repo} from GitHub…`);
  const info = await github.getRepo(owner, repo);
  const sha = await github.getHeadSha(owner, repo, info.default_branch);
  const key = `${owner}/${repo}@${sha}`.toLowerCase();
  const hit = info.private ? undefined : cache.get(key); // never share private-repo tours between users
  if (hit) return { ...hit, meta: { ...hit.meta, cached: true } };

  const tree = await github.getTree(owner, repo, sha);
  progress('ranking', tree.truncated ? 'Large repo: ranking key files from a partial file list…' : 'Picking the key files…');
  const ranked = rankFiles(tree.tree, 25);
  const readmePath = findDoc(tree.tree, 'readme');
  const contributingPath = findDoc(tree.tree, 'contributing');
  const [readme, contributing, ...bodies] = await mapLimit(
    [readmePath, contributingPath, ...ranked.map((f) => f.path)],
    6,
    async (p) => (p ? github.getText(owner, repo, sha, p, p === readmePath ? 16_000 : 8_000) : null),
  );
  const files = ranked.flatMap((file, i) => (bodies[i] ? [{ file, text: bodies[i] as string }] : []));
  const ctx = buildTourContext({
    owner, repo, info, sha,
    fileCount: tree.tree.filter((e) => e.type === 'blob').length,
    partial: tree.truncated,
    layout: topLevelLayout(tree.tree),
    readme: readmePath && readme ? { path: readmePath, text: readme } : undefined,
    contributing: contributingPath && contributing ? { path: contributingPath, text: contributing } : undefined,
    files,
  });

  progress('thinking', 'Kitty is thinking…');
  const repoPaths = new Set(tree.tree.map((e) => e.path));
  const onFirst = (): void => progress('writing', 'Kitty is writing the tour…');
  let result = await streamToResult(provider, tourMessages(ctx.text, ctx.nonce, maxSteps), signal, onFirst);
  let usage = result.usage;
  let checked = validateTour(result.text, repoPaths, maxSteps);
  let repaired = false;
  if (!checked.ok) {
    progress('repairing', 'Tidying up the tour…');
    repaired = true;
    result = await streamToResult(provider, repairMessages(result.text, checked.error, ctx.includedPaths, ctx.nonce, maxSteps), signal, () => {});
    usage = usage && result.usage
      ? { promptTokens: usage.promptTokens + result.usage.promptTokens, completionTokens: usage.completionTokens + result.usage.completionTokens, totalTokens: usage.totalTokens + result.usage.totalTokens }
      : usage ?? result.usage;
    checked = validateTour(result.text, repoPaths, maxSteps);
  }
  if (!checked.ok) throw new KittyError('invalid_model_output', `Kitty could not build a valid tour: ${checked.error}`);

  const out: TourResult = {
    tour: checked.tour,
    meta: {
      owner, repo, sha,
      partial: tree.truncated,
      cached: false,
      provider: provider.name,
      repaired,
      droppedSteps: checked.dropped,
      usage,
      contextTokens: ctx.approxTokens,
    },
  };
  if (!info.private) cache.set(key, out);
  return out;
}
