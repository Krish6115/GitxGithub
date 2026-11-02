import { defineConfig } from 'vitest/config';

// Every project runs with network access disabled (test/no-network.ts); tests inject fake fetch implementations.
const setupFiles = ['./test/no-network.ts'];

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      { test: { name: 'server', include: ['server/test/**/*.test.ts'], environment: 'node', setupFiles } },
      { test: { name: 'ingest', include: ['ingest/test/**/*.test.ts'], environment: 'node', setupFiles } },
      { test: { name: 'extension', include: ['extension/src/**/*.test.{ts,tsx}'], environment: 'node', setupFiles } },
    ],
  },
});
