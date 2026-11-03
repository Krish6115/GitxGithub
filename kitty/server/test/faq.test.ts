import { describe, expect, it } from 'vitest';
import { createFaqMatcher, type FaqEntry } from '../src/tutor/faq.js';
import { streamTutor, type TutorEvent } from '../src/tutor/service.js';
import { createMockProvider } from '../src/llm/mock.js';

const entry = (id: string, questions: string[]): FaqEntry => ({
  id,
  questions,
  answer: `**Situation:** answer for ${id} [1].`,
  sources: [{ n: 1, title: 'Pro Git', headingPath: ['Reset'], sourceFile: 'Git/references/reset-demystified.md', sourceUrl: 'https://git-scm.com/book', license: 'CC BY-NC-SA 3.0' }],
});
const faq = createFaqMatcher([
  entry('undo-last-commit-keep', ['How do I undo my last commit but keep the changes?', 'undo last commit keep changes', 'I committed too early, how do I uncommit and keep my work?']),
  entry('undo-pushed-commit', ['How do I undo a commit I already pushed?', 'undo a pushed commit safely']),
  entry('fetch-vs-pull', ["What's the difference between git fetch and git pull?", 'fetch vs pull']),
  entry('sync-fork', ['How do I sync my fork with upstream?', 'update my fork with the original repository']),
]);
const id = (q: string, history = [] as { role: 'user' | 'assistant'; content: string }[]) => faq.match(q, history)?.id ?? null;

describe('instant answers', () => {
  it('matches the same question in other words', () => {
    expect(id('how do i undo my last commit but keep my changes')).toBe('undo-last-commit-keep');
    expect(id('Undo the last commit and keep changes?')).toBe('undo-last-commit-keep');
    expect(id('git fetch vs git pull')).toBe('fetch-vs-pull');
    expect(id('How can I sync my fork with the upstream repo?')).toBe('sync-fork');
  });

  it('does not match different questions, follow-ups, or questions about the page or tour', () => {
    expect(id('How do I undo a merge?')).toBeNull();
    expect(id('How do I rebase onto main?')).toBeNull();
    expect(id('undo last commit keep changes', [{ role: 'user', content: 'hi' }])).toBeNull();
    expect(id('How do I undo the last commit in this PR?')).toBeNull();
    expect(id('Why does this step matter?')).toBeNull();
    expect(id('Find me an issue about docker')).toBeNull();
  });

  it('tells look-alike questions apart by the word only one of them uses', () => {
    const m = createFaqMatcher([
      entry('rename-branch', ['How do I rename a branch?', 'rename a local and remote branch']),
      entry('delete-branch', ['How do I delete a branch locally and on GitHub?', 'delete a remote branch']),
    ]);
    // never the wrong saved answer (with so few entries it may play safe and use the model instead)
    expect(m.match('How do I rename a branch, locally and on GitHub?', [])?.id).not.toBe('delete-branch');
    expect(m.match('How do I rename a branch?', [])?.id).toBe('rename-branch');
    expect(m.match('how to delete a branch on github', [])?.id).toBe('delete-branch');
  });

  it('answers instantly with the saved sources and no model call', async () => {
    const provider = createMockProvider();
    const events: TutorEvent[] = [];
    for await (const ev of streamTutor({ provider, retrieve: () => [], faq }, { question: 'fetch vs pull', history: [] })) events.push(ev);
    expect(events.map((e) => e.type)).toEqual(['sources', 'delta', 'done']);
    expect(events[2]).toMatchObject({ type: 'done', instant: true, usage: null });
  });
});
