// "Your first contribution": one checklist from picking an issue to a merged PR. It ties together Kitty's issue
// finder, fix walkthrough, PR check and conflict rescue, and links each step to its lesson. Stored in this browser.
import { useEffect, useState } from 'preact/hooks';
import { contributionPlan } from '../shared/contribute';
import { LEARN_FOCUS_KEY, type LearnFocus } from '../shared/learn';
import { Markdown } from '../shared/Markdown';
import { TOUR_STATE_KEY, type TourState } from '../shared/tour';
import { useLocal } from './QuizCard';
import { stepsDoneBy } from '../shared/first-pr';
import { SKILLS } from '../shared/skills';
import { Icon } from '../shared/Icon';

export const FIRST_PR_KEY = 'kitty:first-pr';
interface FirstPr {
  done: Record<string, boolean>;
  issue?: { repo: string; number: number; title: string; url: string; defaultBranch: string };
  login?: string;
}

interface Step {
  id: string;
  title: string;
  how: string;
  lesson?: string;
}
export const FIRST_PR_STEPS: Step[] = [
  { id: 'pick', title: 'Pick a good first issue', how: 'Open a repository you use, click the cat and choose **Find a good first issue**, then **Help me fix this** on one you like. Kitty fills in the steps below.' },
  { id: 'claim', title: 'Ask to work on it', how: 'Comment on the issue, e.g. "Hi! I would like to work on this. My plan is …". Wait for a maintainer to say yes, so two people don\'t fix the same thing.' },
  { id: 'fork', title: 'Fork, clone and add upstream', how: 'Click **Fork** on GitHub, then run the first commands below.', lesson: 'forks' },
  { id: 'branch', title: 'Create a branch for the fix', how: 'Never work on main: one branch per issue keeps your PR clean.', lesson: 'branches' },
  { id: 'change', title: 'Make the change and run the tests', how: 'Follow Kitty\'s walkthrough of the files to change. Run the project\'s tests (see How to run in the tour panel) before committing.' },
  { id: 'commit', title: 'Commit with a clear message', how: 'Say what changed, and add "Fixes #N" so the issue closes when the PR merges.', lesson: 'commit' },
  { id: 'push', title: 'Push and open the pull request', how: 'Push your branch, then use the link below to open the PR form. Fill in the template.', lesson: 'remotes' },
  { id: 'check', title: 'Run Kitty\'s PR check', how: 'On your PR page, click the cat → **Check my PR**. Fix what it flags; **Draft description** can write the description for you.' },
  { id: 'review', title: 'Answer the review', how: 'Push fixes to the same branch: the PR updates itself. If main moved on, rebase (the PR check gives exact commands, including a conflict rescue).', lesson: 'rebase' },
  { id: 'merged', title: 'Merged', how: 'Delete your branch, sync your fork, and pick the next issue.' },
];

export function FirstPrView() {
  const [state, setState] = useLocal<FirstPr>(FIRST_PR_KEY, { done: {} });
  const [tour, setTour] = useState<TourState | null>(null);
  useEffect(() => void chrome.storage.session.get(TOUR_STATE_KEY).then((r) => setTour((r[TOUR_STATE_KEY] as TourState | undefined) ?? null)), []);
  // an issue walkthrough ("Help me fix this") picks the issue for you
  const tourIssue = tour?.result.meta.issue;
  useEffect(() => {
    if (!tour || !tourIssue || state.issue?.url === tourIssue.url) return;
    setState({
      ...state,
      issue: { repo: `${tour.owner}/${tour.repo}`, number: tourIssue.number, title: tourIssue.title, url: tourIssue.url, defaultBranch: tour.result.meta.defaultBranch ?? 'main' },
      ...(tour.login ? { login: tour.login } : {}),
      done: { ...state.done, pick: true },
    });
  }, [tourIssue?.url]);
  // tick steps the page you're on proves are done (your fork, a compare page, your pull request)
  useEffect(() => {
    const check = (): void => void chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => {
      const done = tab?.url ? stepsDoneBy(tab.url, state.issue, state.login) : [];
      if (done.some((id) => !state.done[id])) setState({ ...state, done: { ...state.done, ...Object.fromEntries(done.map((id) => [id, true])) } });
    });
    check();
    const onUpdated = (_id: number, info: { status?: string }): void => { if (info.status === 'complete') check(); };
    chrome.tabs.onActivated.addListener(check);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(check);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [state.issue?.repo, state.issue?.number, state.login, JSON.stringify(state.done)]);
  const issue = state.issue;
  const [owner = '', repo = ''] = issue?.repo.split('/') ?? [];
  const plan = issue ? contributionPlan({ owner, repo, defaultBranch: issue.defaultBranch, issue, login: state.login }) : null;
  const doneCount = FIRST_PR_STEPS.filter((s) => state.done[s.id]).length;
  const next = FIRST_PR_STEPS.find((s) => !state.done[s.id]);
  const toggle = (id: string): void => setState({ ...state, done: { ...state.done, [id]: !state.done[id] } });
  const lesson = (skill: string): void => void chrome.storage.session.set({ [LEARN_FOCUS_KEY]: { view: 'lessons', skill } satisfies LearnFocus });
  const lines = plan?.commands.split('\n') ?? [];
  const extra: Record<string, string[]> = plan
    ? { fork: lines.slice(0, lines.findIndex((l) => l.startsWith('git switch -c'))), branch: lines.filter((l) => l.startsWith('git switch -c')), commit: lines.filter((l) => l.startsWith('git add') || l.startsWith('git commit')), push: lines.filter((l) => l.startsWith('git push')) }
    : {};
  return (
    <div class="first-pr" data-kitty="first-pr">
      <p><strong>Your first contribution</strong> · {doneCount} of {FIRST_PR_STEPS.length} steps</p>
      <div class="path-bar" aria-hidden="true"><span style={{ width: `${Math.round((doneCount / FIRST_PR_STEPS.length) * 100)}%` }} /></div>
      {issue ? (
        <p class="small">Working on <a href={issue.url} target="_blank" rel="noopener noreferrer"><strong>{issue.repo}#{issue.number}</strong> {issue.title}</a></p>
      ) : (
        <p class="small muted">No issue picked yet: step 1 shows how.</p>
      )}
      <ol class="checklist">
        {FIRST_PR_STEPS.map((s) => (
          <li key={s.id} class={state.done[s.id] ? 'done' : s === next ? 'current' : ''} data-step={s.id}>
            <label class="check">
              <input type="checkbox" checked={Boolean(state.done[s.id])} onChange={() => toggle(s.id)} />
              <strong>{s.title}</strong>
            </label>
            {s === next && (
              <div class="step-how">
                <Markdown text={s.how} sources={[]} />
                {extra[s.id]?.length ? <Markdown text={['```bash', ...(extra[s.id] ?? []), '```'].join('\n')} sources={[]} /> : null}
                {s.id === 'push' && plan && <p><a href={plan.prUrl} target="_blank" rel="noopener noreferrer">Open the pull request form →</a></p>}
                {s.lesson && <button class="ghost small" onClick={() => lesson(s.lesson as string)}><Icon name="book" size={12} /> Lesson: {SKILLS.find((k) => k.id === s.lesson)?.title}</button>}
              </div>
            )}
          </li>
        ))}
      </ol>
      <div class="row"><button class="ghost small" onClick={() => setState({ done: {} })}>Start over</button></div>
    </div>
  );
}
