module.exports = {
  dependency: {
    platforms: {
      windows: {
        sourceDir: 'windows\\VideoPluginSample',
        solutionFile: 'VideoPluginSample.vcxproj',
        projects: [
          {
            projectFile: 'VideoPluginSample.vcxproj',
            directDependency: true,
          },
        ],
      },
    },
  },
};
