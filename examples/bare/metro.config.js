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
    // Add support for ../common by including it in extraNodeModules
    extraNodeModules: {
      common: path.resolve(__dirname, '../common'),
      'react-native-video': path.resolve(__dirname, '../../lib/'),
      '@react-native-picker/picker': path.resolve(__dirname, 'node_modules/@react-native-picker/picker'),
    },
  },
  watchFolders: [
    path.join(__dirname, 'node_modules', 'react-native-video'),
    path.resolve(__dirname, '../..'),
    path.resolve(__dirname, '../common'),
  ],
});
