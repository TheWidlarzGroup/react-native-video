/* eslint-disable @typescript-eslint/no-var-requires */
// Learn more https://docs.expo.io/guides/customizing-metro

const {getDefaultConfig} = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '../..');
const pak = require('../../package.json');
const modules = Object.keys({...pak.peerDependencies});

// Watch the root folder
config.watchFolders = [repoRoot];

// Add the root node_modules to the resolver's search path
config.resolver.nodeModulesPaths = [
  path.resolve(path.join(__dirname, './node_modules')),
  path.resolve(path.join(__dirname, '../../node_modules')),
];

// We need to make sure that only one version is loaded for peerDependencies
// So we block them at the root, and alias them to the versions in example's node_modules
config.resolver.extraNodeModules = modules.reduce((acc, name) => {
  acc[name] = path.join(__dirname, 'node_modules', name);
  return acc;
}, {});

// Block peer dependencies from root node_modules to avoid version conflicts
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = modules.map(
  (name) =>
    new RegExp(
      `^${escapeRegex(path.join(repoRoot, 'node_modules', name))}\\/.*$`,
    ),
);

module.exports = config;
