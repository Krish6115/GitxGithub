// One quiz question with shuffled choices, the right answer highlighted, and why a wrong pick is wrong.
// Also: useLocal, a tiny chrome.storage.local-backed state hook shared by the learning views.
import { useEffect, useState } from 'preact/hooks';
import { wrongNote } from '../shared/quiz-notes';
import type { Skill } from '../shared/skills';

export function useLocal<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    void chrome.storage.local.get(key).then((r) => r[key] !== undefined && setValue(r[key] as T));
    const onChange = (c: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'local' && key in c) setValue((c[key]?.newValue as T | undefined) ?? initial);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, [key]);
  const set = (v: T): void => {
    setValue(v);
    void chrome.storage.local.set({ [key]: v });
  };
  return [value, set];
}

const shuffle = (xs: readonly string[]): string[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as string, a[i] as string];
  }
  return a;
};

export function QuizCard({ skill, choices: given, label, onAnswer }: { skill: Skill; choices?: string[]; label?: string; onAnswer: (correct: boolean) => void }) {
  const [choices] = useState(() => given ?? shuffle(skill.quiz.choices));
  const [picked, setPicked] = useState<string | null>(null);
  const right = skill.quiz.choices[0];
  const note = picked && picked !== right ? wrongNote(skill.id, skill.quiz.choices, picked) : undefined;
  return (
    <div class="quiz-q" data-kitty="quiz-card">
      <p><strong>{label}{skill.quiz.q}</strong></p>
      {choices.map((c) => {
        const cls = picked === null ? '' : c === right ? 'right' : c === picked ? 'wrong' : '';
        return (
          <button key={c} class={`choice ${cls}`} disabled={picked !== null} onClick={() => { setPicked(c); onAnswer(c === right); }}>{c}</button>
        );
      })}
      {picked !== null && (
        <p class="small muted">
          {picked === right ? '✅ ' : `❌ ${note ? `${note} ` : ''}`}{skill.quiz.why}
        </p>
      )}
    </div>
  );
}
