// Practice mode commands: a safe subset of Git, run against the tiny model in git-sim.ts.
// Each command returns the new state, what Git would print, and a risk label like Kitty's "Explain this".
import { addCommit, ancestors, clone, headBranch, headId, isAncestor, moveHead, resolve, type SimState } from './git-sim';

export type Risk = 'safe' | 'rewrites_history' | 'can_lose_work';
export interface RunResult {
  state: SimState;
  output: string;
  error?: boolean;
  risk?: Risk;
}

export const PRACTICE_HELP = [
  'edit                        make a change to a file (so there is something to commit)',
  'git status | git log | git reflog',
  'git add .   git commit -m "msg"   git commit --amend',
  'git branch <name>   git branch -d <name>   git switch <name>   git switch -c <name>   git checkout <ref>',
  'git merge <branch>   git rebase <branch>   git cherry-pick <ref>   git revert <ref>',
  'git reset --soft|--mixed|--hard <ref>     refs: HEAD~1, HEAD@{2}, main, origin/main, c3',
  'git stash   git stash pop   git push [--force | --force-with-lease]   git pull [--rebase]   git fetch',
].join('\n');

const fail = (state: SimState, output: string): RunResult => ({ state, output, error: true });

/** Split a command line, keeping "quoted strings" together. */
export function tokenize(line: string): string[] {
  return [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
}

function commit(s: SimState, msg: string, amend: boolean): RunResult {
  const head = headId(s);
  if (amend) {
    if (!head) return fail(s, 'fatal: nothing to amend yet.');
    const old = s.commits[head];
    const id = addCommit(s, msg || old?.msg || 'amended', old?.parents ?? []);
    s.staged = 0;
    moveHead(s, id, `commit (amend): ${s.commits[id]?.msg}`);
    return { state: s, output: `[${headBranch(s) ?? 'detached HEAD'} ${id}] ${s.commits[id]?.msg}\n(the old commit ${head} is replaced; it is still in the reflog)`, risk: 'rewrites_history' };
  }
  if (s.staged === 0) return fail(s, s.working ? 'nothing added to commit but untracked/changed files present (use "git add .")' : 'nothing to commit, working tree clean (try "edit" first)');
  const id = addCommit(s, msg || 'update', head ? [head] : []);
  s.staged = 0;
  moveHead(s, id, `commit: ${s.commits[id]?.msg}`);
  return { state: s, output: `[${headBranch(s) ?? 'detached HEAD'} ${id}] ${s.commits[id]?.msg}`, risk: 'safe' };
}

/** Replay the commits of `from` that `onto` lacks on top of `onto` (new ids, old ones stay in the reflog). */
function replay(s: SimState, onto: string, from: string, label: string): string[] {
  const have = ancestors(s, onto);
  const mine = s.order.filter((c) => ancestors(s, from).has(c) && !have.has(c) && (s.commits[c]?.parents.length ?? 0) <= 1);
  let tip = onto;
  const made: string[] = [];
  for (const c of mine) {
    tip = addCommit(s, s.commits[c]?.msg ?? c, [tip]);
    made.push(tip);
  }
  moveHead(s, tip, label);
  return made;
}

function merge(s: SimState, ref: string, label = `merge ${ref}`): RunResult {
  const head = headId(s);
  const other = resolve(s, ref);
  if (!head || !other) return fail(s, `merge: ${ref} - not something we can merge`);
  if (isAncestor(s, other, head)) return { state: s, output: 'Already up to date.', risk: 'safe' };
  if (isAncestor(s, head, other)) {
    moveHead(s, other, `${label}: Fast-forward`);
    return { state: s, output: `Updating ${head}..${other}\nFast-forward`, risk: 'safe' };
  }
  const id = addCommit(s, `Merge ${ref} into ${headBranch(s) ?? 'HEAD'}`, [head, other]);
  moveHead(s, id, `${label}: Merge made by the 'ort' strategy.`);
  return { state: s, output: `Merge made by the 'ort' strategy. (new merge commit ${id})`, risk: 'safe' };
}

function rebase(s: SimState, ref: string): RunResult {
  const head = headId(s);
  const onto = resolve(s, ref);
  if (!head || !onto) return fail(s, `fatal: invalid upstream '${ref}'`);
  if (isAncestor(s, onto, head)) return { state: s, output: `Current branch ${headBranch(s) ?? 'HEAD'} is up to date.`, risk: 'safe' };
  const made = replay(s, onto, head, `rebase (finish): onto ${ref}`);
  return { state: s, output: `Successfully rebased ${made.length} commit(s) onto ${ref}.\nYour old commits got new ids (${made.join(', ')}); the originals are only in the reflog now.`, risk: 'rewrites_history' };
}

function reset(s: SimState, mode: string, ref: string): RunResult {
  const head = headId(s);
  const to = resolve(s, ref);
  if (!head || !to) return fail(s, `fatal: ambiguous argument '${ref}': unknown revision`);
  const undone = [...ancestors(s, head)].filter((c) => !ancestors(s, to).has(c)).length;
  moveHead(s, to, `reset: moving to ${ref}`);
  if (mode === '--hard') {
    const lost = s.working + s.staged;
    s.working = 0;
    s.staged = 0;
    return { state: s, output: `HEAD is now at ${to} ${s.commits[to]?.msg}${lost ? `\n(${lost} uncommitted change(s) discarded for good)` : ''}${undone ? `\n${undone} commit(s) left behind: find them with git reflog` : ''}`, risk: 'can_lose_work' };
  }
  if (mode === '--soft') s.staged += undone;
  else s.working += undone;
  return { state: s, output: `HEAD is now at ${to}. The undone commits' changes are ${mode === '--soft' ? 'staged' : 'in your working tree'}.`, risk: undone ? 'rewrites_history' : 'safe' };
}

function push(s: SimState, flags: string[]): RunResult {
  const b = headBranch(s);
  const head = headId(s);
  if (!b || !head) return fail(s, 'fatal: You are not currently on a branch.');
  const remote = s.remote[b];
  const force = flags.includes('--force') || flags.includes('-f');
  const lease = flags.some((f) => f.startsWith('--force-with-lease'));
  if (!remote || isAncestor(s, remote, head)) {
    s.remote[b] = head;
    s.seen[b] = head;
    return { state: s, output: `To origin\n   ${remote ?? '(new)'}..${head}  ${b} -> ${b}`, risk: 'safe' };
  }
  if (lease && s.seen[b] !== remote) return fail(s, ` ! [rejected] ${b} -> ${b} (stale info)\nSomeone pushed since you last fetched: --force-with-lease protected their work. Run git pull --rebase first.`);
  if (force || lease) {
    const lost = [...ancestors(s, remote)].filter((c) => !ancestors(s, head).has(c));
    s.remote[b] = head;
    s.seen[b] = head;
    return { state: s, output: ` + ${remote}...${head} ${b} -> ${b} (forced update)${lost.length ? `\nThe remote no longer has: ${lost.join(', ')}. Anyone who pulled them now has a different history.` : ''}`, risk: 'rewrites_history' };
  }
  return fail(s, ` ! [rejected] ${b} -> ${b} (non-fast-forward)\nThe remote has commits you don't have. Integrate them first: git pull --rebase (or git pull), then push.`);
}

export function run(prev: SimState, line: string): RunResult {
  const s = clone(prev);
  const t = tokenize(line.trim());
  if (t[0] === 'edit') {
    s.working++;
    return { state: s, output: 'You changed a file. (git add . to stage it)', risk: 'safe' };
  }
  if (t[0] !== 'git' || !t[1]) return fail(s, 'Practice mode understands "edit" and a set of git commands. Type "help".');
  const [cmd, ...rest] = t.slice(1) as [string, ...string[]];
  const args = rest.filter((a) => !a.startsWith('-'));
  const flags = rest.filter((a) => a.startsWith('-'));
  switch (cmd) {
    case 'status':
      return { state: s, output: `On ${headBranch(s) ? `branch ${headBranch(s)}` : `detached HEAD at ${headId(s)}`}\nStaged: ${s.staged} · Not staged: ${s.working}${s.stash.length ? ` · Stashes: ${s.stash.length}` : ''}`, risk: 'safe' };
    case 'log': {
      const seen = ancestors(s, headId(s));
      return { state: s, output: s.order.filter((c) => seen.has(c)).reverse().map((c) => `${c} ${s.commits[c]?.msg}`).join('\n') || '(no commits yet)', risk: 'safe' };
    }
    case 'reflog':
      return { state: s, output: s.reflog.map((e, i) => `${e.id} HEAD@{${i}}: ${e.action}`).join('\n') || '(empty)', risk: 'safe' };
    case 'add':
      s.staged += s.working;
      s.working = 0;
      return { state: s, output: s.staged ? `Staged ${s.staged} change(s).` : 'Nothing to add.', risk: 'safe' };
    case 'commit': {
      const m = rest.indexOf('-m');
      return commit(s, m >= 0 ? rest[m + 1] ?? '' : '', flags.includes('--amend'));
    }
    case 'branch':
      if (flags.includes('-d') || flags.includes('-D')) {
        const name = args[0] ?? '';
        if (!s.branches[name]) return fail(s, `error: branch '${name}' not found.`);
        if (name === headBranch(s)) return fail(s, `error: Cannot delete branch '${name}' checked out.`);
        delete s.branches[name];
        return { state: s, output: `Deleted branch ${name}.`, risk: flags.includes('-D') ? 'can_lose_work' : 'safe' };
      }
      if (!args[0]) return { state: s, output: Object.keys(s.branches).map((b) => `${b === headBranch(s) ? '* ' : '  '}${b}`).join('\n'), risk: 'safe' };
      if (s.branches[args[0]]) return fail(s, `fatal: a branch named '${args[0]}' already exists.`);
      s.branches[args[0]] = resolve(s, args[1] ?? 'HEAD') ?? (headId(s) as string);
      return { state: s, output: `Created branch ${args[0]}.`, risk: 'safe' };
    case 'switch':
    case 'checkout': {
      const create = flags.includes('-c') || flags.includes('-b');
      const name = args[0] ?? '';
      if (create) {
        if (s.branches[name]) return fail(s, `fatal: a branch named '${name}' already exists.`);
        s.branches[name] = headId(s) as string;
        s.head = { branch: name };
        s.reflog.unshift({ id: headId(s) as string, action: `checkout: moving to ${name}` });
        return { state: s, output: `Switched to a new branch '${name}'`, risk: 'safe' };
      }
      if (s.branches[name]) {
        s.head = { branch: name };
        s.reflog.unshift({ id: s.branches[name] as string, action: `checkout: moving to ${name}` });
        return { state: s, output: `Switched to branch '${name}'`, risk: 'safe' };
      }
      const id = resolve(s, name);
      if (!id) return fail(s, `error: pathspec '${name}' did not match any branch or commit.`);
      if (cmd === 'switch' && !flags.includes('--detach')) return fail(s, `fatal: a branch is expected, got commit '${name}' (use git switch --detach ${name} or git checkout ${name})`);
      s.head = { detached: id };
      s.reflog.unshift({ id, action: `checkout: moving to ${name}` });
      return { state: s, output: `You are in 'detached HEAD' state at ${id}. Commits made here belong to no branch: create one with git switch -c <name>.`, risk: 'safe' };
    }
    case 'merge':
      return merge(s, args[0] ?? '');
    case 'rebase':
      return rebase(s, args[0] ?? '');
    case 'reset':
      return reset(s, flags.find((f) => ['--hard', '--soft', '--mixed'].includes(f)) ?? '--mixed', args[0] ?? 'HEAD');
    case 'revert': {
      const id = resolve(s, args[0] ?? '');
      if (!id || !headId(s)) return fail(s, `fatal: bad revision '${args[0] ?? ''}'`);
      const r = addCommit(s, `Revert "${s.commits[id]?.msg}"`, [headId(s) as string]);
      moveHead(s, r, `revert: ${id}`);
      return { state: s, output: `[${headBranch(s)} ${r}] Revert "${s.commits[id]?.msg}"\nA new commit undoes ${id}; history is not rewritten, so it is safe on shared branches.`, risk: 'safe' };
    }
    case 'cherry-pick': {
      const id = resolve(s, args[0] ?? '');
      if (!id || !headId(s)) return fail(s, `fatal: bad revision '${args[0] ?? ''}'`);
      const c = addCommit(s, s.commits[id]?.msg ?? id, [headId(s) as string]);
      moveHead(s, c, `cherry-pick: ${s.commits[id]?.msg}`);
      return { state: s, output: `[${headBranch(s)} ${c}] ${s.commits[id]?.msg} (a copy of ${id} with a new id)`, risk: 'safe' };
    }
    case 'stash':
      if (args[0] === 'pop') {
        const top = s.stash.shift();
        if (!top) return fail(s, 'No stash entries found.');
        s.working += top.working + top.staged;
        return { state: s, output: 'Restored your stashed changes.', risk: 'safe' };
      }
      if (!s.working && !s.staged) return fail(s, 'No local changes to save.');
      s.stash.unshift({ working: s.working, staged: s.staged });
      s.working = 0;
      s.staged = 0;
      return { state: s, output: 'Saved working directory and index state. (git stash pop to bring it back)', risk: 'safe' };
    case 'fetch':
      for (const [b, id] of Object.entries(s.remote)) s.seen[b] = id;
      return { state: s, output: 'Fetched origin.', risk: 'safe' };
    case 'pull': {
      const b = headBranch(s);
      if (!b || !s.remote[b]) return fail(s, 'There is no tracking information for the current branch.');
      s.seen[b] = s.remote[b] as string;
      return flags.includes('--rebase') ? rebase(s, `origin/${b}`) : merge(s, `origin/${b}`, 'pull');
    }
    case 'push':
      return push(s, flags);
    default:
      return fail(s, `Practice mode doesn't simulate "git ${cmd}" yet. Type "help" for the list.`);
  }
}
