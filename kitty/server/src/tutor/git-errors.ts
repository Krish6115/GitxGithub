// "Explain my mistake": Git and GitHub error messages people paste into the chat, recognised by rules (no model).
// Each entry says what happened, the exact recovery commands, how to avoid it, and a risk label. Captured names
// (branch, file, remote) from the message fill in the commands. Order matters: specific messages come first.

export type Risk = 'safe' | 'rewrites_history' | 'can_lose_work';
export interface GitErrorRule {
  id: string;
  match: RegExp;
  title: string;
  what: string;
  fix: string[];
  avoid: string;
  risk: Risk;
}

/** {1}, {2}… in `fix` are replaced with the regex's capture groups (or a placeholder). */
export const GIT_ERRORS: GitErrorRule[] = [
  { id: 'secret-push', match: /GH013|push cannot contain secrets|secret scanning/i, title: 'GitHub blocked a push that contains a secret',
    what: 'Push protection found something that looks like a key or token in one of the commits you are pushing.',
    fix: ['# 1. Revoke or rotate that key now (assume it is leaked)', '# 2. Remove it from the commits, e.g. if it is in the last commit:', 'git rm --cached <file-with-secret>   # or edit the file to read the key from an environment variable', 'git commit --amend', 'git push'],
    avoid: 'Keep secrets in a .env file listed in .gitignore and read them from environment variables.', risk: 'rewrites_history' },
  { id: 'large-file', match: /GH001|exceeds GitHub's file size limit|large files detected/i, title: 'A file is too big for GitHub (over 100 MB)',
    what: 'One of your commits contains a file larger than GitHub accepts, so the whole push is refused.',
    fix: ['git rm --cached <big-file>', 'echo "<big-file>" >> .gitignore', 'git commit --amend      # if it was added in the last commit; otherwise it must be removed from every commit that has it', 'git push'],
    avoid: 'Do not commit build output, datasets or videos; use Git LFS for large assets you really need to version.', risk: 'rewrites_history' },
  { id: 'protected-branch', match: /GH006|protected branch (update failed|hook declined)/i, title: 'You pushed to a protected branch',
    what: 'The branch has protection rules (for example: changes only through pull requests), so a direct push is refused.',
    fix: ['git switch -c my-change      # move your commits to a new branch', 'git push -u origin my-change', '# then open a pull request on GitHub'],
    avoid: 'Work on a branch and open a pull request instead of pushing to main.', risk: 'safe' },
  { id: 'rejected-behind', match: /\[rejected\][^\n]*\((non-fast-forward|fetch first)\)|updates were rejected because (the tip of your current branch is behind|the remote contains work)/i, title: 'Push rejected: the remote has commits you don\'t have',
    what: 'Someone (or you, from another machine) pushed new commits. Git will not overwrite them with your push.',
    fix: ['git pull --rebase        # put your commits on top of theirs', '# fix any conflicts, then: git rebase --continue', 'git push'],
    avoid: 'Pull before you start working, and push small changes often.', risk: 'safe' },
  { id: 'divergent', match: /divergent branches|need to specify how to reconcile/i, title: 'git pull needs to know: merge or rebase?',
    what: 'Your branch and the remote both have new commits, and newer Git asks how you want to combine them.',
    fix: ['git pull --rebase                      # this time: replay your commits on top', 'git config --global pull.rebase true    # optional: make rebase the default'],
    avoid: 'Pick a default once with git config pull.rebase (true or false).', risk: 'safe' },
  { id: 'conflict', match: /CONFLICT \([^)]*\): (?:Merge conflict in )?(\S+)|automatic merge failed|could not apply [0-9a-f]+/i, title: 'Merge conflict',
    what: 'Both sides changed the same lines, so Git stopped and wants you to choose. Your work is not lost.',
    fix: ['git status                 # lists the "both modified" files', '# open {1}, keep the right code, delete the <<<<<<< ======= >>>>>>> lines', 'git add {1}', 'git rebase --continue      # or: git commit (if you were merging)', '# to give up and go back: git rebase --abort  (or git merge --abort)'],
    avoid: 'Sync with main often and keep pull requests small, so fewer lines overlap.', risk: 'safe' },
  { id: 'merge-unfinished', match: /you have not concluded your merge|MERGE_HEAD exists/i, title: 'A merge is still in progress',
    what: 'An earlier merge stopped (probably on a conflict) and was never finished or aborted.',
    fix: ['git status                 # see what is left', '# finish it:  git add <files> && git commit', '# or undo it: git merge --abort'],
    avoid: 'After a conflict, always finish (commit) or abort before doing anything else.', risk: 'safe' },
  { id: 'rebase-in-progress', match: /rebase-merge directory|you are currently rebasing|a rebase in progress/i, title: 'A rebase is still in progress',
    what: 'A rebase stopped part-way (usually on a conflict) and is waiting for you.',
    fix: ['git status                 # see where it stopped', 'git rebase --continue      # after fixing and git add-ing files', '# or start over: git rebase --abort'],
    avoid: 'Finish or abort a rebase before switching branches.', risk: 'safe' },
  { id: 'local-changes-overwritten', match: /your local changes to the following files would be overwritten by (checkout|merge|switch)/i, title: 'Uncommitted changes are in the way',
    what: 'Git refused to {1} because it would overwrite edits you have not committed. Nothing was changed.',
    fix: ['git stash                  # park your changes', 'git {1} ...                # run the command again', 'git stash pop              # bring your changes back', '# or commit them first: git add . && git commit -m "WIP"'],
    avoid: 'Commit or stash before switching branches or pulling.', risk: 'safe' },
  { id: 'untracked-overwritten', match: /untracked working tree files would be overwritten/i, title: 'Untracked files are in the way',
    what: 'Files you never added would be replaced by files from the other branch. Git stopped to protect them.',
    fix: ['git status                       # see which files', '# move them somewhere safe, or add and commit them, then retry', 'git stash --include-untracked    # or park them, including untracked files'],
    avoid: 'Add new files to Git (or .gitignore) before switching branches.', risk: 'safe' },
  { id: 'unstaged-pull-rebase', match: /cannot (pull|rebase) with rebase: you have unstaged changes|please commit or stash them/i, title: 'Commit or stash before pulling',
    what: 'A rebase needs a clean working tree, and you have uncommitted changes.',
    fix: ['git stash', 'git pull --rebase', 'git stash pop'],
    avoid: 'git pull --rebase --autostash does the stash and pop for you.', risk: 'safe' },
  { id: 'no-upstream', match: /the current branch (\S+) has no upstream branch|has no upstream branch/i, title: 'This branch is not on GitHub yet',
    what: 'Your branch exists only on your computer, so Git does not know where to push it.',
    fix: ['git push -u origin {1}     # -u remembers origin as the upstream for next time'],
    avoid: 'git config --global push.autoSetupRemote true makes the first push set this up automatically.', risk: 'safe' },
  { id: 'src-refspec', match: /src refspec (\S+) does not match any/i, title: 'Nothing called "{1}" to push',
    what: 'Either there are no commits yet, or the branch has another name (often master instead of main).',
    fix: ['git branch                 # see your branch names', 'git log --oneline -1       # check there is at least one commit', 'git push -u origin HEAD    # push whatever branch you are on'],
    avoid: 'Make a first commit before pushing, and check the branch name with git branch.', risk: 'safe' },
  { id: 'detached-head', match: /detached HEAD|HEAD detached at/i, title: 'Detached HEAD',
    what: 'You checked out a commit (or tag) instead of a branch. New commits here belong to no branch.',
    fix: ['git switch -c my-work      # keep what you did here on a new branch', '# or, if you made no commits: git switch main'],
    avoid: 'Use git switch <branch> to move between branches; git switch --detach only to look around.', risk: 'safe' },
  { id: 'not-a-repo', match: /not a git repository/i, title: 'You are not inside a Git repository',
    what: 'The terminal is in a folder Git does not track (Git looks for a .git folder here or above).',
    fix: ['cd path/to/your/project     # go into the cloned project', '# or start tracking this folder: git init'],
    avoid: 'Run git status first; it tells you if you are in a repo.', risk: 'safe' },
  { id: 'unrelated-histories', match: /refusing to merge unrelated histories/i, title: 'The two histories have nothing in common',
    what: 'Usually you created a repo on GitHub with a README and also ran git init locally, so there are two first commits.',
    fix: ['git pull origin main --allow-unrelated-histories', '# fix any conflicts (often README.md), commit, then push'],
    avoid: 'Either clone the GitHub repo, or create the GitHub repo empty and push your local one.', risk: 'safe' },
  { id: 'publickey', match: /permission denied \(publickey\)/i, title: 'GitHub did not accept your SSH key',
    what: 'You are using an SSH URL but GitHub does not know your key (or your SSH agent is not offering it).',
    fix: ['ssh -T git@github.com                 # test the connection', 'ssh-keygen -t ed25519 -C "you@example.com"   # if you have no key yet', '# add the .pub key at github.com/settings/keys', '# or switch to HTTPS: git remote set-url origin https://github.com/OWNER/REPO.git'],
    avoid: 'Set up one method (SSH key or HTTPS with a token) and test it once.', risk: 'safe' },
  { id: 'auth-failed', match: /authentication failed for|support for password authentication was removed|invalid username or (password|token)/i, title: 'GitHub rejected your login',
    what: 'GitHub no longer accepts account passwords for Git over HTTPS; it needs a personal access token (or the GitHub CLI / credential manager).',
    fix: ['gh auth login              # easiest: GitHub CLI sets up credentials', '# or create a token at github.com/settings/tokens and use it as the password'],
    avoid: 'Use a credential manager so you sign in once.', risk: 'safe' },
  { id: 'push-403', match: /permission to (\S+) denied to (\S+)|requested url returned error: 403/i, title: 'You are not allowed to push here',
    what: 'You are signed in, but your account has no write access to {1}. For someone else\'s project you need a fork.',
    fix: ['# fork the repo on GitHub, then point origin at your fork:', 'git remote rename origin upstream', 'git remote add origin https://github.com/YOUR-NAME/REPO.git', 'git push -u origin <your-branch>'],
    avoid: 'For projects you do not own: fork first, push to your fork, open a pull request.', risk: 'safe' },
  { id: 'repo-not-found', match: /repository '([^']+)' not found|repository not found/i, title: 'Repository not found',
    what: 'The URL is wrong, the repo is private and you are not signed in with access, or it was renamed.',
    fix: ['git remote -v                                # check the URL', 'git remote set-url origin https://github.com/OWNER/REPO.git'],
    avoid: 'Copy the URL from the green Code button on GitHub.', risk: 'safe' },
  { id: 'remote-exists', match: /remote (\S+) already exists/i, title: 'That remote name is taken',
    what: 'A remote called {1} is already set up.',
    fix: ['git remote -v                                 # see where it points', 'git remote set-url {1} https://github.com/OWNER/REPO.git   # change it', '# or add the other one under a new name: git remote add upstream <url>'],
    avoid: 'Use origin for your copy and upstream for the original project.', risk: 'safe' },
  { id: 'pathspec', match: /pathspec '([^']+)' did not match any/i, title: 'Git cannot find "{1}"',
    what: 'No branch or tracked file is called {1} (check spelling and case), or the branch only exists on the remote.',
    fix: ['git branch -a             # list local and remote branches', 'git fetch                 # get branches that exist only on GitHub', 'git switch {1}            # works once it exists on origin'],
    avoid: 'Use Tab completion for branch and file names.', risk: 'safe' },
  { id: 'not-mergeable', match: /merge: (\S+) - not something we can merge/i, title: 'Nothing called "{1}" to merge',
    what: 'The branch name is wrong or it only exists on the remote and you have not fetched it.',
    fix: ['git fetch', 'git branch -a', 'git merge origin/{1}      # if it is a remote branch'],
    avoid: 'Fetch first, then merge the exact name shown by git branch -a.', risk: 'safe' },
  { id: 'branch-exists', match: /a branch named '([^']+)' already exists/i, title: 'Branch "{1}" already exists',
    what: 'You tried to create a branch whose name is taken.',
    fix: ['git switch {1}            # use the existing branch', '# or pick another name: git switch -c {1}-2'],
    avoid: 'git branch lists existing names.', risk: 'safe' },
  { id: 'delete-checked-out', match: /cannot delete branch '([^']+)' checked out/i, title: 'You cannot delete the branch you are on',
    what: 'You are currently on {1}.',
    fix: ['git switch main', 'git branch -d {1}'],
    avoid: 'Switch away from a branch before deleting it.', risk: 'safe' },
  { id: 'not-fully-merged', match: /the branch '([^']+)' is not fully merged/i, title: 'Branch "{1}" has unmerged commits',
    what: 'Deleting it would lose commits that are not on your current branch. Git protects them.',
    fix: ['git log --oneline main..{1}   # see what would be lost', 'git branch -D {1}             # only if you really do not need them (they stay in the reflog for a while)'],
    avoid: 'Merge or push a branch before deleting it.', risk: 'can_lose_work' },
  { id: 'nothing-to-commit', match: /nothing to commit, working tree clean|no changes added to commit/i, title: 'Nothing staged to commit',
    what: 'Either you have no changes, or you changed files but did not stage them with git add.',
    fix: ['git status                 # see what changed', 'git add <file>             # or git add . for everything', 'git commit -m "Describe the change"'],
    avoid: 'git status before git commit shows what will go in.', risk: 'safe' },
  { id: 'index-lock', match: /index\.lock'?: file exists|unable to create '[^']*index\.lock'/i, title: 'Another Git process seems to be running',
    what: 'Git found a lock file. Usually an editor or a crashed Git command left it behind.',
    fix: ['# close other Git tools/editors, then, if no git command is running:', 'rm .git/index.lock         # Windows: del .git\\index.lock'],
    avoid: 'Let one Git command finish before starting another.', risk: 'safe' },
  { id: 'who-are-you', match: /please tell me who you are|unable to auto-detect email address/i, title: 'Git needs your name and email',
    what: 'Every commit records an author, and Git has not been told yours yet.',
    fix: ['git config --global user.name "Your Name"', 'git config --global user.email "you@example.com"   # use your GitHub email to link commits to your profile'],
    avoid: 'Set this once per computer.', risk: 'safe' },
  { id: 'dubious-ownership', match: /detected dubious ownership/i, title: 'Git does not trust this folder\'s owner',
    what: 'The repo folder is owned by another user account (common on shared drives, WSL or containers).',
    fix: ['git config --global --add safe.directory <path-to-repo>   # only for folders you trust'],
    avoid: 'Clone into a folder your own user owns.', risk: 'safe' },
  { id: 'crlf', match: /LF will be replaced by CRLF|CRLF will be replaced by LF/i, title: 'Just a line-ending warning',
    what: 'Windows and Linux end lines differently; Git is telling you it will convert them. Your commit is fine.',
    fix: ['git config --global core.autocrlf true    # Windows: the usual setting', '# or add a .gitattributes file with: * text=auto'],
    avoid: 'Agree on line endings in .gitattributes for the whole team.', risk: 'safe' },
  { id: 'rpc-failed', match: /RPC failed|early EOF|unexpected disconnect while reading sideband/i, title: 'The connection dropped during a big transfer',
    what: 'The network or proxy cut off a large push or clone.',
    fix: ['# retry on a stable connection; for a huge clone:', 'git clone --depth 1 <url>     # just the latest commit', 'git fetch --unshallow         # later, get the rest'],
    avoid: 'Keep large files out of the repo.', risk: 'safe' },
];

export interface Diagnosis {
  rule: GitErrorRule;
  answer: string;
}

const RISK_LABEL: Record<Risk, string> = { safe: 'Safe', rewrites_history: 'Rewrites history', can_lose_work: 'Can lose work' };
/** Looks like pasted Git/terminal output rather than a question in words. */
const LOOKS_LIKE_OUTPUT = /(^|\n)\s*(fatal|error|hint|warning|remote|To |! \[|CONFLICT|Auto-merging|Permission denied|Your branch|You are in)\b|\bgit (push|pull|merge|rebase|commit|checkout|switch|clone)\b.*\n/i;

export function diagnose(text: string): Diagnosis | null {
  if (text.length > 6000) return null;
  for (const rule of GIT_ERRORS) {
    const m = rule.match.exec(text);
    if (!m) continue;
    // short questions that merely mention a topic ("what is a detached HEAD?") go to the tutor
    const verbatim = LOOKS_LIKE_OUTPUT.test(text) || m[0].length >= 16 || /'[^'\s]+'|"[^"]+"|\(|\[|:/.test(text);
    if (!verbatim) return null;
    const fill = (s: string): string => s.replace(/\{(\d)\}/g, (_, n: string) => (m[Number(n)] ?? '').replace(/[`$\\]/g, '') || '<name>');
    const answer = [
      `**What happened:** ${fill(rule.what)}`,
      '',
      `**Fix it** (${RISK_LABEL[rule.risk]}):`,
      '```bash',
      ...rule.fix.map(fill),
      '```',
      '',
      `**Next time:** ${rule.avoid}`,
    ].join('\n');
    return { rule: { ...rule, title: fill(rule.title) }, answer };
  }
  return null;
}
