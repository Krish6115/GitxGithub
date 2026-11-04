import { describe, expect, it } from 'vitest';
import { diagnose, GIT_ERRORS } from '../src/tutor/git-errors.js';
import { streamTutor, type TutorEvent } from '../src/tutor/service.js';
import { collect, scripted } from './fixtures/provider.js';

const id = (text: string): string | undefined => diagnose(text)?.rule.id;

describe('explain my mistake', () => {
  it('recognises real Git output', () => {
    expect(id(` ! [rejected]        main -> main (fetch first)\nerror: failed to push some refs to 'github.com:me/app.git'`)).toBe('rejected-behind');
    expect(id(`To github.com:me/app.git\n ! [rejected]        main -> main (non-fast-forward)`)).toBe('rejected-behind');
    expect(id('Auto-merging src/app.js\nCONFLICT (content): Merge conflict in src/app.js\nAutomatic merge failed; fix conflicts and then commit the result.')).toBe('conflict');
    expect(id('fatal: not a git repository (or any of the parent directories): .git')).toBe('not-a-repo');
    expect(id('fatal: The current branch feature/login has no upstream branch.')).toBe('no-upstream');
    expect(id("error: src refspec main does not match any\nerror: failed to push some refs to 'origin'")).toBe('src-refspec');
    expect(id('git@github.com: Permission denied (publickey).\nfatal: Could not read from remote repository.')).toBe('publickey');
    expect(id("remote: Support for password authentication was removed on August 13, 2021.\nfatal: Authentication failed for 'https://github.com/me/app.git/'")).toBe('auth-failed');
    expect(id('remote: error: GH013: Repository rule violations found for refs/heads/main.\nremote: - Push cannot contain secrets')).toBe('secret-push');
    expect(id('error: Your local changes to the following files would be overwritten by checkout:\n\tsrc/app.js')).toBe('local-changes-overwritten');
    expect(id('hint: You have divergent branches and need to specify how to reconcile them.')).toBe('divergent');
    expect(id('fatal: refusing to merge unrelated histories')).toBe('unrelated-histories');
    expect(id("You are in 'detached HEAD' state. You can look around, make experimental changes")).toBe('detached-head');
    expect(id("error: The branch 'old-ui' is not fully merged.")).toBe('not-fully-merged');
  });

  it('fills the real names into the commands', () => {
    const d = diagnose('fatal: The current branch feature/login has no upstream branch.');
    expect(d?.answer).toContain('git push -u origin feature/login');
    const c = diagnose('CONFLICT (content): Merge conflict in src/app.js');
    expect(c?.answer).toContain('git add src/app.js');
    expect(diagnose("error: The branch 'old-ui' is not fully merged.")?.answer).toContain('(Can lose work)');
  });

  it('leaves questions in words to the tutor', () => {
    expect(diagnose('what is a detached HEAD?')).toBeNull();
    expect(diagnose('How do I undo my last commit?')).toBeNull();
  });

  it('has distinct ids and fix commands for every rule', () => {
    expect(new Set(GIT_ERRORS.map((r) => r.id)).size).toBe(GIT_ERRORS.length);
    for (const r of GIT_ERRORS) expect(r.fix.length).toBeGreaterThan(0);
  });

  it('answers pasted errors instantly in the tutor, without the model', async () => {
    const provider = scripted('should not be called');
    const evs = await collect<TutorEvent>(streamTutor({ provider, retrieve: () => [] }, { question: 'fatal: not a git repository (or any of the parent directories): .git', history: [] }));
    expect(provider.reqs).toHaveLength(0);
    expect((evs[1] as { text: string }).text).toContain('### You are not inside a Git repository');
    expect(evs.at(-1)).toMatchObject({ type: 'done', instant: true, diagnosis: 'not-a-repo' });
  });
});
