// Builds the tour prompt context. Every piece of repo-controlled text goes inside a delimited UNTRUSTED block.
import { randomBytes } from 'node:crypto';
import type { RepoInfo } from './client.js';
import type { RankedFile } from './rank.js';

export const CONTEXT_BUDGET_TOKENS = 40_000;
const estimateTokens = (s: string): number => Math.ceil(s.length / 4);

export interface TourContextInput {
  owner: string;
  repo: string;
  info: RepoInfo;
  sha: string;
  fileCount: number;
  partial: boolean;
  layout: string[];
  readme?: { path: string; text: string } | undefined;
  contributing?: { path: string; text: string } | undefined;
  files: { file: RankedFile; text: string }[];
  /** "Help me fix this issue": the issue the developer wants to fix. */
  issue?: { number: number; title: string; body: string; labels: string[] } | undefined;
}

export interface TourContext {
  text: string;
  approxTokens: number;
  includedPaths: string[];
  /** Marker id used for this request's untrusted blocks. */
  nonce: string;
}

/** Neutralise anything in repo text that could imitate our block markers. */
const defang = (s: string): string => s.replace(/<<</g, '‹‹‹').replace(/>>>/g, '›››');

export function untrusted(label: string, body: string, nonce: string): string {
  return `<<<UNTRUSTED_REPO_CONTENT ${nonce} ${label}>>>\n${defang(body)}\n<<<END_UNTRUSTED_REPO_CONTENT ${nonce}>>>`;
}

/** First `maxLines` lines, at most `maxChars` characters. */
export function excerpt(text: string, maxLines = 120, maxChars = 4000): string {
  const lines = text.split('\n');
  let out = lines.slice(0, maxLines).join('\n');
  if (out.length > maxChars) out = out.slice(0, maxChars);
  return out.length < text.length ? `${out}\n[…excerpt]` : out;
}

export function buildTourContext(input: TourContextInput, budgetTokens = CONTEXT_BUDGET_TOKENS, nonce = randomBytes(6).toString('hex')): TourContext {
  const meta = [
    `Repository: ${input.owner}/${input.repo}`,
    `Default branch commit: ${input.sha.slice(0, 7)}`,
    `Primary language: ${input.info.language ?? 'unknown'} | Stars: ${input.info.stargazers_count} | Files: ${input.fileCount}${input.partial ? ' (file list truncated by GitHub: large repo, partial view)' : ''}`,
  ];
  const parts: string[] = [meta.join('\n')];
  if (input.issue) {
    const i = input.issue;
    const labels = i.labels.length ? `\nLabels: ${i.labels.join(', ')}` : '';
    const body = `Title: ${i.title}${labels}\n\n${excerpt(i.body || '(no description)', 120, 6000)}`;
    parts.push(`## The issue to fix (#${i.number})\n${untrusted(`issue-${i.number}`, body, nonce)}`);
  }
  if (input.info.description) parts.push(`## Description\n${untrusted('description', input.info.description, nonce)}`);
  parts.push(`## Top-level layout\n${untrusted('layout', input.layout.join('\n'), nonce)}`);
  if (input.readme) parts.push(`## README (${input.readme.path}, excerpt)\n${untrusted(input.readme.path, excerpt(input.readme.text, 300, 12_000), nonce)}`);
  if (input.contributing) {
    parts.push(`## CONTRIBUTING (${input.contributing.path}, excerpt)\n${untrusted(input.contributing.path, excerpt(input.contributing.text, 200, 6000), nonce)}`);
  }
  parts.push('## Key files (ranked by heuristics; only these paths may be used as tour steps)');

  const includedPaths: string[] = [];
  let used = estimateTokens(parts.join('\n\n'));
  for (const { file, text } of input.files) {
    const block = `### File: ${file.path}  (why picked: ${file.reasons.join(', ')})\n${untrusted(file.path, excerpt(text), nonce)}`;
    const cost = estimateTokens(block);
    if (used + cost > budgetTokens) break;
    parts.push(block);
    includedPaths.push(file.path);
    used += cost;
  }
  const text = parts.join('\n\n');
  return { text, approxTokens: estimateTokens(text), includedPaths, nonce };
}
