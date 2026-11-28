module.exports = {
  root: true,
  extends: ['../config/.eslintrc.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    // tsconfig.test.json covers the bun:test suites the RN tsconfig excludes.
    project: ['./tsconfig.json', './tsconfig.test.json'],
  },
  ignorePatterns: ['rnv-e2e-plugin.mjs', '*.test.mjs'],
};
