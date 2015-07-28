'use strict';

var keyMirror = require('keymirror');

var VideoResizeMode = keyMirror({
  contain: null,
  cover: null,
  stretch: null,
});

module.exports = VideoResizeMode;
