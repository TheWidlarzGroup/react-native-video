module.exports = {
  dependencies: {
    'react-native-video': {
      root: __dirname,
    },
  },
  project: {
    android: {
      sourceDir: './example/android',
    },
    ios: {
      project: './example/ios/example.xcodeproj',
    },
  },
};
