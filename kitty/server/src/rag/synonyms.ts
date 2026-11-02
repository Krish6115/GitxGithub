// Query-time expansion from learner phrasing to the vocabulary used in the docs.
// Expanded terms are added to the query with a lower weight than the learner's own words.

interface Synonym {
  when: RegExp;
  add: string;
}

const SYNONYMS: Synonym[] = [
  { when: /\b(undo|unstage|uncommit|go back|take back|roll ?back|mistake)\b/, add: 'revert reset restore reflog' },
  { when: /\b(lost|deleted|recover|get back)\b.*\b(commit|branch|work)s?\b/, add: 'reflog recover' },
  { when: /\b(temporar(il)?y|shelve|set aside|park|save (my )?(work|changes))\b/, add: 'stash' },
  { when: /\b(combine|squash|merge together|clean up)\b.*\bcommits?\b|\bsquash/, add: 'squash rebase interactive fixup' },
  { when: /\b(edit|change|fix|reword)\b.*\b(last|previous|commit) (commit|message)\b/, add: 'amend reword' },
  { when: /\b(copy|apply|port|backport|move)\b.*\b(one|single|a|specific)?\s*commit\b/, add: 'cherry-pick' },
  { when: /\bwho (changed|wrote|modified|added)\b|\bauthor of (a |this |that )?line/, add: 'blame' },
  { when: /\b(which|what) commit (broke|introduced|caused)\b|\b(bad|broken|buggy) commit\b|\bregression\b/, add: 'bisect' },
  { when: /\bprs?\b|\bpull[- ]?requests?\b/, add: 'pull request' },
  { when: /\b(review|reviewer|approve|approval)\b/, add: 'review pull request comment' },
  { when: /\btokens?\b|\bpat\b|\bpassword\b|\blog ?in\b|\bauth/, add: 'personal access token authentication credential' },
  { when: /\bssh\b|\bkeys?\b/, add: 'ssh key ssh-keygen' },
  { when: /\bci\b|\bpipelines?\b|\bworkflows?\b|continuous integration|\bautomat/, add: 'actions workflow' },
  { when: /\bignor/, add: '.gitignore' },
  { when: /\b(sync|update|catch up|behind|out of date)\b.*\bfork|\bfork\b.*\b(sync|update|behind)|\bupstream\b/, add: 'upstream fork fetch sync' },
  { when: /\b(large|big|huge|binary) files?\b/, add: 'lfs large file storage' },
  { when: /\b(two|multiple|several) branches\b.*\b(once|same time|simultaneous)|\bworktrees?\b/, add: 'worktree' },
  { when: /\bsign(ed|ing)?\b|\bverified\b|\bgpg\b/, add: 'signing signature gpg verified' },
  { when: /\bconflicts?\b/, add: 'conflict markers resolve' },
  { when: /\b(secret|leak|leaked|password|api key|credentials?)\b|\.env\b/, add: 'sensitive data remove filter-repo rotate' },
  { when: /\bprotect/, add: 'branch protection rules rulesets' },
  { when: /\bforce[- ]?push|\boverwrit/, add: '--force --force-with-lease' },
  { when: /\b(new|unfamiliar|someone else'?s|existing|open source) (repo|repository|codebase|project)\b|\bunderstand (a |the |this )?(repo|codebase|project)/, add: 'readme navigating code contributors dependency' },
  { when: /\bcontribut|\bfirst (pr|pull request|contribution)\b|\bopen source\b/, add: 'contributing open source fork' },
  { when: /\bhooks?\b|\bpre-commit\b|\bbefore (each|every) commit\b/, add: 'hooks pre-commit' },
  { when: /\bsubmodules?\b|\bnested repo|\brepo inside (a |another )?repo/, add: 'submodule' },
  { when: /\bhead\b|\bdetached\b/, add: 'head reference detached' },
  { when: /\bdelete\b.*\bbranch|\bremove\b.*\bbranch/, add: 'branch -d --delete' },
  { when: /\brename\b.*\bbranch/, add: 'branch -m' },
  { when: /\btag|\brelease|\bversion\b/, add: 'tag release annotated' },
  { when: /\bhistory\b|\blog\b|\bpast commits\b/, add: 'log history' },
  { when: /\binternals?\b|\bunder the hood\b|\bobjects?\b|\bblob|\bhow (does )?git (store|work)/, add: 'objects blob tree commit internals' },
  { when: /\bremote\b|\borigin\b/, add: 'remote origin tracking' },
  { when: /\bissues?\b|\bbug report|\btemplate/, add: 'issues template' },
  { when: /\bclean\b.*\buntracked|\buntracked files?\b/, add: 'clean untracked' },
  { when: /\bstag(e|ing)\b.*\b(part|some lines|hunk)|\bpartial(ly)?\b/, add: 'interactive staging patch hunk' },
];

/** Extra query text for the learner's question (empty when nothing matches). */
export function expandQuery(query: string): string {
  const q = query.toLowerCase();
  return SYNONYMS.filter((s) => s.when.test(q)).map((s) => s.add).join(' ');
}
