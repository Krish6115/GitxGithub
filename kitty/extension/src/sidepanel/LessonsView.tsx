// Guided lessons: pick a skill from the Git path and go Situation -> Commands -> Try it -> Check.
// Progress and quiz results stay in this browser.
import { useEffect, useState } from 'preact/hooks';
import { lessonFor, LESSONS_KEY, STEPS, type LessonProgress } from '../shared/lessons';
import { CHAT_DRAFT_KEY, SIDEPANEL_TAB_KEY } from '../shared/messages';
import { answer, gitHealth, REVIEW_KEY, type Review } from '../shared/review';
import { nextSkill, SKILLS, type Skill } from '../shared/skills';
import { Markdown } from '../shared/Markdown';
import { QuizCard, useLocal } from './QuizCard';
import { useSkills } from './LearningPath';

/** Ask the cited tutor about this skill in the chat tab. */
const readMore = (question: string): void => {
  void chrome.storage.session.set({ [CHAT_DRAFT_KEY]: question, [SIDEPANEL_TAB_KEY]: 'chat' });
};

function Lesson({ skill, saved, onProgress, onPractice, onBack }: { skill: Skill; saved: number; onProgress: (n: number) => void; onPractice: (scenario: string) => void; onBack: () => void }) {
  const lesson = lessonFor(skill.id);
  // a finished lesson reopens at the start (to re-read); an unfinished one where you left it
  const [step, setLocal] = useState(saved >= STEPS.length ? 0 : saved);
  const finished = saved >= STEPS.length;
  const setStep = (n: number): void => {
    setLocal(Math.min(n, STEPS.length - 1));
    onProgress(n);
  };
  const [review, setReview] = useLocal<Review>(REVIEW_KEY, {});
  if (!lesson) return null;
  const at = Math.min(step, STEPS.length - 1);
  return (
    <div class="lesson" data-kitty="lesson">
      <p class="muted small"><a href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>← All lessons</a></p>
      <h3>{skill.title}</h3>
      <ol class="lesson-steps">
        {STEPS.map((s, i) => <li key={s} class={i === at ? 'current' : i < step ? 'done' : ''}>{s}</li>)}
      </ol>
      {at === 0 && <p>{lesson.scenario}</p>}
      {at === 1 && (
        <>
          <Markdown text={['```bash', ...lesson.commands, '```'].join('\n')} sources={[]} />
          <p>{lesson.why}</p>
        </>
      )}
      {at === 2 && (
        lesson.practice ? (
          <>
            <p>Try it in a safe, simulated repo: nothing you type touches a real project.</p>
            <button data-kitty="lesson-practice" onClick={() => onPractice(lesson.practice as string)}>🧪 Open in Practice</button>
          </>
        ) : (
          <>
            <p>Try these commands in one of your own repositories, then come back for the check.</p>
            <button class="ghost" onClick={() => readMore(skill.starter)}>Ask Kitty to walk me through it</button>
          </>
        )
      )}
      {at === 3 && (
        <QuizCard
          skill={skill}
          onAnswer={(ok) => {
            setReview(answer(review, skill.id, ok));
            if (ok) setStep(STEPS.length);
          }}
        />
      )}
      <div class="row">
        {at > 0 && <button class="ghost small" onClick={() => setStep(at - 1)}>Back</button>}
        {at < STEPS.length - 1 && <button class="small" data-kitty="lesson-next" onClick={() => setStep(at + 1)}>Next</button>}
        <button class="ghost small" onClick={() => readMore(skill.starter)}>Read more (with sources)</button>
      </div>
      {finished && <p class="solved" data-kitty="lesson-done">✅ Lesson complete. It will come back in a review quiz in a few days.</p>}
    </div>
  );
}

export function LessonsView({ skill, onPractice }: { skill?: string | undefined; onPractice: (scenario: string) => void }) {
  const [progress, setProgress] = useLocal<LessonProgress>(LESSONS_KEY, {});
  const [review] = useLocal<Review>(REVIEW_KEY, {});
  const { progress: asked } = useSkills();
  const [open, setOpen] = useState<string | null>(skill ?? null);
  useEffect(() => { if (skill) setOpen(skill); }, [skill]);
  const current = SKILLS.find((s) => s.id === open);
  if (current) {
    return <Lesson key={current.id} skill={current} saved={progress[current.id] ?? 0} onProgress={(n) => setProgress({ ...progress, [current.id]: Math.max(n, progress[current.id] ?? 0) })} onPractice={onPractice} onBack={() => setOpen(null)} />;
  }
  const done = SKILLS.filter((s) => (progress[s.id] ?? 0) >= STEPS.length).length;
  const next = SKILLS.find((s) => (progress[s.id] ?? 0) < STEPS.length && s.needs.every((n) => (progress[n] ?? 0) >= STEPS.length)) ?? nextSkill(asked);
  return (
    <div class="lessons" data-kitty="lessons">
      <p><strong>Git health: {gitHealth(asked, review)}/100</strong> · {done} of {SKILLS.length} lessons done</p>
      {next && <p>Up next: <button class="chip" data-kitty="lesson-next-skill" onClick={() => setOpen(next.id)}>{next.title}</button></p>}
      <ol class="lesson-list">
        {SKILLS.map((s) => {
          const p = progress[s.id] ?? 0;
          const locked = !s.needs.every((n) => (progress[n] ?? 0) >= STEPS.length || (asked[n] ?? 0) > 0);
          return (
            <li key={s.id}>
              <button class="ghost step" onClick={() => setOpen(s.id)}>
                {p >= STEPS.length ? '✅' : p > 0 ? '▶️' : locked ? '🔒' : '○'} {s.title}
              </button>
            </li>
          );
        })}
      </ol>
      <p class="muted small">🔒 lessons build on earlier ones, but you can open any of them.</p>
    </div>
  );
}
