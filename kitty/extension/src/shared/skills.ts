// "Your Git path": the Git skills a learner has asked about (tracked only in this browser, never sent anywhere),
// what to learn next, and a short quiz. Pure data and functions; the side panel stores progress in storage.local.

export interface QuizQuestion {
  q: string;
  /** The first choice is the right one; the UI shuffles them. */
  choices: [string, string, string, string];
  why: string;
}
export interface Skill {
  id: string;
  title: string;
  needs: string[];
  /** Matches chat questions about this skill. */
  match: RegExp;
  /** Asked in the chat when the learner picks this skill next. */
  starter: string;
  quiz: QuizQuestion;
}

export const SKILLS: Skill[] = [
  { id: 'basics', title: 'Repos and status', needs: [], match: /\b(git )?(init|clone|status)\b|\bwhat is (a )?(git|repo|repository)\b/i, starter: 'What do git init, git clone and git status do?',
    quiz: { q: 'Which command shows what has changed but is not committed yet?', choices: ['git status', 'git log', 'git fetch', 'git tag'], why: 'git status lists staged, unstaged and untracked changes.' } },
  { id: 'commit', title: 'Staging and committing', needs: ['basics'], match: /\b(git )?(add|commit)\b|\bstag(e|ing)\b/i, starter: 'How do staging and committing work in Git?',
    quiz: { q: 'What does git add do?', choices: ['Stages changes for the next commit', 'Uploads the file to GitHub', 'Creates a new branch', 'Deletes untracked files'], why: 'git add puts changes in the staging area; git commit records them.' } },
  { id: 'history', title: 'History and diffs', needs: ['commit'], match: /\b(git )?(log|diff|show|blame)\b|\bhistory\b/i, starter: 'How do I look at history and diffs with git log and git diff?',
    quiz: { q: 'What does git diff --staged show?', choices: ['Changes staged for the next commit', 'Commits on the remote', 'All branches', 'Untracked files only'], why: '--staged compares the staging area with the last commit.' } },
  { id: 'branches', title: 'Branches', needs: ['commit'], match: /\bbranch(es|ing)?\b|\b(git )?(switch|checkout)\b/i, starter: 'How do I create, switch and delete branches?',
    quiz: { q: 'Which command creates a new branch and switches to it?', choices: ['git switch -c my-branch', 'git branch -d my-branch', 'git merge my-branch', 'git push my-branch'], why: 'switch -c creates the branch and moves you onto it.' } },
  { id: 'remotes', title: 'Push, pull and fetch', needs: ['branches'], match: /\b(git )?(push|pull|fetch|remote)\b|\borigin\b/i, starter: "What's the difference between git fetch, git pull and git push?",
    quiz: { q: 'How is git fetch different from git pull?', choices: ['fetch downloads without changing your branch; pull also merges or rebases', 'fetch uploads, pull downloads', 'They are the same', 'fetch deletes remote branches'], why: 'pull = fetch + integrate into your current branch.' } },
  { id: 'merge', title: 'Merging', needs: ['branches'], match: /\bmerg(e|ing)\b/i, starter: 'How does git merge work?',
    quiz: { q: 'When does a merge conflict happen?', choices: ['Both branches changed the same lines differently', 'A branch has more than 10 commits', 'You merge without internet', 'The branch name has a slash'], why: 'Git cannot pick between two different edits to the same place.' } },
  { id: 'conflicts', title: 'Resolving conflicts', needs: ['merge'], match: /\bconflicts?\b|<<<<<<</i, starter: 'How do I resolve a merge conflict step by step?',
    quiz: { q: 'During a rebase you fixed the conflict markers in a file. What next?', choices: ['git add <file>, then git rebase --continue', 'git commit --amend', 'git reset --hard', 'git push --force'], why: 'add marks the file resolved; --continue replays the remaining commits.' } },
  { id: 'undo', title: 'Undoing changes', needs: ['commit'], match: /\bundo\b|\b(git )?(revert|reset|restore)\b/i, starter: 'How do I undo my last commit?',
    quiz: { q: 'Safest way to undo a commit that is already pushed to a shared branch?', choices: ['git revert <commit>', 'git reset --hard HEAD~1 and force push', 'Delete the branch', 'git commit --amend'], why: 'revert adds a new commit that reverses it, without rewriting shared history.' } },
  { id: 'amend', title: 'Fixing the last commit', needs: ['undo'], match: /\bamend\b|\b(change|fix|edit) (the |my )?(last )?commit message\b/i, starter: 'How do I change my last commit message or add a forgotten file?',
    quiz: { q: 'What does git commit --amend do?', choices: ['Replaces the last commit with a new one that includes the staged changes', 'Adds a new commit after the last one', 'Deletes the last commit', 'Pushes the last commit again'], why: 'amend rewrites the last commit; avoid it once that commit is pushed and shared.' } },
  { id: 'stash', title: 'Stashing work', needs: ['commit'], match: /\bstash\b|\bset aside\b|\bsave (my )?(work|changes)\b/i, starter: 'How do I use git stash?',
    quiz: { q: 'What does git stash do?', choices: ['Saves uncommitted changes aside and cleans the working tree', 'Deletes all local branches', 'Commits everything to main', 'Hides files from GitHub'], why: 'git stash pop brings the changes back.' } },
  { id: 'rebase', title: 'Rebasing', needs: ['merge'], match: /\brebas(e|ing)\b|\bsquash\b|--force-with-lease/i, starter: "What's the difference between merge and rebase?",
    quiz: { q: 'After a rebase, why push with --force-with-lease instead of --force?', choices: ['It refuses if someone pushed commits you have not seen', 'It is faster', 'It merges instead of rebasing', 'It keeps the old commits'], why: 'It protects other people\'s work on the same branch.' } },
  { id: 'reflog', title: 'Recovering lost work', needs: ['rebase'], match: /\breflog\b|\b(lost|recover|get back)\b/i, starter: 'How do I recover a commit I lost after a reset or rebase?',
    quiz: { q: 'You lost a commit after git reset --hard. Which command helps find it?', choices: ['git reflog', 'git status', 'git clean', 'git init'], why: 'reflog records where HEAD has been, including commits no branch points to.' } },
  { id: 'forks', title: 'Forks and pull requests', needs: ['remotes'], match: /\bforks?\b|\bupstream\b|\bpull requests?\b|\bprs?\b/i, starter: 'How do I contribute to an open-source repo with a fork and a pull request?',
    quiz: { q: 'In a fork workflow, what is "upstream" usually?', choices: ['The original repository you forked from', 'Your fork on GitHub', 'The main branch', 'A backup of your commits'], why: 'origin is your fork; upstream is the project you contribute to.' } },
  { id: 'cherry-pick', title: 'Cherry-picking', needs: ['branches'], match: /\bcherry[- ]?pick/i, starter: 'How do I cherry-pick one commit onto another branch?',
    quiz: { q: 'What does git cherry-pick <commit> do?', choices: ["Applies that commit's changes as a new commit on your branch", 'Deletes that commit', 'Moves your branch to that commit', 'Shows who wrote that commit'], why: 'The new commit has the same changes but a new id.' } },
  { id: 'ignore', title: '.gitignore', needs: ['basics'], match: /\bignor(e|ed|ing)\b|\.gitignore/i, starter: 'How does .gitignore work?',
    quiz: { q: 'You added a file to .gitignore but Git still tracks it. Why?', choices: ['.gitignore only affects untracked files; run git rm --cached <file>', '.gitignore needs a restart', 'Git ignores .gitignore on Windows', 'The file must be renamed'], why: 'Already-tracked files stay tracked until removed from the index.' } },
  { id: 'actions', title: 'CI with GitHub Actions', needs: ['remotes'], match: /\bactions?\b|\bci\b|\bworkflows?\b|\bpipeline/i, starter: 'What are GitHub Actions and how do CI checks on a pull request work?',
    quiz: { q: 'Where do GitHub Actions workflow files live in a repo?', choices: ['.github/workflows/*.yml', 'src/actions/', '.git/hooks/', 'package.json'], why: 'Each YAML file there defines a workflow.' } },
];

export type Progress = Record<string, number>;
export const SKILLS_KEY = 'kitty:skills';

/** Skills a chat question is about. */
export const topicsOf = (question: string): string[] => SKILLS.filter((s) => s.match.test(question)).map((s) => s.id);

export function recordTopics(p: Progress, question: string): Progress {
  const ids = topicsOf(question);
  if (!ids.length) return p;
  const next = { ...p };
  for (const id of ids) next[id] = (next[id] ?? 0) + 1;
  return next;
}

/** The next skill to learn: the first one in path order not yet explored whose prerequisites are explored. */
export function nextSkill(p: Progress): Skill | null {
  const seen = (id: string): boolean => (p[id] ?? 0) > 0;
  return SKILLS.find((s) => !seen(s.id) && s.needs.every(seen)) ?? SKILLS.find((s) => !seen(s.id)) ?? null;
}

export const explored = (p: Progress): Skill[] => SKILLS.filter((s) => (p[s.id] ?? 0) > 0);

/** Three questions: from explored skills first (least-asked first), topped up from the start of the path. */
export function quizFor(p: Progress, rand: () => number = Math.random, n = 3): { skill: Skill; choices: string[]; answer: string }[] {
  const pool = explored(p).sort((a, b) => (p[a.id] ?? 0) - (p[b.id] ?? 0));
  for (const s of SKILLS) if (pool.length < n && !pool.includes(s)) pool.push(s);
  return pool.slice(0, n).map((skill) => {
    const choices = [...skill.quiz.choices];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [choices[i], choices[j]] = [choices[j] as string, choices[i] as string];
    }
    return { skill, choices, answer: skill.quiz.choices[0] };
  });
}
