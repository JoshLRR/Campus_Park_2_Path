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

const gtsConfig = require('gts');

const tsProjectOverride = {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.eslint.json'],
      tsconfigRootDir: __dirname,
    },
  },
};

module.exports = [...customConfig, ...gtsConfig, tsProjectOverride];
