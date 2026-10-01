module.exports = {
  root: true,
  extends: ["../../config/.eslintrc.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    // tsconfig.test.json covers __tests__/, which the build tsconfigs leave out.
    project: ['./tsconfig.json', './tsconfig.web.json', './tsconfig.test.json'],
  },
};
