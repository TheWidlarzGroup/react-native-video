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
