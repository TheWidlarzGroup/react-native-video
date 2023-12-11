/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path');
const escape = require('escape-string-regexp');

const blacklist = require('metro-config/src/defaults/exclusionList');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const pak = require('../../package.json');
const root = path.resolve(__dirname, '../..');
const modules = Object.keys({...pak.peerDependencies});

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],
  resolver: {
    blacklistRE: blacklist([
      // This stops "react-native run-windows" from causing the metro server to crash if its already running
      new RegExp(
        `${path.resolve(__dirname, 'windows').replace(/[/\\]/g, '/')}.*`,
      ),
      // This prevents "react-native run-windows" from hitting: EBUSY: resource busy or locked, open msbuild.ProjectImports.zip
      /.*\.ProjectImports\.zip/,
      /(.*\/react-native-video\/node_modules\/.*)$/,

      // We need to make sure that only one version is loaded for peerDependencies
      // So we block them at the root, and alias them to the versions in example's node_modules
      ...modules.map(
        name =>
          new RegExp(`^${escape(path.join(root, 'node_modules', name))}\\/.*$`),
      ),
    ]),
    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
