// Post-answer check: flags used in git/gh commands that never appear in the retrieved sources.

const FENCE = /```[^\n]*\n([\s\S]*?)```/g;
const COMMAND_LINE = /^\s*(?:\$\s*)?(git|gh)\s/;
const FLAG = /(?<=\s)(--[a-z][a-z0-9-]*|-[a-zA-Z]{1,3})(?==|\s|$)/g;

/** Flags from git/gh command lines inside code blocks (comments stripped), deduplicated, in order. */
export function extractFlags(answer: string): string[] {
  const flags: string[] = [];
  for (const block of answer.matchAll(FENCE)) {
    for (const raw of (block[1] ?? '').split('\n')) {
      const line = raw.replace(/\s#.*$/, '');
      if (!COMMAND_LINE.test(line)) continue;
      for (const m of line.matchAll(FLAG)) if (m[1] && !flags.includes(m[1])) flags.push(m[1]);
    }
  }
  return flags;
}

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Flags not found anywhere in the source texts (as whole tokens). Warn-only: the UI shows them as unverified. */
export function unverifiedFlags(answer: string, sourceTexts: string[]): string[] {
  const corpus = sourceTexts.join('\n');
  return extractFlags(answer).filter((f) => !new RegExp(`(^|[\\s\`(\\[])${escape(f)}(?=$|[\\s=\`),.\\]])`, 'm').test(corpus));
}
