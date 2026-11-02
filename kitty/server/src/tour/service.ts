// Repo tour pipeline: GitHub -> rank -> context -> model (streamed) -> validate/repair -> cache.
import type { GitHubClient } from '../github/client.js';
import { buildTourContext } from '../github/context.js';
import { findDoc, issueHints, rankFiles, topLevelLayout } from '../github/rank.js';
import type { LruCache } from '../lib/lru.js';
import { KittyError } from '../llm/errors.js';
import type { ChatMessage, ChatResult, Provider } from '../llm/types.js';
import { validateTour } from './parse.js';
import { repairMessages, tourMessages, type TourMode } from './prompt.js';
import { ISSUE_MAX_STEPS, ISSUE_MIN_REQUESTED_STEPS, ISSUE_MIN_VALID_STEPS, MIN_REQUESTED_STEPS, MIN_VALID_STEPS, type TourResult } from './schema.js';

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
  /** Walk through the files relevant to this issue instead of a general tour. */
  issue?: number | undefined;
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
async function streamOnce(provider: Provider, messages: ChatMessage[], signal: AbortSignal | undefined, onFirst: () => void): Promise<ChatResult> {
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

/** One extra attempt when the provider drops the stream (seen live at ~60s); auth, quota and timeouts are not retried. */
async function streamToResult(provider: Provider, messages: ChatMessage[], signal: AbortSignal | undefined, onFirst: () => void, onRetry: () => void): Promise<ChatResult> {
  try {
    return await streamOnce(provider, messages, signal, onFirst);
  } catch (e) {
    if (!(e instanceof KittyError) || !['upstream_error', 'upstream_unavailable'].includes(e.code) || signal?.aborted) throw e;
    onRetry();
    return streamOnce(provider, messages, signal, onFirst);
  }
}

export async function getTour(deps: TourServiceDeps, req: TourRequest): Promise<TourResult> {
  const { github, provider, cache } = deps;
  const { owner, repo, signal } = req;
  const progress: OnProgress = req.onProgress ?? (() => {});
  const mode: TourMode = req.issue ? 'issue' : 'repo';
  const maxSteps = mode === 'issue' ? Math.min(deps.maxSteps, ISSUE_MAX_STEPS) : deps.maxSteps;

  progress('fetching', req.issue ? `Reading issue #${req.issue} and ${owner}/${repo}…` : `Fetching ${owner}/${repo} from GitHub…`);
  const info = await github.getRepo(owner, repo);
  const issue = req.issue ? await github.getIssue(owner, repo, req.issue) : undefined;
  if (issue?.pull_request !== undefined) throw new KittyError('bad_request', `#${issue.number} is a pull request, not an issue. Use "Check my PR" there instead.`);
  const sha = await github.getHeadSha(owner, repo, info.default_branch);
  const key = `${owner}/${repo}@${sha}${issue ? `#${issue.number}` : ''}`.toLowerCase();
  const hit = info.private ? undefined : cache.get(key); // never share private-repo tours between users
  if (hit) return { ...hit, meta: { ...hit.meta, cached: true } };

  const tree = await github.getTree(owner, repo, sha);
  progress('ranking', issue ? 'Finding the files this issue touches…' : tree.truncated ? 'Large repo: ranking key files from a partial file list…' : 'Picking the key files…');
  const ranked = rankFiles(tree.tree, 25, issue ? issueHints(issue.title, issue.body ?? '') : undefined);
  const readmePath = findDoc(tree.tree, 'readme');
  const contributingPath = findDoc(tree.tree, 'contributing');
  const [readme, contributing, ...bodies] = await mapLimit(
    [readmePath, contributingPath, ...ranked.map((f) => f.path)],
    6,
    async (p) => (p && !/.pdf$/i.test(p) ? github.getText(owner, repo, sha, p, p === readmePath ? 16_000 : 8_000) : null),
  );
  // documents (PDFs) have no readable text here but are still valid tour stops
  const files = ranked.flatMap((file, i) => {
    const body = bodies[i];
    if (body) return [{ file, text: body }];
    return file.reasons.includes('document') ? [{ file, text: '(binary document: contents not shown)' }] : [];
  });
  const unreadableFiles = ranked.length - files.length;
  const ctx = buildTourContext({
    owner, repo, info, sha,
    fileCount: tree.tree.filter((e) => e.type === 'blob').length,
    partial: tree.truncated,
    layout: topLevelLayout(tree.tree),
    readme: readmePath && readme ? { path: readmePath, text: readme } : undefined,
    contributing: contributingPath && contributing ? { path: contributingPath, text: contributing } : undefined,
    files,
    issue: issue ? { number: issue.number, title: issue.title, body: issue.body ?? '', labels: issue.labels } : undefined,
  });

  progress('thinking', 'Kitty is thinking…');
  const repoPaths = new Set(tree.tree.map((e) => e.path));
  const onFirst = (): void => progress('writing', 'Kitty is writing the tour…');
  const onRetry = (): void => progress('thinking', 'The model connection dropped; retrying once…');
  // small repos may not have enough candidate files for the usual minimums
  const minValid = Math.min(mode === 'issue' ? ISSUE_MIN_VALID_STEPS : MIN_VALID_STEPS, ctx.includedPaths.length);
  const minSteps = Math.min(mode === 'issue' ? ISSUE_MIN_REQUESTED_STEPS : MIN_REQUESTED_STEPS, ctx.includedPaths.length);
  if (minValid === 0) throw new KittyError('invalid_model_output', 'This repository has no readable files to build a tour from.');
  let result = await streamToResult(provider, tourMessages(ctx.text, ctx.nonce, maxSteps, minSteps, mode), signal, onFirst, onRetry);
  let usage = result.usage;
  let checked = validateTour(result.text, repoPaths, maxSteps, minValid);
  let repaired = false;
  if (!checked.ok) {
    progress('repairing', 'Tidying up the tour…');
    repaired = true;
    result = await streamToResult(provider, repairMessages(result.text, checked.error, ctx.includedPaths, ctx.nonce, maxSteps, minSteps, mode), signal, () => {}, onRetry);
    usage = usage && result.usage
      ? { promptTokens: usage.promptTokens + result.usage.promptTokens, completionTokens: usage.completionTokens + result.usage.completionTokens, totalTokens: usage.totalTokens + result.usage.totalTokens }
      : usage ?? result.usage;
    checked = validateTour(result.text, repoPaths, maxSteps, minValid);
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
      unreadableFiles,
      defaultBranch: info.default_branch,
      ...(issue ? { issue: { number: issue.number, title: issue.title, url: issue.html_url, labels: issue.labels } } : {}),
    },
  };
  if (!info.private) cache.set(key, out);
  return out;
}
