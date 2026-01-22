const project = (() => {
  try {
    const {configureProjects} = require('react-native-test-app');
    return configureProjects({
      android: {
        sourceDir: 'android',
      },
      ios: {
        sourceDir: 'ios',
      },
    });
  } catch (_) {
    return undefined;
  }
})();

module.exports = {
  ...(project ? {project} : undefined),
  // Disable react-native-video autolink for Windows (Win32 apps need manual loading)
  dependencies: {
    'react-native-video': {
      platforms: {
        windows: null,
      },
    },
  },
  project: {
    ...project,
    windows: {
      sourceDir: 'windows',
      solutionFile: 'BareExampleApp.sln',
      project: {
        projectFile: 'BareExampleApp/BareExampleApp.vcxproj',
      },
    },
  },
};
