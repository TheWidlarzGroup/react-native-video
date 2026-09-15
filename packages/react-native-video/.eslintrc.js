module.exports = {
  root: true,
  extends: ["../../config/.eslintrc.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './tsconfig.web.json'],
  },
  // Unit tests run under `bun test` and are not part of the build tsconfigs.
  ignorePatterns: ['__tests__/'],
};
