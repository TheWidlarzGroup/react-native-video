const { makeMetroConfig } = require("@rnx-kit/metro-config");
const path = require("path");

// react-native-video resolves to the workspace package at ../packages/react-native-video
// (a real symlink via bun workspaces, hoisted into the repo root's node_modules) — Metro
// needs the monorepo root watched so its node_modules walk finds it and its own hoisted
// deps (react-native-nitro-modules etc).
const monorepoRoot = path.resolve(__dirname, "..");

module.exports = makeMetroConfig({
  watchFolders: [monorepoRoot],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
});
