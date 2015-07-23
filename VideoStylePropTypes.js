'use strict';

var VideoResizeMode = require('./VideoResizeMode');

// As of 0.7.0-rc.2 these cause warnings, but are not yet exposed via the public
// react-native interface yet.
var ViewStylePropTypes = require('ViewStylePropTypes');
var ReactPropTypes = require('ReactPropTypes');

var VideoStylePropTypes = {
  ...ViewStylePropTypes,
};

module.exports = VideoStylePropTypes;
