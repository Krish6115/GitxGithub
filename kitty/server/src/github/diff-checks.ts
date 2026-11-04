// PR check rules that read the diff itself (added lines only): leaked secrets, leftover conflict markers, debug
// statements, committed .env files, lockfiles changed without their manifest. Plain rules, no model.
import type { PullFile } from './client.js';
import type { PreflightCheck } from './preflight.js';

export interface AddedLine {
  line: number;
  text: string;
}

/** Added lines of a unified diff, with their line numbers in the new file. */
export function addedLines(patch: string | undefined): AddedLine[] {
  if (!patch) return [];
  const out: AddedLine[] = [];
  let n = 0;
  for (const raw of patch.split('\n')) {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      n = Number(hunk[1]);
      continue;
    }
    if (raw.startsWith('+') && !raw.startsWith('+++')) out.push({ line: n++, text: raw.slice(1) });
    else if (!raw.startsWith('-')) n++;
  }
  return out;
}

const SECRETS: [RegExp, string][] = [
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{50,}\b/, 'GitHub token'],
  [/\bsk-(proj-)?[A-Za-z0-9_-]{32,}\b/, 'API secret key'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}\b/, 'Slack token'],
  [/-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, 'private key'],
  [/\b(api[_-]?key|secret|password|passwd|access[_-]?token|auth[_-]?token)\b["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i, 'hard-coded secret'],
];
const PLACEHOLDER = /\b(example|placeholder|your[_-]|xxx|changeme|dummy|test|fake|sample|<[^>]+>|\$\{)/i;

const DEBUG: [RegExp, RegExp][] = [
  [/\.(js|jsx|ts|tsx|mjs|cjs|vue|svelte)$/i, /\bconsole\.(log|debug)\(|^\s*debugger;?\s*$/],
  [/\.py$/i, /\bbreakpoint\(\)|\bpdb\.set_trace\(\)|\bipdb\.set_trace\(\)/],
  [/\.rb$/i, /\bbinding\.(pry|irb)\b|\bbyebug\b/],
  [/\.php$/i, /\b(var_dump|dd|dump)\(/],
  [/\.(java|kt)$/i, /\bSystem\.out\.println\(|\.printStackTrace\(\)/],
];
const CONFLICT = /^(<{7}|>{7})( |$)|^={7}$/;
const TEST_OR_SCRIPT = /(^|\/)(tests?|__tests__|spec|scripts?|examples?|e2e|bin)\/|[._-](test|spec)\.[a-z]+$/i;
const LOCKS: Record<string, string> = { 'package-lock.json': 'package.json', 'yarn.lock': 'package.json', 'pnpm-lock.yaml': 'package.json', 'poetry.lock': 'pyproject.toml', 'cargo.lock': 'Cargo.toml', 'go.sum': 'go.mod', 'gemfile.lock': 'Gemfile' };

const where = (hits: { file: string; line: number }[]): string => hits.slice(0, 4).map((h) => `${h.file}:${h.line}`).join(', ') + (hits.length > 4 ? ` and ${hits.length - 4} more` : '');
const base = (p: string): string => p.split('/').at(-1) ?? p;

export function diffChecks(files: PullFile[], baseRef = 'main', remote = 'origin'): PreflightCheck[] {
  const checks: PreflightCheck[] = [];
  const secrets: { file: string; line: number; kind: string }[] = [];
  const markers: { file: string; line: number }[] = [];
  const debug: { file: string; line: number }[] = [];
  for (const f of files) {
    const added = addedLines(f.patch);
    for (const { line, text } of added) {
      const s = SECRETS.find(([re]) => re.test(text));
      if (s && !PLACEHOLDER.test(text)) secrets.push({ file: f.filename, line, kind: s[1] });
      if (CONFLICT.test(text)) markers.push({ file: f.filename, line });
    }
    const rule = DEBUG.find(([ext]) => ext.test(f.filename));
    if (rule && !TEST_OR_SCRIPT.test(f.filename)) for (const { line, text } of added) if (rule[1].test(text)) debug.push({ file: f.filename, line });
  }
  const envFiles = files.filter((f) => f.status !== 'removed' && /(^|\/)\.env(\.[\w-]+)?$/.test(f.filename) && !/\.(example|sample|template|dist)$/.test(f.filename));

  if (secrets.length || envFiles.length) {
    const kinds = [...new Set(secrets.map((s) => s.kind))].join(', ');
    checks.push({
      id: 'secrets',
      status: 'fail',
      title: 'Possible secret in the diff',
      detail: `${secrets.length ? `Looks like a ${kinds} at ${where(secrets)}. ` : ''}${envFiles.length ? `${envFiles.map((f) => f.filename).join(', ')} is committed. ` : ''}Anything pushed to GitHub is public: revoke or rotate the key now, then remove it from the branch (it stays in old commits until they are rewritten).`,
      commands: [
        ...envFiles.map((f) => `git rm --cached ${f.filename}`),
        ...(envFiles.length ? [`echo "${base(envFiles[0]?.filename ?? '.env')}" >> .gitignore`] : []),
        '# remove the secret from the code, read it from an environment variable instead, then:',
        'git commit -am "Remove secret"',
        'git push',
      ],
    });
  }
  if (markers.length) {
    checks.push({ id: 'conflict-markers', status: 'fail', title: 'Conflict markers left in the code', detail: `Lines starting with <<<<<<<, ======= or >>>>>>> at ${where(markers)}. Finish resolving those files: keep the right code and delete the markers.` });
  }
  if (debug.length) {
    checks.push({ id: 'debug', status: 'warn', title: 'Debug statements added', detail: `Leftover debug output at ${where(debug)}. Remove it unless the project logs this way on purpose.` });
  }
  const names = new Set(files.map((f) => base(f.filename).toLowerCase()));
  const lockOnly = files.filter((f) => LOCKS[base(f.filename).toLowerCase()] && !names.has((LOCKS[base(f.filename).toLowerCase()] ?? '').toLowerCase()));
  if (lockOnly.length) {
    checks.push({ id: 'lockfile', status: 'warn', title: 'Lockfile changed on its own', detail: `${lockOnly.map((f) => f.filename).join(', ')} changed but its manifest did not. That is usually an accident from a different tool version; undo it unless you meant to update dependencies.`, commands: [`git fetch ${remote}`, ...lockOnly.map((f) => `git checkout ${remote}/${baseRef} -- ${f.filename}`), `git commit -m "Restore lockfile"`] });
  }
  const binaries = files.filter((f) => f.status === 'added' && !f.patch && !/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(f.filename));
  if (binaries.length) {
    checks.push({ id: 'large-files', status: 'info', title: 'Binary or very large files added', detail: `${binaries.slice(0, 4).map((f) => f.filename).join(', ')} ha${binaries.length > 1 ? 've' : 's'} no viewable diff. Make sure build output and large files are not committed by mistake.` });
  }
  if (files.length && !secrets.length && !markers.length && !envFiles.length) {
    checks.push({ id: 'diff-clean', status: 'pass', title: 'No secrets or conflict markers in the diff', detail: 'Kitty scanned the added lines.' });
  }
  return checks;
}
