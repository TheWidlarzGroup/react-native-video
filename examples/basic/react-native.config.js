const fs = require('fs');
const path = require('path');
module.exports = {
  reactNativePath:  fs.realpathSync(path.resolve(require.resolve('react-native-windows/package.json'), '..')),
  dependencies: {
      'react-native-video-inc-ads': {
        platforms: {
          android: {
            sourceDir:
              '../node_modules/react-native-video-inc-ads/android-exoplayer',
          },
        },
      },
    },
};
