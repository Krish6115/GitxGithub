import { describe, expect, it } from 'vitest';
import { cleanRewrite, rewriteQuery, worthRewriting } from '../src/rag/rewrite.js';
import type { RetrievedChunk } from '../src/rag/retrieve.js';
import { streamTutor, WEAK_SCORE, type TutorEvent } from '../src/tutor/service.js';
import { collect, scripted } from './fixtures/provider.js';

const chunk = (title: string, score: number): RetrievedChunk => ({ id: title, title, headingPath: [], sourceFile: `${title}.md`, sourceUrl: `https://example.com/${title}`, license: 'x', text: title, score } as unknown as RetrievedChunk);

describe('query rewrite', () => {
  it('keeps short keyword lines and drops NONE or chatty replies', () => {
    expect(cleanRewrite('amend, reset; undo last commit\n')).toBe('amend reset undo last commit');
    expect(cleanRewrite('NONE')).toBeNull();
    expect(cleanRewrite('Sure! Here are some keywords you could use for searching the documentation about this topic today')).toBeNull();
    expect(worthRewriting('i messed up my last save')).toBe(true);
    expect(worthRewriting('rebase')).toBe(false);
  });

  it('asks the model with no reasoning and a tiny budget, and survives failures', async () => {
    const p = scripted('amend reset');
    expect(await rewriteQuery(p, 'i messed up my last save')).toBe('amend reset');
    expect(p.reqs[0]).toMatchObject({ reasoningEffort: 'none', maxTokens: 60 });
    const broken = { ...p, stream: () => { throw new Error('down'); } };
    expect(await rewriteQuery(broken, 'i messed up my last save')).toBeNull();
  });

  it('searches again with the rewritten terms only when the first search is weak', async () => {
    const queries: string[] = [];
    const retrieve = (q: string): RetrievedChunk[] => (queries.push(q), q.startsWith('amend') ? [chunk('amend', WEAK_SCORE + 50)] : [chunk('noise', WEAK_SCORE - 5)]);
    let asked = 0;
    const evs = await collect<TutorEvent>(streamTutor({ provider: scripted('answer'), retrieve, rewrite: async () => (asked++, 'amend reset') }, { question: 'i messed up my last save', history: [] }));
    expect(asked).toBe(1);
    expect(queries[1]).toBe('amend reset i messed up my last save');
    expect(evs[0]).toMatchObject({ type: 'sources', weak: false, sources: [{ title: 'amend' }] });

    asked = 0;
    await collect<TutorEvent>(streamTutor({ provider: scripted('answer'), retrieve: () => [chunk('good', WEAK_SCORE + 100)], rewrite: async () => (asked++, 'x') }, { question: 'how do i amend my last commit', history: [] }));
    expect(asked).toBe(0);
  });
});
