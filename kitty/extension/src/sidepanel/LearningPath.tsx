// "Your Git path" card in the chat: skills explored so far, the next one to learn, and a 3-question quiz.
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

function Quiz({ progress, onDone }: { progress: Progress; onDone: () => void }) {
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

export function LearningPath({ onAsk }: { onAsk: (question: string) => void }) {
  const { progress, reset } = useSkills();
  const [quiz, setQuiz] = useState(false);
  const [review] = useLocal<Review>(REVIEW_KEY, {});
  const due = dueSkills(review).length;
  const done = explored(progress);
  const next = nextSkill(progress);
  return (
    <details class="learning-path" data-kitty="learning-path" open={done.length > 0 ? undefined : true}>
      <summary><Icon name="mortar-board" /> Your Git path · {done.length} of {SKILLS.length} skills explored · health {gitHealth(progress, review)}/100</summary>
      <div class="path-bar" aria-hidden="true"><span style={{ width: `${Math.round((done.length / SKILLS.length) * 100)}%` }} /></div>
      {next ? (
        <p>
          Next: <strong>{next.title}</strong>{' '}
          <button class="chip" data-kitty="next-skill" onClick={() => onAsk(next.starter)}>{next.starter}</button>
        </p>
      ) : (
        <p>You've explored every skill on the path.</p>
      )}
      {done.length > 0 && <p class="small muted">Explored: {done.map((s) => s.title).join(' · ')}</p>}
      {quiz ? (
        <Quiz progress={progress} onDone={() => setQuiz(false)} />
      ) : (
        <div class="row">
          <button class="ghost small" data-kitty="quiz-me" onClick={() => setQuiz(true)}>{due ? `Review quiz (${due} due)` : 'Quiz me (3 questions)'}</button>
          <button class="ghost small" onClick={() => void chrome.storage.session.set({ 'kitty:sidepanel-tab': 'learn' })}>Open lessons</button>
          {done.length > 0 && <button class="ghost small" onClick={() => { reset(); void chrome.storage.local.remove(REVIEW_KEY); }}>Reset</button>}
        </div>
      )}
      <p class="small muted">Kept only in this browser.</p>
    </details>
  );
}

/** Count the skills a chat question is about (local only). */
export async function noteQuestion(question: string): Promise<void> {
  const r = await chrome.storage.local.get(SKILLS_KEY);
  const before = (r[SKILLS_KEY] as Progress | undefined) ?? {};
  const after = recordTopics(before, question);
  if (after !== before) await chrome.storage.local.set({ [SKILLS_KEY]: after });
}
