import { describe, expect, it } from 'vitest';
import type { PullFile } from '../src/github/client.js';
import { addedLines, diffChecks } from '../src/github/diff-checks.js';

const f = (filename: string, added: string[], status = 'modified'): PullFile => ({
  filename, status, additions: added.length, deletions: 0,
  patch: ['@@ -10,2 +10,' + (added.length + 1) + ' @@', ' context line', ...added.map((l) => `+${l}`)].join('\n'),
});
const byId = (files: PullFile[], id: string) => diffChecks(files, 'main', 'upstream').find((c) => c.id === id);

describe('addedLines', () => {
  it('numbers added lines in the new file', () => {
    expect(addedLines('@@ -1,3 +5,4 @@\n a\n-b\n+c\n d\n+e')).toEqual([{ line: 6, text: 'c' }, { line: 8, text: 'e' }]);
    expect(addedLines(undefined)).toEqual([]);
  });
});

describe('diff checks', () => {
  it('fails on real-looking secrets and committed .env files, but not placeholders', () => {
    const c = byId([f('src/config.js', ['const token = "ghp_' + 'a'.repeat(36) + '";'])], 'secrets');
    expect(c?.status).toBe('fail');
    expect(c?.detail).toContain('GitHub token at src/config.js:11');
    expect(byId([f('.env', ['DB_URL=postgres://x'], 'added')], 'secrets')?.commands).toContain('git rm --cached .env');
    expect(byId([f('src/config.js', ['api_key = "your-api-key-here-please"'])], 'secrets')).toBeUndefined();
    expect(byId([f('.env.example', ['DB_URL='], 'added')], 'secrets')).toBeUndefined();
  });

  it('fails on leftover conflict markers', () => {
    expect(byId([f('src/a.ts', ['<<<<<<< HEAD', 'x', '=======', 'y', '>>>>>>> main'])], 'conflict-markers')?.status).toBe('fail');
  });

  it('warns about debug statements in source, not in tests or scripts', () => {
    expect(byId([f('src/a.ts', ['console.log(user)'])], 'debug')?.detail).toContain('src/a.ts:11');
    expect(byId([f('src/a.py', ['breakpoint()'])], 'debug')).toBeDefined();
    expect(byId([f('test/a.test.ts', ['console.log(x)'])], 'debug')).toBeUndefined();
    expect(byId([f('scripts/build.js', ['console.log("done")'])], 'debug')).toBeUndefined();
  });

  it('warns when a lockfile changes without its manifest, with restore commands', () => {
    const c = byId([f('package-lock.json', ['"x": 1'])], 'lockfile');
    expect(c?.commands).toEqual(['git fetch upstream', 'git checkout upstream/main -- package-lock.json', 'git commit -m "Restore lockfile"']);
    expect(byId([f('package-lock.json', ['x']), f('package.json', ['y'])], 'lockfile')).toBeUndefined();
  });

  it('notes binary files and passes a clean diff', () => {
    expect(byId([{ filename: 'dist/app.bin', status: 'added', additions: 0, deletions: 0 }], 'large-files')?.status).toBe('info');
    expect(byId([f('src/a.ts', ['export const a = 1;'])], 'diff-clean')?.status).toBe('pass');
  });
});
