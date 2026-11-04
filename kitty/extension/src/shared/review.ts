// Spaced review for quiz questions (a Leitner box per skill): right answers come back later and later, wrong ones
// come back tomorrow. "Git health" summarises how much of the path you have explored and how well it has stuck.
// Stored only in this browser.
import { SKILLS, type Progress, type Skill } from './skills';

export const REVIEW_KEY = 'kitty:review';
/** Days until the next review for each box (0 = new or just missed). */
export const INTERVALS = [1, 2, 4, 8, 16] as const;
export const MAX_BOX = INTERVALS.length - 1;

export interface Card {
  box: number;
  /** Day number (days since epoch) when it is due again. */
  due: number;
  right: number;
  wrong: number;
}
export type Review = Record<string, Card>;

export const today = (now = Date.now()): number => Math.floor(now / 86_400_000);

export function answer(r: Review, skill: string, correct: boolean, day = today()): Review {
  const c = r[skill] ?? { box: 0, due: day, right: 0, wrong: 0 };
  const box = correct ? Math.min(MAX_BOX, c.box + 1) : 0;
  return { ...r, [skill]: { box, due: day + (INTERVALS[box] ?? 1), right: c.right + (correct ? 1 : 0), wrong: c.wrong + (correct ? 0 : 1) } };
}

export const dueSkills = (r: Review, day = today()): string[] =>
  Object.entries(r).filter(([, c]) => c.due <= day).sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due).map(([id]) => id);

/**
 * The next quiz: due reviews first (weakest first), then skills you asked about but never tested,
 * then the start of the path. Choices are shuffled; the first listed choice is the right one.
 */
export function nextQuiz(p: Progress, r: Review, rand: () => number = Math.random, n = 3, day = today()): { skill: Skill; choices: string[]; answer: string; review: boolean }[] {
  const byId = new Map(SKILLS.map((s) => [s.id, s]));
  const due = dueSkills(r, day).flatMap((id) => byId.get(id) ?? []);
  const untested = SKILLS.filter((s) => (p[s.id] ?? 0) > 0 && !r[s.id]);
  const fresh = SKILLS.filter((s) => !r[s.id]);
  const pool: Skill[] = [];
  for (const s of [...due, ...untested, ...fresh]) if (pool.length < n && !pool.includes(s)) pool.push(s);
  return pool.map((skill) => {
    const choices = [...skill.quiz.choices];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [choices[i], choices[j]] = [choices[j] as string, choices[i] as string];
    }
    return { skill, choices, answer: skill.quiz.choices[0], review: due.includes(skill) };
  });
}

/** 0-100: every skill counts a quarter once explored and the rest as its review box grows. */
export function gitHealth(p: Progress, r: Review): number {
  let total = 0;
  for (const s of SKILLS) {
    const c = r[s.id];
    const explored = (p[s.id] ?? 0) > 0 || Boolean(c);
    total += explored ? 0.25 + 0.75 * ((c?.box ?? 0) / MAX_BOX) : 0;
  }
  return Math.round((total / SKILLS.length) * 100);
}
