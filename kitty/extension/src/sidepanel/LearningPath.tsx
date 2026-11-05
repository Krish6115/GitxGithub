// Git path helpers: the skills a learner has asked about, the spaced-review quiz, and the chat's one-line summary.
// Progress lives only in this browser (chrome.storage.local) and is never sent to the server.
import { useEffect, useState } from 'preact/hooks';
import { explored, nextSkill, recordTopics, SKILLS, SKILLS_KEY, type Progress } from '../shared/skills';
import { answer, dueSkills, gitHealth, nextQuiz, REVIEW_KEY, type Review } from '../shared/review';
import { QuizCard, useLocal } from './QuizCard';
import { Icon } from '../shared/Icon';

export function useSkills(): { progress: Progress; reset: () => void } {
  const [progress, setProgress] = useState<Progress>({});
  useEffect(() => {
    void chrome.storage.local.get(SKILLS_KEY).then((r) => setProgress((r[SKILLS_KEY] as Progress | undefined) ?? {}));
    const onChange = (c: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'local' && SKILLS_KEY in c) setProgress((c[SKILLS_KEY]?.newValue as Progress | undefined) ?? {});
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);
  return { progress, reset: () => void chrome.storage.local.remove(SKILLS_KEY) };
}

export function Quiz({ progress, onDone }: { progress: Progress; onDone: () => void }) {
  const [review, setReview] = useLocal<Review>(REVIEW_KEY, {});
  const [items] = useState(() => nextQuiz(progress, review));
  const [results, setResults] = useState<Record<number, boolean>>({});
  const right = Object.values(results).filter(Boolean).length;
  const finished = Object.keys(results).length === items.length;
  let latest = review;
  return (
    <div class="quiz" data-kitty="quiz">
      {items.some((x) => x.review) && <p class="small muted"><Icon name="history" size={12} /> Includes questions due for review.</p>}
      {items.map((x, i) => (
        <QuizCard
          key={x.skill.id}
          skill={x.skill}
          choices={x.choices}
          label={`${i + 1}. `}
          onAnswer={(ok) => {
            latest = answer(latest, x.skill.id, ok);
            setReview(latest);
            setResults((r) => ({ ...r, [i]: ok }));
          }}
        />
      ))}
      {finished && <p><strong>{right} of {items.length} right.</strong> {right === items.length ? 'All correct.' : 'Missed ones come back tomorrow.'} Git health: {gitHealth(progress, latest)}/100</p>}
      <div class="row"><button class="ghost small" onClick={onDone}>{finished ? 'Done' : 'Close quiz'}</button></div>
    </div>
  );
}

/** Count the skills a chat question is about (local only). */
export async function noteQuestion(question: string): Promise<void> {
  const r = await chrome.storage.local.get(SKILLS_KEY);
  const before = (r[SKILLS_KEY] as Progress | undefined) ?? {};
  const after = recordTopics(before, question);
  if (after !== before) await chrome.storage.local.set({ [SKILLS_KEY]: after });
}

/** One line on the chat start screen: Git health, reviews due, and a way into the Learn tab. */
export function PathSummary() {
  const { progress } = useSkills();
  const [review] = useLocal<Review>(REVIEW_KEY, {});
  const due = dueSkills(review).length;
  const next = nextSkill(progress);
  const open = (): void => void chrome.storage.session.set({ 'kitty:sidepanel-tab': 'learn' });
  return (
    <div class="path-summary" data-kitty="path-summary">
      <span><Icon name="mortar-board" size={14} /> Git health <strong>{gitHealth(progress, review)}/100</strong>{due ? ` · ${due} review${due > 1 ? 's' : ''} due` : next ? ` · next: ${next.title}` : ''}</span>
      <button class="ghost small" data-kitty="open-learn" onClick={open}>{due ? 'Review now' : 'Open lessons'}</button>
    </div>
  );
}
