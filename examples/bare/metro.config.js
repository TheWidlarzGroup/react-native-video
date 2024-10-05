const path = require('path');
const {makeMetroConfig} = require('@rnx-kit/metro-config');

module.exports = makeMetroConfig({
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  resolver: {
    enableSymlinks: true,
  },
  watchFolders: [
    path.join(__dirname, 'node_modules', 'react-native-video'),
    path.resolve(__dirname, '../..'),
  ],
});
