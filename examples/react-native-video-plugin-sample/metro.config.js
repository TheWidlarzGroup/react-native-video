const path = require('path');

module.exports = {
  projectRoot: __dirname,
  watchFolders: [
    path.resolve(__dirname, '../../node_modules'),
    path.resolve(__dirname, '../..'),
  ],
  resolver: {
    extraNodeModules: {
      'react-native-video-plugin-sample': __dirname,
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
