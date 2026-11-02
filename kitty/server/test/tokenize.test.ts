import { describe, expect, it } from 'vitest';
import { processTerm, stem, terms, tokenize } from '../src/rag/tokenize.js';
import { expandQuery } from '../src/rag/synonyms.js';

describe('tokenize', () => {
  it('keeps git flags, revisions and special refs as single tokens', () => {
    const t = tokenize('Run git push --force-with-lease, then git reset HEAD~1 or HEAD^ and git switch @{-1}.');
    expect(t).toEqual(expect.arrayContaining(['--force-with-lease', 'HEAD~1', 'HEAD^', '@{-1}']));
    expect(t).not.toContain('force');
  });

  it('indexes compound commands whole and as parts', () => {
    const t = tokenize('Use git cherry-pick on origin/main, or compare main..feature');
    expect(t).toEqual(expect.arrayContaining(['cherry-pick', 'cherry', 'pick', 'origin/main', 'origin', 'main..feature', 'feature']));
  });

  it('keeps dotfiles and strips sentence punctuation', () => {
    expect(tokenize('Edit your .gitignore. Done!')).toEqual(['Edit', 'your', '.gitignore', 'Done']);
  });
});

describe('processTerm / stem', () => {
  it('drops stopwords and stems plain words consistently', () => {
    expect(processTerm('the')).toBeNull();
    expect(['merge', 'merging', 'merged', 'merges'].map(stem)).toEqual(['merg', 'merg', 'merg', 'merg']);
    expect(['commit', 'commits', 'committed', 'committing'].map(stem)).toEqual(['commit', 'commit', 'commit', 'commit']);
    expect(['branch', 'branches'].map(stem)).toEqual(['branch', 'branch']);
    expect(stem('pull')).toBe('pull');
  });

  it('never stems flags or revisions', () => {
    expect(processTerm('--Force-With-Lease')).toBe('--force-with-lease');
    expect(processTerm('HEAD~1')).toBe('head~1');
  });

  it('terms() combines tokenize and processTerm', () => {
    expect(terms('How do I undo the last commits?')).toEqual(['undo', 'last', 'commit']);
  });
});

describe('expandQuery', () => {
  it('maps learner phrasing to doc vocabulary', () => {
    expect(expandQuery('How do I undo my last commit?')).toContain('revert');
    expect(expandQuery('save my work temporarily')).toContain('stash');
    expect(expandQuery('who changed this line?')).toContain('blame');
    expect(expandQuery('what is rebase')).toBe('');
  });
});
