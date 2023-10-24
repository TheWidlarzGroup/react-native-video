/* eslint-disable @typescript-eslint/no-var-requires */

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
});

let assetPrefix = '';
let basePath = '';

// If we're in a GitHub Action, we need to set the assetPrefix and basePath
// to add repo_name to the path.
// eg. https://<organization>.github.io/<repo_name>
if (process.env.GITHUB_ACTIONS) {
  const repo_name = 'react-native-video';

  assetPrefix = `/${repo_name}/`;
  basePath = `/${repo_name}`;
}

module.exports = withNextra({
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix,
  basePath,
});
