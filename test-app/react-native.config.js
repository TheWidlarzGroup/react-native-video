const { configureProjects } = require("react-native-test-app");

module.exports = {
  project: configureProjects({
    android: {
      sourceDir: "android",
    },
    ios: {
      sourceDir: "ios",
    },
  }),
};
