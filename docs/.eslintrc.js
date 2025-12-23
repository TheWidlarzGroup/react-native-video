module.exports = {
  root: true,
  extends: ["../config/.eslintrc.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: true,
  },
  plugins: ['@widlarzgroup/docusaurus'],
  settings: {
    '@widlarzgroup/docusaurus': {
      extend: ['src/css/custom.css'],
    },
  },
  overrides: [
    {
      files: ['**/*.css'],
      processor: '@widlarzgroup/docusaurus/.css',
    },
  ],
};
