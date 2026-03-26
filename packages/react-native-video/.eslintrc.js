module.exports = {
  root: true,
  extends: ["../../config/.eslintrc.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './tsconfig.web.json'],
  },
};
