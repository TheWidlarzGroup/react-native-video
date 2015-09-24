/**
 *
 * @providesModule VideoPlayer
 *
*/

'use strict';

var NativeVideo = require('NativeModules').Video;
var React = require('react-native');
var {
  DeviceEventEmitter
 } = React;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var VideoPlayer = function() {
  var self = this;
  var uuid = guid();
  NativeVideo.createVideoPlayer(uuid);
  var _onLoadStart = null;
  var _onLoad = null;
  var _onError = null;
  var _onProgress = null;
  var _onSeek = null;
  var _onEnd = null;


  DeviceEventEmitter.addListener('onVideoLoadStart', function(body) {
    if (body.target === uuid) {
      delete body.target;
      _onLoadStart && _onLoadStart(body);
    }
  });
  DeviceEventEmitter.addListener('onVideoLoad', function(body) {
    if (body.target === uuid) {
      delete body.target;
      _onLoad && _onLoad(body);
    }
  });
  DeviceEventEmitter.addListener('onVideoError', function(body) {
    if (body.target === uuid) {
      delete body.target;
      _onError && _onError(body);
    }
  });
  DeviceEventEmitter.addListener('onVideoProgress', function(body) {
    if (body.target === uuid) {
      delete body.target;
      _onProgress && _onProgress(body);
    }
  });
  DeviceEventEmitter.addListener('onVideoSeek', function(body) {
    if (body.target === uuid) {
      delete body.target;
      _onSeek && _onSeek(body);
    }
  });
  DeviceEventEmitter.addListener('onVideoEnd', function(body) {
    if (body.target === uuid) {
      delete body.target;
      _onEnd && _onEnd(body);
    }
  });

  var vp = {
    uuid: uuid,
    setSource: function(source) {
      var uri = source.uri;
      if (uri && uri.match(/^\//)) {
        uri = 'file://' + uri;
      }
      var isNetwork = !!(uri && uri.match(/^https?:/));
      var isAsset = !!(uri && uri.match(/^(assets-library|file):/));
      var src = {
        uri: uri,
        isNetwork,
        isAsset,
        type: source.type || 'mp4'
      };
      NativeVideo.setSource(uuid, src, function(err) {
        console.log("err:" + err);
      });
    },
    setRepeat: function(repeat) {
      NativeVideo.setRepeat(uuid, repeat, function(err) {});
    },
    setMuted: function(muted) {
      NativeVideo.setMuted(uuid, muted, function(err) {});
    },
    setVolume: function(volume) {
      NativeVideo.setVolume(uuid, volume, function(err) {});
    },
    setRate: function(rate) {
      NativeVideo.setRate(uuid, rate, function(err) {});
    },
    setSeek: function(seek) {
      NativeVideo.setSeek(uuid, seek, function(err) {});
    },
    removePlayer: function() {
      NativeVideo.removePlayer(uuid, function(err) {});
    },

    onLoadStart: function(callback) {
      _onLoadStart = callback;
    },
    onLoad: function(callback) {
      _onLoad = callback;
    },
    onError: function(callback) {
      _onError = callback;
    },
    onProgress: function(callback) {
      _onProgress = callback;
    },
    onSeek: function(callback) {
      _onSeek = callback;
    },
    onEnd: function(callback) {
      _onEnd = callback;
    },
  };
  vp.setRate(1);
  vp.setVolume(1);
  vp.setRepeat(1);
  return vp;
}

module.exports = VideoPlayer;