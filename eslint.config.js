const { defineConfig } = require('eslint-define-config');
const gtsConfig = require('gts/src/eslint'); // <-- import GTS config object directly

module.exports = defineConfig([
  gtsConfig, // include GTS rules directly
  {
    parserOptions: {
      parser: '@typescript-eslint/parser',
      project: './tsconfig.eslint.json',
      tsconfigRootDir: __dirname,
      sourceType: 'module',
    },
    ignorePatterns: ['./node_modules'],
    overrides: [
      {
        files: ['vite.config.ts'],
        parserOptions: { project: null },
      },
    ],
  },
]);
