const { defineConfig } = require('eslint-define-config');
const gts = require('gts');

let ignores = [];
let customConfig = [];
let hasIgnoresFile = false;
try {
  require.resolve('./eslint.ignores.js');
  hasIgnoresFile = true;
} catch {
  // eslint.ignores.js doesn't exist
}

if (hasIgnoresFile) {
  const ignores = require('./eslint.ignores.js');
  customConfig = [{ignores}];
}

// Main ESLint config

module.exports = defineConfig({
  ...gts,
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: './tsconfig.eslint.json', // include src + vite.config.ts
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  ignorePatterns: ignores,
  overrides: [
    {
      files: ['vite.config.ts'],
      parserOptions: {project: null},
    },
  ],
});
