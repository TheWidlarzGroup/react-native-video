/* eslint-disable @typescript-eslint/no-var-requires */

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
});

let assetPrefix = '';
let basePath = '';

module.exports = withNextra({
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix,
  basePath,
});
