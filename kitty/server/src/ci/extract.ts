// Find the real error in a GitHub Actions log: strip timestamps and colours, skip the setup noise, and keep a
// short window around the first line that looks like the actual failure (not "Process completed with exit code").
import type { Annotation, WorkflowJob } from '../github/client.js';

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z ?/;
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

/** Strong signals: a tool says what broke. */
const STRONG = [
  /##\[error\](?!Process completed with exit code)/,
  /\b(error|ERROR)(\[\w+\])?:\s+\S/,
  /\bnpm ERR!|\bERR_PNPM_\w+|\berror TS\d+:|\bSyntaxError\b|\bTypeError\b|\bReferenceError\b|\bModuleNotFoundError\b|\bImportError\b/,
  /\bAssertionError\b|\bassert(ion)? failed\b|\bExpected\b.*\b(received|to (be|equal))\b/i,
  /^\s*(FAIL|FAILED|✗|×|✕)\s+\S|\b\d+ (failed|failing)\b|^--- FAIL:|^FAILED \S/,
  /^Traceback \(most recent call last\)|^\s*E\s{2,}\S/,
  /\bcannot find (module|symbol|package)\b|\bcould not (resolve|find)\b|\bno such file or directory\b/i,
  /\bpanicked at\b|^panic:|\bfatal error\b|\bfatal:\s/i,
];
const WEAK = /##\[error\]|\bexit code [1-9]\d*\b|\berror\b/i;
const NOISE = /^##\[(group|endgroup)\]|^\s*$|^(Run |shell: |env:)/;

export interface Failure {
  /** The few log lines around the error, cleaned. */
  excerpt: string;
  /** The single line that best names the error. */
  headline: string;
  /** "strong": a tool named the error; "weak": only an exit code / generic error; "tail": nothing found. */
  confidence: 'strong' | 'weak' | 'tail';
}

export const cleanLog = (log: string): string[] => log.replace(/\r/g, '').split('\n').map((l) => l.replace(TIMESTAMP, '').replace(ANSI, ''));

/** The log lines of one step (Actions logs mark steps with ##[group]Run …); the whole log if not found. */
export function stepLines(lines: string[], stepName?: string): string[] {
  if (!stepName) return lines;
  const starts = lines.flatMap((l, i) => (/^##\[group\]/.test(l) ? [i] : []));
  const want = stepName.toLowerCase().replace(/^run\s+/, '');
  for (let k = 0; k < starts.length; k++) {
    const i = starts[k] as number;
    if (lines[i]?.toLowerCase().includes(want)) return lines.slice(i, starts[k + 1] ?? lines.length);
  }
  return lines;
}

export function extractFailure(log: string, stepName?: string, maxChars = 3500): Failure {
  const all = cleanLog(log);
  const lines = stepLines(all, stepName);
  let at = lines.findIndex((l) => STRONG.some((re) => re.test(l)));
  let confidence: Failure['confidence'] = 'strong';
  if (at < 0) {
    at = lines.findIndex((l) => WEAK.test(l));
    confidence = 'weak';
  }
  if (at < 0) {
    const tail = lines.filter((l) => !NOISE.test(l)).slice(-40).join('\n');
    return { excerpt: tail.slice(-maxChars), headline: lines.filter((l) => l.trim()).at(-1)?.trim() ?? '', confidence: 'tail' };
  }
  const from = Math.max(0, at - 8);
  const window = lines.slice(from, at + 40).filter((l) => !/^##\[(group|endgroup)\]$/.test(l));
  let excerpt = window.join('\n');
  if (excerpt.length > maxChars) excerpt = `${excerpt.slice(0, maxChars)}\n[…]`;
  return { excerpt, headline: (lines[at] ?? '').replace(/^##\[error\]/, '').trim().slice(0, 300), confidence };
}

/** The job and step that failed first. */
export function failedJob(jobs: WorkflowJob[], jobId?: number): { job: WorkflowJob; step?: string } | null {
  const job = (jobId ? jobs.find((j) => j.id === jobId) : undefined) ?? jobs.find((j) => j.conclusion === 'failure') ?? jobs.find((j) => j.conclusion === 'cancelled' || j.conclusion === 'timed_out');
  if (!job) return null;
  const step = job.steps.find((s) => s.conclusion === 'failure')?.name;
  return step ? { job, step } : { job };
}

/** Only GitHub's generic "exit code" note, no real error: the full log (a token) is needed to say more. */
export const onlyExitCode = (annotations: Annotation[]): boolean =>
  !annotations.some((a) => a.annotation_level !== 'notice' && !/Process completed with exit code/.test(a.message));

/** Annotations as text, when there is no log (no token): failures first, generic exit-code notes after, notices dropped. */
export function annotationText(annotations: Annotation[]): string {
  const rank = (a: Annotation): number => (/Process completed with exit code/.test(a.message) ? 2 : a.annotation_level === 'failure' ? 0 : 1);
  return annotations
    .filter((a) => a.annotation_level !== 'notice') // runner notices ("ubuntu-latest will migrate…") are never the failure
    .sort((a, b) => rank(a) - rank(b))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 10)
    .map((a) => `${a.annotation_level.toUpperCase()}${a.path && a.path !== '.github' ? ` ${a.path}${a.start_line ? `:${a.start_line}` : ''}` : ''}: ${a.title ? `${a.title}: ` : ''}${a.message}`)
    .join('\n')
    .slice(0, 3500);
}
