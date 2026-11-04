// Practice mode scenarios: a starting history, a goal Kitty can check, and a hint. Each one teaches one risky situation.
import { addCommit, ancestors, emptyState, headBranch, headId, linear, moveHead, reachable, type SimState } from './git-sim';

export interface Scenario {
  id: string;
  title: string;
  /** The skill on the learning path this practises. */
  skill: string;
  story: string;
  goal: string;
  hint: string;
  setup: () => SimState;
  done: (s: SimState) => boolean;
}

/** main: c1..c3 pushed, plus a branch "feature" with its own commits. */
function withFeature(featureCommits: string[], mainAfter: string[] = []): SimState {
  const s = linear(['Initial commit', 'Add login page', 'Add tests']);
  const base = headId(s) as string;
  s.branches.feature = base;
  s.head = { branch: 'feature' };
  let tip = base;
  for (const m of featureCommits) {
    tip = addCommit(s, m, [tip]);
    moveHead(s, tip, `commit: ${m}`);
  }
  s.head = { branch: 'main' };
  for (const m of mainAfter) {
    const id = addCommit(s, m, [headId(s) as string]);
    moveHead(s, id, `commit: ${m}`);
  }
  s.remote.main = s.branches.main as string;
  s.seen.main = s.branches.main as string;
  s.head = { branch: 'feature' };
  return s;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'undo-commit',
    title: 'Undo your last commit (keep the work)',
    skill: 'undo',
    story: 'You committed "WIP: half-done search" on main by mistake. It is not pushed yet.',
    goal: 'Remove the commit from main but keep its changes staged, so nothing is lost.',
    hint: 'git reset --soft HEAD~1 moves main back one commit and keeps the changes staged.',
    setup: () => {
      const s = linear(['Initial commit', 'Add login page']);
      const id = addCommit(s, 'WIP: half-done search', [headId(s) as string]);
      moveHead(s, id, 'commit: WIP: half-done search');
      return s;
    },
    done: (s) => s.branches.main === 'c2' && s.staged + s.working > 0,
  },
  {
    id: 'recover-reset',
    title: 'Recover commits after reset --hard',
    skill: 'reflog',
    story: 'You ran git reset --hard HEAD~2 and two good commits vanished from main.',
    goal: 'Bring main back to the commit "Add password reset".',
    hint: 'git reflog lists where HEAD has been. Find "Add password reset" and run git reset --hard HEAD@{n} (or its id).',
    setup: () => {
      const s = linear(['Initial commit', 'Add login page', 'Add signup', 'Add password reset'], false);
      s.branches.main = 'c2';
      s.reflog.unshift({ id: 'c2', action: 'reset: moving to HEAD~2' });
      return s;
    },
    done: (s) => s.branches.main === 'c4',
  },
  {
    id: 'rebase-feature',
    title: 'Rebase your branch on the latest main',
    skill: 'rebase',
    story: 'You are on "feature" (2 commits). Meanwhile main got a new commit "Fix typo in README".',
    goal: 'Put your feature commits on top of the latest main, with no merge commit.',
    hint: 'git rebase main replays your commits on top of main (they get new ids).',
    setup: () => withFeature(['Add search box', 'Add search results'], ['Fix typo in README']),
    done: (s) => {
      const f = s.branches.feature;
      return headBranch(s) === 'feature' && Boolean(f && ancestors(s, f).has(s.branches.main as string)) && ![...ancestors(s, f)].some((c) => (s.commits[c]?.parents.length ?? 0) > 1);
    },
  },
  {
    id: 'revert-pushed',
    title: 'Undo a commit that is already pushed',
    skill: 'undo',
    story: '"Break the checkout page" (c3) is already on origin/main. Teammates may have pulled it.',
    goal: 'Undo it without rewriting history, then push.',
    hint: 'git revert HEAD adds a new commit that undoes c3. Then git push (no force needed).',
    setup: () => linear(['Initial commit', 'Add checkout page', 'Break the checkout page']),
    done: (s) => Boolean(s.remote.main && s.commits[s.remote.main]?.msg.startsWith('Revert') && ancestors(s, s.remote.main).has('c3')),
  },
  {
    id: 'rejected-push',
    title: 'Fix a rejected push',
    skill: 'remotes',
    story: 'A teammate pushed "Update docs" to main. Your local main has "Add dark mode". git push is rejected.',
    goal: 'Get both commits on origin/main without --force.',
    hint: 'git pull --rebase puts your commit on top of theirs; then git push works.',
    setup: () => {
      const s = linear(['Initial commit', 'Add login page']);
      const theirs = addCommit(s, 'Update docs', ['c2']);
      s.remote.main = theirs;
      const mine = addCommit(s, 'Add dark mode', ['c2']);
      moveHead(s, mine, 'commit: Add dark mode');
      return s;
    },
    done: (s) => Boolean(s.remote.main && ancestors(s, s.remote.main).has('c3') && [...ancestors(s, s.remote.main)].some((c) => s.commits[c]?.msg === 'Add dark mode')),
  },
  {
    id: 'cherry-pick',
    title: 'Copy one fix to main',
    skill: 'cherry-pick',
    story: 'On "feature" you made "Fix crash on empty cart" (c5). main needs that fix now, but not the rest of feature.',
    goal: 'Get the crash fix on main without merging the whole branch.',
    hint: 'git switch main, then git cherry-pick c5.',
    setup: () => withFeature(['Start new checkout flow', 'Fix crash on empty cart']),
    done: (s) => {
      const main = ancestors(s, s.branches.main);
      return [...main].some((c) => s.commits[c]?.msg === 'Fix crash on empty cart') && ![...main].some((c) => s.commits[c]?.msg === 'Start new checkout flow');
    },
  },
  {
    id: 'detached-head',
    title: 'Save work from a detached HEAD',
    skill: 'branches',
    story: 'You checked out an old commit to test something and committed "Try new layout" there. HEAD is detached.',
    goal: 'Keep that commit on a branch called "layout" so it is not lost.',
    hint: 'git switch -c layout creates a branch right where you are.',
    setup: () => {
      const s = linear(['Initial commit', 'Add login page', 'Add tests']);
      s.head = { detached: 'c2' };
      s.reflog.unshift({ id: 'c2', action: 'checkout: moving to c2' });
      const id = addCommit(s, 'Try new layout', ['c2']);
      moveHead(s, id, 'commit: Try new layout');
      return s;
    },
    done: (s) => Boolean(s.branches.layout && s.commits[s.branches.layout]?.msg === 'Try new layout'),
  },
  {
    id: 'sandbox',
    title: 'Free play',
    skill: 'basics',
    story: 'An empty repo. Try anything: edit, add, commit, branch, merge, rebase, reset, reflog.',
    goal: 'No goal: explore. Lost commits show faded until something points at them again.',
    hint: 'Start with: edit, git add ., git commit -m "first"',
    setup: () => emptyState(),
    done: () => false,
  },
];

export const scenarioById = (id: string): Scenario | undefined => SCENARIOS.find((s) => s.id === id);
/** For the graph: commits nothing points at any more (only the reflog remembers them). */
export const lostCommits = (s: SimState): string[] => {
  const r = reachable(s);
  return s.order.filter((c) => !r.has(c));
};

const TOPICS: [RegExp, string][] = [
  [/\breflog\b|\b(lost|recover|get back)\b.*\bcommits?\b|reset --hard/i, 'recover-reset'],
  [/\brevert\b|\bpushed\b/i, 'revert-pushed'],
  [/\bundo\b.*\b(last )?commit\b|reset --soft|uncommit/i, 'undo-commit'],
  [/\brebas(e|ing)\b/i, 'rebase-feature'],
  [/\b(rejected|non-fast-forward|force[- ]?push|--force)\b|\bpull --rebase\b/i, 'rejected-push'],
  [/\bcherry[- ]?pick/i, 'cherry-pick'],
  [/\bdetached\b/i, 'detached-head'],
];
/** The practice scenario that matches a chat question (and answer), if any. */
export const scenarioFor = (text: string): Scenario | undefined => {
  const id = TOPICS.find(([re]) => re.test(text))?.[1];
  return id ? scenarioById(id) : undefined;
};
