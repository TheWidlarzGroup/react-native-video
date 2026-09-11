module.exports = {
  root: true,
  extends: ['../config/.eslintrc.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: true,
  },
  // Tests run under `bun test` and import bun:test, which the RN tsconfig does not know.
  ignorePatterns: ['rnv-e2e-plugin.mjs', '*.test.mjs', '*.test.ts'],
};
