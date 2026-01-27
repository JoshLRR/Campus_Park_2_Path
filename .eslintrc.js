module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  extends: ['gts-typescript'],
  ignorePatterns: ['node_modules/'],
  overrides: [
    {
      files: ['vite.config.ts'],
      parserOptions: {project: null},
    },
  ],
};
