// Learn more https://docs.expo.io/guides/customizing-metro
const {getDefaultConfig} = require('expo/metro-config');
const path = require('path');
const blacklist = require('metro-config/src/defaults/exclusionList');
const escape = require('escape-string-regexp');

const config = getDefaultConfig(__dirname);

// When enabled, the optional code below will allow Metro to resolve
// and bundle source files with TV-specific extensions
// (e.g., *.ios.tv.tsx, *.android.tv.tsx, *.tv.tsx)
//
// Metro will still resolve source files with standard extensions
// as usual if TV-specific files are not found for a module.
if (process.env?.EXPO_TV === '1') {
  const originalSourceExts = config.resolver.sourceExts;
  const tvSourceExts = [
    ...originalSourceExts.map((e) => `tv.${e}`),
    ...originalSourceExts,
  ];
  config.resolver.sourceExts = tvSourceExts;
}

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '../..');
const pak = require('../../package.json');
const modules = Object.keys({...pak.peerDependencies});

// Watch the
config.watchFolders = [repoRoot, path.resolve(projectRoot, '../..')];

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

// We need to make sure that only one version is loaded for peerDependencies
// So we block them at the root, and alias them to the versions in example's node_modules
config.resolver.blacklistRE = blacklist([
  ...modules.map(
    (name) =>
      new RegExp(`^${escape(path.join(repoRoot, 'node_modules', name))}\\/.*$`),
  ),
]);

module.exports = config;
