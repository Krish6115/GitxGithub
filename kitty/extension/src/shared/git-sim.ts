// A tiny Git model for Practice mode: commits, branches, HEAD, a reflog, one remote (origin) and change counters.
// It runs entirely in the browser, never touches a real repo, and is small enough to explain what each command does.

export interface Commit {
  id: string;
  msg: string;
  parents: string[];
}

export interface SimState {
  commits: Record<string, Commit>;
  /** Creation order (left to right in the graph). */
  order: string[];
  branches: Record<string, string>;
  /** Remote-tracking branches: origin/<name> -> commit. */
  remote: Record<string, string>;
  /** Where the remote was when we last fetched/pushed (for --force-with-lease). */
  seen: Record<string, string>;
  head: { branch: string } | { detached: string };
  reflog: { id: string; action: string }[];
  /** Uncommitted changes (counts of changed files). */
  working: number;
  staged: number;
  stash: { working: number; staged: number }[];
  next: number;
}

export function emptyState(): SimState {
  return { commits: {}, order: [], branches: {}, remote: {}, seen: {}, head: { branch: 'main' }, reflog: [], working: 0, staged: 0, stash: [], next: 1 };
}

export const headId = (s: SimState): string | undefined => ('branch' in s.head ? s.branches[s.head.branch] : s.head.detached);
export const headBranch = (s: SimState): string | null => ('branch' in s.head ? s.head.branch : null);

/** Make a commit object with the next short id (c1, c2, …). */
export function addCommit(s: SimState, msg: string, parents: string[]): string {
  const id = `c${s.next}`;
  s.commits[id] = { id, msg, parents };
  s.order.push(id);
  s.next++;
  return id;
}

/** Point HEAD (or the current branch) at `id` and record it in the reflog. */
export function moveHead(s: SimState, id: string, action: string): void {
  if ('branch' in s.head) s.branches[s.head.branch] = id;
  else s.head = { detached: id };
  s.reflog.unshift({ id, action });
}

/** All ancestors of `id` (including itself). */
export function ancestors(s: SimState, id: string | undefined): Set<string> {
  const out = new Set<string>();
  const stack = id ? [id] : [];
  while (stack.length) {
    const c = stack.pop() as string;
    if (out.has(c) || !s.commits[c]) continue;
    out.add(c);
    stack.push(...(s.commits[c]?.parents ?? []));
  }
  return out;
}
export const isAncestor = (s: SimState, a: string, b: string): boolean => ancestors(s, b).has(a);

/** Commits reachable from any branch, remote branch or HEAD. Everything else is only in the reflog ("lost"). */
export function reachable(s: SimState): Set<string> {
  const out = new Set<string>();
  for (const id of [...Object.values(s.branches), ...Object.values(s.remote), headId(s)]) for (const a of ancestors(s, id)) out.add(a);
  return out;
}

/** Resolve HEAD, HEAD~n, HEAD^, HEAD@{n}, branch, origin/branch or commit id. */
export function resolve(s: SimState, ref: string): string | null {
  const r = ref.trim();
  const at = /^HEAD@\{(\d+)\}$/.exec(r);
  if (at) return s.reflog[Number(at[1])]?.id ?? null;
  const rel = /^([\w./-]+?)(~(\d*)|\^+)?$/.exec(r);
  if (!rel?.[1]) return null;
  const base = rel[1];
  const remote = base.startsWith('origin/') ? s.remote[base.slice(7)] : undefined;
  let id: string | null = (base === 'HEAD' ? headId(s) : s.branches[base] ?? remote ?? (s.commits[base] ? base : undefined)) ?? null;
  const steps = rel[2] ? (rel[2].startsWith('~') ? Number(rel[3] || 1) : rel[2].length) : 0;
  for (let i = 0; i < steps && id; i++) id = s.commits[id]?.parents[0] ?? null;
  return id;
}

/** A linear history: `msgs` committed on main, optionally pushed. Handy for scenarios. */
export function linear(msgs: string[], pushed = true): SimState {
  const s = emptyState();
  let prev: string | undefined;
  for (const m of msgs) {
    prev = addCommit(s, m, prev ? [prev] : []);
    moveHead(s, prev, `commit: ${m}`);
  }
  if (pushed && prev) {
    s.remote.main = prev;
    s.seen.main = prev;
  }
  return s;
}

export const clone = (s: SimState): SimState => structuredClone(s);
