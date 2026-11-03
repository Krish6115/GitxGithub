import { describe, expect, it } from 'vitest';
import { draftStep, planSteps } from '../src/github/plan.js';
import { rankFiles } from '../src/github/rank.js';

const blob = (path: string, size = 4000) => ({ path, type: 'blob' as const, size });
const tree = [
  'README.md', 'package.json', 'tsconfig.json', '.github/workflows/ci.yml', 'src/index.ts',
  'src/router/trie.ts', 'src/router/node.ts', 'src/middleware/cors.ts', 'src/middleware/etag.ts', 'src/adapter/bun.ts',
  'src/utils/url.ts', 'test/router.test.ts', 'docs/ARCHITECTURE.md',
].map((p) => blob(p));

describe('instant tour plan', () => {
  it('orders steps README, manifest, entry point, core (one per folder), tests, CI', () => {
    const plan = planSteps(rankFiles(tree, 25), 9).map((f) => f.path);
    expect(plan.slice(0, 3)).toEqual(['README.md', 'package.json', 'src/index.ts']);
    expect(plan.slice(-2)).toEqual(['test/router.test.ts', '.github/workflows/ci.yml']);
    const core = plan.slice(3, -2);
    expect(new Set(core.map((p) => p.split('/').slice(0, -1).join('/'))).size).toBe(core.length); // all different folders
    expect(plan).toHaveLength(9);
  });

  it('writes a readable placeholder for each kind of file', () => {
    const [readme, manifest] = planSteps(rankFiles(tree, 25), 5).map(draftStep);
    expect(readme).toMatchObject({ title: 'Start with the README', draft: true });
    expect(manifest?.what).toMatch(/Node\.js manifest/);
  });
});
