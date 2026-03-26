module.exports = {
  root: true,
  extends: ["../config/.eslintrc.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: true,
  },
  ignorePatterns: ["web/webpack.config.js", "index.web.js"],
};
