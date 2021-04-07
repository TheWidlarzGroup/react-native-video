"use strict";

const path = require('path');
const blacklist = require('metro').createBlacklist;

const rootProjectDir = path.resolve(__dirname, '..', '..')

module.exports = {
  // Resolve react-native-fast-video from parent directory so we do not have to install react-native-fast-video after each change applied
  getBlacklistRE: function() {
    return blacklist([/node_modules\/react-native-fast-video\/.*/, new RegExp(`${rootProjectDir}/node_modules/react-native/.*`)])
  },
  getProjectRoots() {
    return [
      __dirname,
      rootProjectDir
    ]
  }
};
