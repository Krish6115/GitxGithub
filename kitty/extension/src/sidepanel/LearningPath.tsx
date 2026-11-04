// "Your Git path" card in the chat: skills explored so far, the next one to learn, and a 3-question quiz.
// Progress lives only in this browser (chrome.storage.local) and is never sent to the server.
import { useEffect, useState } from 'preact/hooks';
import { explored, nextSkill, quizFor, recordTopics, SKILLS, SKILLS_KEY, type Progress } from '../shared/skills';

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
  const [items] = useState(() => quizFor(progress));
  const [picked, setPicked] = useState<Record<number, string>>({});
  const right = items.filter((x, i) => picked[i] === x.answer).length;
  const finished = Object.keys(picked).length === items.length;
  return (
    <div class="quiz" data-kitty="quiz">
      {items.map((x, i) => (
        <div key={x.skill.id} class="quiz-q">
          <p><strong>{i + 1}. {x.skill.quiz.q}</strong></p>
          {x.choices.map((c) => {
            const chosen = picked[i];
            const cls = chosen === undefined ? '' : c === x.answer ? 'right' : c === chosen ? 'wrong' : '';
            return (
              <button key={c} class={`choice ${cls}`} disabled={chosen !== undefined} onClick={() => setPicked((p) => ({ ...p, [i]: c }))}>{c}</button>
            );
          })}
          {picked[i] !== undefined && <p class="small muted">{picked[i] === x.answer ? '✅ ' : '❌ '}{x.skill.quiz.why}</p>}
        </div>
      ))}
      {finished && <p><strong>{right} of {items.length} right.</strong> {right === items.length ? 'Nice! 🐾' : 'Ask Kitty about the ones you missed.'}</p>}
      <div class="row"><button class="ghost small" onClick={onDone}>{finished ? 'Done' : 'Close quiz'}</button></div>
    </div>
  );
}

export function LearningPath({ onAsk }: { onAsk: (question: string) => void }) {
  const { progress, reset } = useSkills();
  const [quiz, setQuiz] = useState(false);
  const done = explored(progress);
  const next = nextSkill(progress);
  return (
    <details class="learning-path" data-kitty="learning-path" open={done.length > 0 ? undefined : true}>
      <summary>🎓 Your Git path · {done.length} of {SKILLS.length} skills explored</summary>
      <div class="path-bar" aria-hidden="true"><span style={{ width: `${Math.round((done.length / SKILLS.length) * 100)}%` }} /></div>
      {next ? (
        <p>
          Next: <strong>{next.title}</strong>{' '}
          <button class="chip" data-kitty="next-skill" onClick={() => onAsk(next.starter)}>{next.starter}</button>
        </p>
      ) : (
        <p>You've explored every skill on the path. 🎉</p>
      )}
      {done.length > 0 && <p class="small muted">Explored: {done.map((s) => s.title).join(' · ')}</p>}
      {quiz ? (
        <Quiz progress={progress} onDone={() => setQuiz(false)} />
      ) : (
        <div class="row">
          <button class="ghost small" data-kitty="quiz-me" onClick={() => setQuiz(true)}>Quiz me (3 questions)</button>
          {done.length > 0 && <button class="ghost small" onClick={reset}>Reset</button>}
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
