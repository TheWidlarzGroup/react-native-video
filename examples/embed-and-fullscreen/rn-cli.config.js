const blacklist = require('metro').createBlacklist;

module.exports = {
  getBlacklistRE: function() {
    return blacklist([/node_modules\/react-native-fast-video\/examples\/.*/]);
  }
};
