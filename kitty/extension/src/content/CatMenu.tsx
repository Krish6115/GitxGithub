// The cat's menu: at most four actions, chosen for the page you're on (a failed CI run, an issue, a pull request,
// a repository, or anywhere else on GitHub).

export interface MenuActions {
  onCi: () => void;
  onFixIssue: () => void;
  onPreflight: () => void;
  onPrTour: () => void;
  onTour: () => void;
  onFindIssues: () => void;
  onGuides: () => void;
  onAsk: () => void;
}

interface Props {
  repo: { owner: string; repo: string } | null;
  issueNo: number | null;
  prNo: number | null;
  ciRun: boolean;
  chatHint: boolean;
  act: MenuActions;
}

export function CatMenu({ repo, issueNo, prNo, ciRun, chatHint, act }: Props) {
  const name = repo ? `${repo.owner}/${repo.repo}` : '';
  let intro: preact.ComponentChildren;
  let items: { id: string; label: string; run: () => void }[];
  if (repo && ciRun) {
    intro = <>This run failed. I can find the error in the log and explain the fix.</>;
    items = [{ id: 'ci-explain', label: 'Why did this fail?', run: act.onCi }, { id: 'show-me-how', label: 'Show me how…', run: act.onGuides }];
  } else if (repo && issueNo) {
    intro = <>Want help fixing <strong>issue #{issueNo}</strong>? I'll walk you through the files to change and give you the exact git commands.</>;
    items = [{ id: 'fix-this-issue', label: 'Help me fix this issue', run: act.onFixIssue }, { id: 'start-tour', label: 'Tour this repo', run: act.onTour }];
  } else if (repo && prNo) {
    intro = <>I can check <strong>PR #{prNo}</strong> for what maintainers usually send back, or walk you through its changes.</>;
    items = [
      { id: 'preflight', label: 'Check my PR', run: act.onPreflight },
      { id: 'pr-tour', label: 'Tour the changes', run: act.onPrTour },
      { id: 'show-me-how', label: 'Show me how…', run: act.onGuides },
    ];
  } else if (repo) {
    intro = <>New to <strong>{name}</strong>? I can walk you through it, find you a first issue, or show you around GitHub.</>;
    items = [
      { id: 'start-tour', label: 'Tour this repo', run: act.onTour },
      { id: 'find-issues', label: 'Find a good first issue', run: act.onFindIssues },
      { id: 'show-me-how', label: 'Show me how…', run: act.onGuides },
    ];
  } else {
    intro = <>Open a repository for a tour, or ask me anything about Git.</>;
    items = [];
  }
  return (
    <div class="bubble menu">
      <p>{intro}</p>
      <div class="row">
        {items.map((it, i) => (
          <button key={it.id} class={i === 0 ? '' : 'ghost'} data-kitty={it.id} onClick={it.run}>{it.label}</button>
        ))}
        <button class={items.length ? 'ghost' : ''} data-kitty="ask" onClick={act.onAsk}>Ask Kitty a Git question</button>
      </div>
      {chatHint && <p class="hint">Click the Kitty icon in the toolbar to open the chat.</p>}
    </div>
  );
}
