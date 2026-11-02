// Rule-based selection type and command risk (deterministic, no model call).

export type SelectionKind = 'command' | 'diff' | 'prose' | 'code';
export type CommandRisk = 'safe' | 'rewrites_history' | 'can_lose_work';

const CMD = /^\s*(?:\$\s*)?(git|gh)\s+\S/;

export function classifySelection(text: string): SelectionKind {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return 'prose';
  const cmdLines = lines.filter((l) => CMD.test(l) || /^\s*#/.test(l)).length;
  if (CMD.test(lines[0] ?? '') && lines.length <= 12 && cmdLines / lines.length >= 0.6) return 'command';
  const diffLines = lines.filter((l) => /^(@@ |[+-](?!--|\+\+)|diff --git |index [0-9a-f]+)/.test(l)).length;
  if (/^@@ .* @@/m.test(text) || (lines.length >= 2 && diffLines / lines.length >= 0.5)) return 'diff';
  const symbols = (text.match(/[{};=<>()[\]]/g) ?? []).length / Math.max(1, text.length);
  const keywords = /\b(function|const|let|var|import|export|return|def|class|public|private|func|fn|package|#include|=>)\b/.test(text);
  if ((keywords && symbols > 0.02) || symbols > 0.06) return 'code';
  return 'prose';
}

const LOSE_WORK = [
  /\breset\b.*--hard\b/,
  /\bclean\b.*\s-[a-z]*f/,
  /\bcheckout\b.*\s--\s+\S/,
  /\bcheckout\b\s+\.\s*$/,
  /\brestore\b(?!.*--staged)(?!.*\s-S\b)\s+\S/,
  /\bbranch\b.*\s-D\b/,
  /\bstash\s+(drop|clear)\b/,
  /\bpush\b.*\s(--delete|-d)\b/,
  /\bpush\b.*\s:\S/,
  /\bworktree\s+remove\b.*\s(-f|--force)\b/,
];
const REWRITES = [
  /\bpush\b.*\s(--force(-with-lease)?|-f)\b/,
  /\brebase\b/,
  /\bcommit\b.*--amend\b/,
  /\bfilter-(repo|branch)\b/,
  /\breset\b/,
  /\breplace\b/,
];

/** Highest risk across the command lines (comments ignored). */
export function commandRisk(text: string): CommandRisk {
  const cmds = text
    .split('\n')
    .map((l) => l.replace(/\s#.*$/, ''))
    .filter((l) => CMD.test(l));
  if (cmds.some((c) => LOSE_WORK.some((re) => re.test(c)))) return 'can_lose_work';
  if (cmds.some((c) => REWRITES.some((re) => re.test(c)))) return 'rewrites_history';
  return 'safe';
}

export const RISK_LABEL: Record<CommandRisk, string> = {
  safe: 'Safe: does not change history or discard work',
  rewrites_history: 'Rewrites history: changes commit IDs; be careful on shared branches',
  can_lose_work: 'Can lose work: may discard changes that are hard or impossible to recover',
};
