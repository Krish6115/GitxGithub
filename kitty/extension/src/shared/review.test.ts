import { describe, expect, it } from 'vitest';
import { LESSONS } from './lessons';
import { scenarioById, scenarioFor } from './practice-scenarios';
import { WRONG_NOTES, wrongNote } from './quiz-notes';
import { answer, dueSkills, gitHealth, INTERVALS, nextQuiz } from './review';
import { SKILLS } from './skills';

const DAY = 20_000;

describe('spaced review', () => {
  it('moves right answers to later boxes and sends wrong ones back to tomorrow', () => {
    let r = answer({}, 'rebase', true, DAY);
    expect(r.rebase).toMatchObject({ box: 1, due: DAY + INTERVALS[1], right: 1 });
    r = answer(r, 'rebase', true, DAY + 2);
    expect(r.rebase?.box).toBe(2);
    r = answer(r, 'rebase', false, DAY + 6);
    expect(r.rebase).toMatchObject({ box: 0, due: DAY + 7, wrong: 1 });
  });

  it('quizzes due reviews first (weakest first), then asked-about skills, then the path start', () => {
    const r = { stash: { box: 3, due: DAY - 1, right: 3, wrong: 0 }, undo: { box: 0, due: DAY, right: 0, wrong: 1 }, basics: { box: 4, due: DAY + 9, right: 5, wrong: 0 } };
    expect(dueSkills(r, DAY)).toEqual(['undo', 'stash']);
    const q = nextQuiz({ forks: 1 }, r, () => 0.5, 3, DAY);
    expect(q.map((x) => x.skill.id)).toEqual(['undo', 'stash', 'forks']);
    expect(q[0]?.review).toBe(true);
    expect(q[2]?.review).toBe(false);
    for (const x of q) expect(x.choices).toContain(x.answer);
  });

  it('scores Git health from explored skills and review boxes', () => {
    expect(gitHealth({}, {})).toBe(0);
    const all = Object.fromEntries(SKILLS.map((s) => [s.id, { box: 4, due: 0, right: 4, wrong: 0 }]));
    expect(gitHealth({}, all)).toBe(100);
    expect(gitHealth({ basics: 1 }, {})).toBe(Math.round((0.25 / SKILLS.length) * 100));
  });
});

describe('lessons and notes', () => {
  it('has a lesson for every skill, and practice links that exist', () => {
    expect(LESSONS.map((l) => l.skill).sort()).toEqual(SKILLS.map((s) => s.id).sort());
    for (const l of LESSONS) if (l.practice) expect(scenarioById(l.practice)).toBeDefined();
  });

  it('explains every wrong answer', () => {
    for (const s of SKILLS) {
      expect(WRONG_NOTES[s.id]).toHaveLength(3);
      expect(wrongNote(s.id, s.quiz.choices, s.quiz.choices[2])).toBe(WRONG_NOTES[s.id]?.[1]);
      expect(wrongNote(s.id, s.quiz.choices, s.quiz.choices[0])).toBeUndefined();
    }
  });

  it('offers the matching practice scenario for chat topics', () => {
    expect(scenarioFor('how do I undo my last commit?')?.id).toBe('undo-commit');
    expect(scenarioFor('how do I undo a pushed commit?')?.id).toBe('revert-pushed');
    expect(scenarioFor('my push was rejected')?.id).toBe('rejected-push');
    expect(scenarioFor('I lost commits after reset --hard')?.id).toBe('recover-reset');
    expect(scenarioFor('what is a fork?')).toBeUndefined();
  });
});
