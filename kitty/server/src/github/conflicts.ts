// Merge-conflict rescue for a pull request that GitHub says conflicts with its base branch: which files probably
// conflict (changed on both sides since the branches split), and exact steps with the real branch and remote names.
// Built from facts, never by the model.
import type { GitHubClient, Pull } from './client.js';

export interface RescueStep {
  title: string;
  commands: string[];
  note?: string;
}
export interface ConflictRescue {
  /** Files changed both in the PR and on the base branch since they split (the likely conflicts). */
  likelyFiles: string[];
  steps: RescueStep[];
  undo: RescueStep;
}

export function rescueSteps(pull: Pull, isFork: boolean, baseRepo: string): Omit<ConflictRescue, 'likelyFiles'> {
  const remote = isFork ? 'upstream' : 'origin';
  const base = pull.base.ref;
  const head = pull.head.ref;
  return {
    steps: [
      {
        title: 'Get the latest code',
        commands: [
          ...(isFork ? [`# only once: git remote add upstream https://github.com/${baseRepo}.git`] : []),
          `git switch ${head}`,
          `git fetch ${remote}`,
        ],
        note: 'Commit or stash any unfinished work first, so nothing gets mixed in.',
      },
      {
        title: `Replay your commits on top of ${base}`,
        commands: [`git rebase ${remote}/${base}`],
        note: 'Git stops at the first commit that conflicts and lists the files.',
      },
      {
        title: 'Fix each conflicted file',
        commands: ['git status', '# open each "both modified" file and look for the markers:', '# <<<<<<< (their version) ======= (your version) >>>>>>>', '# keep the right code, delete the three marker lines, save'],
        note: 'Often you need parts of both versions. Search the file for "<<<<<<<" to be sure none are left.',
      },
      {
        title: 'Mark them fixed and continue',
        commands: ['git add <file>', 'git rebase --continue'],
        note: 'Repeat the last two steps until Git says the rebase is done. Then run the tests.',
      },
      {
        title: 'Update your pull request',
        commands: ['git push --force-with-lease'],
        note: 'A rebase rewrites your branch, so the push must replace it. --force-with-lease refuses if someone else pushed to it meanwhile.',
      },
    ],
    undo: {
      title: 'If it goes wrong',
      commands: ['git rebase --abort', '# already finished but the result is wrong:', 'git reflog', `git reset --hard ${head}@{1}`],
      note: '--abort puts everything back as it was before the rebase. After it finished, reflog shows where your branch was; reset goes back there (this discards the rebase).',
    },
  };
}

/** Files touched on both sides since the merge base (2 API calls). Empty when GitHub can't tell. */
export async function likelyConflicts(github: GitHubClient, owner: string, repo: string, pull: Pull): Promise<string[]> {
  if (!pull.head.sha) return [];
  try {
    const mine = await github.compare(owner, repo, pull.base.ref, pull.head.sha);
    const theirs = await github.compare(owner, repo, mine.merge_base_commit.sha, pull.base.ref);
    const changed = new Set(theirs.files.map((f) => f.filename));
    return mine.files.map((f) => f.filename).filter((f) => changed.has(f)).slice(0, 20);
  } catch {
    return [];
  }
}
