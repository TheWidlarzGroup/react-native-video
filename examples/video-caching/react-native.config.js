const path = require('path');

const project = (() => {
  try {
    const { iosProjectPath } = require("react-native-test-app");
    const project = iosProjectPath(".");
    return project
      ? {
          ios: {
            project,
          },
        }
      : undefined;
  } catch (_) {
    return undefined;
  }
})();

module.exports = {
  ...(project ? { project } : undefined),
  dependencies: {
    'react-native-video': {
      root: path.join(__dirname, '../../'),
    },
  },
};
