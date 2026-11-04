// "Copy context for your AI": a short Markdown brief built from a finished tour (no model call), to paste into
// Copilot, Claude, Cursor or any assistant before asking it to change the code.
import { stepUrl } from './github-page';
import type { TourState } from './tour';

const oneLine = (s: string): string => s.replace(/\s+/g, ' ').trim();
const known = (s: string): boolean => Boolean(s.trim()) && !/^not stated in the repo\.?$/i.test(s.trim());

export function contextPack(state: TourState): string {
  const { tour, meta } = state.result;
  const repo = `${meta.owner}/${meta.repo}`;
  const out: string[] = [
    `# Project context: ${repo}`,
    '',
    `> Brief for an AI coding assistant, written by GitKitty from a guided tour of https://github.com/${repo} at commit \`${meta.sha.slice(0, 7)}\`.`,
    '> Read it before suggesting changes. Paths are relative to the repo root.',
    '',
    '## What this project is',
    oneLine(tour.summary) || `The ${repo} repository.`,
  ];
  if (tour.stack.length) out.push('', '## Stack', tour.stack.map((s) => `- ${s}`).join('\n'));
  if (meta.issue) out.push('', '## The task', `Fix issue #${meta.issue.number}: ${oneLine(meta.issue.title)} (${meta.issue.url})`, ...(known(tour.how_to_contribute) ? ['', tour.how_to_contribute.trim()] : []));
  out.push('', meta.issue ? '## Files involved (read in this order)' : '## Key files (read in this order)');
  state.steps.forEach((s, i) => {
    out.push(`${i + 1}. [\`${s.path}\`](${stepUrl(meta, meta.sha, s.path)}): ${oneLine(s.what)}${s.why_it_matters ? ` ${oneLine(s.why_it_matters)}` : ''}`);
  });
  if (known(tour.how_to_run)) out.push('', '## How to build, run and test', tour.how_to_run.trim());
  if (!meta.issue && known(tour.how_to_contribute)) out.push('', '## Contribution rules', tour.how_to_contribute.trim());
  if (tour.good_first_issue_tips.length) out.push('', meta.issue ? '## Pitfalls' : '## Tips', tour.good_first_issue_tips.map((t) => `- ${oneLine(t)}`).join('\n'));
  out.push(
    '',
    '## How to help me',
    '- Follow the conventions in the files above; keep changes small and focused.',
    '- Use only commands, scripts and files that exist in this repo. If something is unclear, ask instead of guessing.',
    '- Update or add tests next to the code you change.',
  );
  return `${out.join('\n')}\n`;
}

export const contextPackFilename = (state: TourState): string => `${state.owner}-${state.repo}${state.result.meta.issue ? `-issue-${state.result.meta.issue.number}` : ''}-context.md`.toLowerCase();
