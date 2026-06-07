/**
 * vitest.stryker.config.ts
 *
 * Vitest config used only by Stryker mutation runs (see stryker.config.json).
 * Mirrors vitest.config.ts but drops `database/__tests__`, whose CLI tests
 * call `process.chdir()` — unsupported in the worker threads Stryker runs
 * tests in, and unrelated to the `src/logic` mutation target anyway.
 */

import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    exclude: ['build/**', 'node_modules/**'],
  },
  esbuild: {
    tsconfigRaw: undefined,
  },
});
