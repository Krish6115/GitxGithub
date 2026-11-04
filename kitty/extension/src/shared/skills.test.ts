import { describe, expect, it } from 'vitest';
import { explored, nextSkill, recordTopics, SKILLS, topicsOf } from './skills';

describe('Git path', () => {
  it('has a consistent path: unique ids, known prerequisites, four different choices', () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SKILLS) {
      for (const n of s.needs) expect(ids.indexOf(n)).toBeLessThan(ids.indexOf(s.id));
      expect(new Set(s.quiz.choices).size).toBe(4);
      expect(s.match.test(s.starter)).toBe(true); // asking the starter question counts as exploring it
    }
  });

  it('maps chat questions to skills', () => {
    expect(topicsOf('How do I undo my last commit?')).toEqual(expect.arrayContaining(['commit', 'undo']));
    expect(topicsOf('how do I resolve a merge conflict')).toEqual(expect.arrayContaining(['merge', 'conflicts']));
    expect(topicsOf('what is sourdough')).toEqual([]);
  });

  it('suggests the next skill whose prerequisites are explored', () => {
    expect(nextSkill({})?.id).toBe('basics');
    let p = recordTopics({}, 'what does git status do');
    expect(nextSkill(p)?.id).toBe('commit');
    p = recordTopics(p, 'how do I commit');
    expect(nextSkill(p)?.id).toBe('history');
    expect(explored(p).map((s) => s.id)).toEqual(['basics', 'commit']);
    const all = Object.fromEntries(SKILLS.map((s) => [s.id, 1]));
    expect(nextSkill(all)).toBeNull();
  });
});
