import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
    'src/__tests__/**/*.test.ts',
    'database/__tests__/**/*.test.ts',
  ],
    exclude: ['build/**', 'node_modules/**'],
  },
  esbuild: {
    tsconfigRaw: undefined,
  },
});
