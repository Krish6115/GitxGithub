import { describe, expect, it } from 'vitest';
import type { Pull } from '../src/github/client.js';
import { draftPr } from '../src/github/draft-pr.js';
import type { ChatRequest, Provider, StreamEvent } from '../src/llm/types.js';
import { fakeGitHub, fixtureRepo } from './fixtures/repo.js';

function replies(...texts: string[]): Provider & { reqs: ChatRequest[] } {
  const reqs: ChatRequest[] = [];
  return {
    name: 'bharatcode', reqs,
    chat: async () => { throw new Error('unused'); },
    async *stream(req): AsyncGenerator<StreamEvent> {
      const text = texts[reqs.length] ?? '';
      reqs.push(req);
      yield { type: 'delta', text };
      yield { type: 'done', result: { text, finishReason: 'stop', truncated: false, usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }, model: 'x' } };
    },
  };
}

const pull: Pull = {
  number: 9, title: 'update db.js', body: '', html_url: 'https://github.com/acme/todo-api/pull/9', state: 'open', merged: false, draft: false,
  mergeable_state: 'clean', additions: 3, deletions: 1, changed_files: 1, commits: 1, maintainer_can_modify: true, user: { login: 'newbie' },
  head: { ref: 'fix/42-empty-db', sha: 'h'.repeat(40), repo: { full_name: 'newbie/todo-api' } }, base: { ref: 'main', sha: '', repo: { full_name: 'acme/todo-api' } },
};
const issue = { number: 42, title: 'Routes crash on empty db', body: 'Repro: start with no data.', html_url: 'https://github.com/acme/todo-api/issues/42', state: 'open', comments: 0, created_at: '', updated_at: '', labels: [], assignees: [] };
const repo = (files: Record<string, string> = {}) => {
  const f = fixtureRepo({ issues: [issue], pull: { pull, files: [{ filename: 'src/db.js', status: 'modified', additions: 3, deletions: 1, patch: '@@ -1 +1,3 @@\n-export const db = new Map();\n+export const db = new Map([[1, {}]]);' }], commits: [{ sha: 'a'.repeat(40), commit: { message: 'seed db' }, parents: [] }] } });
  f.files = { ...f.files, ...files };
  return f;
};
const good = JSON.stringify({ title: 'fix: seed the db so routes work when empty', description: '## What\nSeeds the Map.\n\nFixes #42', commit_message: 'fix: seed the db\n\nFixes #42' });

describe('draftPr', () => {
  it('writes a draft from the diff, commits and the issue linked by the branch name', async () => {
    const provider = replies(good);
    const r = await draftPr({ github: fakeGitHub(repo()), provider }, 'acme', 'todo-api', 9);
    expect(r.title).toBe('fix: seed the db so routes work when empty');
    expect(r.usage?.totalTokens).toBe(150);
    const prompt = provider.reqs[0]?.messages.at(-1)?.content ?? '';
    expect(prompt).toMatch(/<<<UNTRUSTED_REPO_CONTENT \w+ linked-issue>>>\n#42: Routes crash on empty db/);
    expect(prompt).toContain('+export const db = new Map([[1, {}]]);');
    expect(prompt).toContain('- seed db');
    expect(provider.reqs[0]?.reasoningEffort).toBe('none');
  });

  it('follows the PR template and Conventional Commits when the repo asks for them', async () => {
    const provider = replies(good);
    const r = await draftPr({ github: fakeGitHub(repo({ '.github/pull_request_template.md': '## Summary\n## Checklist\n- [ ] Tests', 'CONTRIBUTING.md': 'We use Conventional Commits.' })), provider }, 'acme', 'todo-api', 9);
    expect(r).toMatchObject({ conventional: true, usedTemplate: true });
    expect(provider.reqs[0]?.messages[0]?.content).toContain('follows the PR TEMPLATE');
    expect(provider.reqs[0]?.messages[0]?.content).toContain('Conventional Commits style');
  });

  it('repairs once, then gives up with a clear error', async () => {
    const repaired = replies('Sure! here you go', good);
    expect((await draftPr({ github: fakeGitHub(repo()), provider: repaired }, 'acme', 'todo-api', 9)).title).toContain('seed');
    expect(repaired.reqs).toHaveLength(2);
    await expect(draftPr({ github: fakeGitHub(repo()), provider: replies('nope', '{"title": "x"}') }, 'acme', 'todo-api', 9)).rejects.toMatchObject({ code: 'invalid_model_output' });
  });
});
