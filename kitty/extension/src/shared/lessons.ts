// Guided lessons, one per skill on the Git path: a real situation, the commands, why they work, a hands-on try in
// Practice mode (when there is a matching scenario), then a check question. "Read more" asks the cited tutor.

export interface Lesson {
  skill: string;
  scenario: string;
  commands: string[];
  why: string;
  /** Practice mode scenario id for the "try it" step. */
  practice?: string;
}

export const LESSONS: Lesson[] = [
  { skill: 'basics', scenario: 'You found a project on GitHub and want it on your laptop, then see what state it is in.',
    commands: ['git clone https://github.com/owner/repo.git   # copy the repo, with its full history', 'cd repo', 'git status                                     # what changed, what is staged'],
    why: 'clone downloads every commit and sets up "origin" pointing back at GitHub. status is the command to run whenever you are unsure: it tells you the branch and what is changed or staged.', practice: 'sandbox' },
  { skill: 'commit', scenario: 'You fixed a typo and want to save that change as one clean step in history.',
    commands: ['git add README.md            # stage just this file (or: git add . for everything)', 'git commit -m "Fix typo in README"', 'git log --oneline -3          # see it on top'],
    why: 'Git saves in two moves: add puts changes in the staging area, commit records exactly what is staged. Staging lets you split unrelated edits into separate commits.', practice: 'sandbox' },
  { skill: 'history', scenario: 'A test started failing and you want to see what changed recently, and what you are about to commit.',
    commands: ['git log --oneline --graph -10   # recent commits as a graph', 'git diff                        # changes not staged yet', 'git diff --staged               # changes that will go in the next commit'],
    why: 'log shows commits; diff compares versions. Checking git diff --staged before every commit catches debug lines and files you did not mean to include.' },
  { skill: 'branches', scenario: 'You want to try a new feature without touching main.',
    commands: ['git switch -c feature/search    # create the branch and move onto it', '# ...edit, add, commit...', 'git switch main                  # go back; your feature commits stay on their branch'],
    why: 'A branch is just a movable label on a commit. New commits move the branch you are on, so main stays exactly as it was.', practice: 'detached-head' },
  { skill: 'remotes', scenario: 'You pushed nothing yet, and a teammate already updated main on GitHub.',
    commands: ['git fetch origin              # download their commits, change nothing locally', 'git pull --rebase             # put your commits on top of theirs', 'git push'],
    why: 'fetch only updates origin/main. pull = fetch + integrate. A push is rejected when the remote has commits you do not have; integrate first instead of forcing.', practice: 'rejected-push' },
  { skill: 'merge', scenario: 'Your feature branch is done and should go into main.',
    commands: ['git switch main', 'git merge feature/search      # fast-forward or a merge commit', 'git branch -d feature/search  # tidy up the label'],
    why: 'If main has not moved, Git just moves the label forward (fast-forward). If both changed, Git makes a merge commit with two parents, keeping both histories.' },
  { skill: 'conflicts', scenario: 'A merge or rebase stops with CONFLICT in app.js.',
    commands: ['git status                    # lists "both modified" files', '# open app.js: keep the right code between <<<<<<< ======= >>>>>>> and delete the markers', 'git add app.js', 'git rebase --continue         # or: git commit, if you were merging'],
    why: 'Git stops when both sides changed the same lines and asks you to decide. git rebase --abort (or git merge --abort) puts everything back if you want to start over.' },
  { skill: 'undo', scenario: 'You committed something wrong. What you do depends on whether it was pushed.',
    commands: ['git reset --soft HEAD~1        # not pushed: undo the commit, keep the changes staged', 'git revert <commit>            # pushed: add a new commit that undoes it', 'git restore file.txt           # throw away unstaged edits to one file'],
    why: 'reset moves your branch back (rewriting history), which is fine only before others have the commit. revert never rewrites history, so it is the safe undo for shared branches.', practice: 'undo-commit' },
  { skill: 'amend', scenario: 'You just committed but forgot a file and made a typo in the message.',
    commands: ['git add forgotten.js', 'git commit --amend -m "Add search results page"'],
    why: '--amend replaces the last commit with a new one. Only do it before pushing; after pushing it needs a force push and confuses anyone who pulled.' },
  { skill: 'stash', scenario: 'You are halfway through a change and need to switch branches to fix an urgent bug.',
    commands: ['git stash                      # park your changes', 'git switch main', '# ...fix, commit...', 'git switch -', 'git stash pop                  # bring them back'],
    why: 'stash saves uncommitted work on a shelf and cleans the working tree, so switching branches is safe. pop re-applies the most recent stash.' },
  { skill: 'rebase', scenario: 'Your branch is behind main and the maintainers want a linear history.',
    commands: ['git fetch origin', 'git rebase origin/main         # replay your commits on top', 'git push --force-with-lease    # your branch was rewritten'],
    why: 'Rebase gives your commits new ids on top of the latest main, so history reads in a straight line. Only rebase branches that are yours; --force-with-lease refuses to overwrite work you have not seen.', practice: 'rebase-feature' },
  { skill: 'reflog', scenario: 'After a bad reset --hard or rebase, commits seem to be gone.',
    commands: ['git reflog                     # every place HEAD has been', 'git reset --hard HEAD@{2}      # go back to one of them (or use the commit id)'],
    why: 'Commits are not deleted right away; they are just unreferenced. The reflog remembers them (for about 90 days), so almost any local mistake can be undone.', practice: 'recover-reset' },
  { skill: 'forks', scenario: 'You want to contribute to a project you cannot push to.',
    commands: ['# click Fork on GitHub, then:', 'git clone https://github.com/YOU/repo.git', 'git remote add upstream https://github.com/OWNER/repo.git', 'git switch -c fix/123-typo upstream/main', '# ...commit, then: git push -u origin fix/123-typo and open a pull request'],
    why: 'origin is your fork (you can push), upstream is the original project (you fetch from it). A pull request asks the maintainers to merge your branch.' },
  { skill: 'cherry-pick', scenario: 'One bug fix on a feature branch is needed on main right now, without the rest.',
    commands: ['git log --oneline feature      # find the fix commit id', 'git switch main', 'git cherry-pick <id>'],
    why: 'cherry-pick copies one commit\'s changes onto your current branch as a new commit, leaving the rest of the branch alone.', practice: 'cherry-pick' },
  { skill: 'ignore', scenario: 'node_modules and .env keep showing up in git status.',
    commands: ['echo "node_modules/" >> .gitignore', 'echo ".env" >> .gitignore', 'git rm --cached .env            # stop tracking it if it was already committed', 'git commit -m "Ignore build output and secrets"'],
    why: '.gitignore only affects files Git is not tracking yet. Already-committed files must be removed from the index; if a secret was pushed, rotate it, because it stays in history.' },
  { skill: 'actions', scenario: 'Your pull request shows a failed CI check (a red X).',
    commands: ['# open the failed check, expand the red step, find the first error line', '# reproduce it locally with the same command (e.g. npm test)', 'git commit -am "Fix failing test"', 'git push                       # CI runs again on its own'],
    why: 'Workflows in .github/workflows run on every push and pull request. Fix the cause locally and push again; on an Actions run page Kitty can explain the failure for you.' },
];

export const lessonFor = (skill: string): Lesson | undefined => LESSONS.find((l) => l.skill === skill);
export const LESSONS_KEY = 'kitty:lessons';
/** Lesson progress: skill -> furthest step reached (STEPS.length = finished). */
export type LessonProgress = Record<string, number>;
export const STEPS = ['Situation', 'Commands', 'Try it', 'Check'] as const;
