module.exports = {
  project: {
    windows: {
      sourceDir: 'windows',
      solutionFile: 'video-plugin-sample-demo.sln',
      project: {
        projectFile: 'VideoPluginSampleDemo\\VideoPluginSampleDemo.vcxproj',
      },
    },
  },
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
