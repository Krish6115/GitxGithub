import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      { test: { name: 'server', include: ['server/test/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'ingest', include: ['ingest/test/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'extension', include: ['extension/src/**/*.test.{ts,tsx}'], environment: 'node' } },
    ],
  },
});
