const { makeMetroConfig } = require('@rnx-kit/metro-config');

const path = require('path');

module.exports = makeMetroConfig({
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  // Resolve modules from the root of the monorepo
  resolver: {
    extraNodeModules: ['../node_modules'],
  },
  // Watch the root of the monorepo (local react-native-video files)
  watchFolders: [path.resolve(__dirname, '..')],
});
