/**
 *
 * @providesModule AVPlayerLayer
 *
*/

'use strict';

var React = require('react-native');
var { StyleSheet, requireNativeComponent, PropTypes, NativeModules } = React;

var VideoResizeMode = require('./AVPlayerLayerResizeMode');
var { extend } = require('lodash');

var VIDEO_REF = 'video';

var AVPlayerLayer = React.createClass({
  propTypes: {
    /* Wrapper component */
    resizeMode: PropTypes.string,
    playerUuid: PropTypes.string,
  },

  setNativeProps(props) {
    this.refs[VIDEO_REF].setNativeProps(props);
  },

  render() {
    var style = [styles.base, this.props.style];

    var resizeMode;
    if (this.props.resizeMode === VideoResizeMode.stretch) {
      resizeMode = NativeModules.AVPlayerLayerManager.ScaleToFill;
    } else if (this.props.resizeMode === VideoResizeMode.contain) {
      resizeMode = NativeModules.AVPlayerLayerManager.ScaleAspectFit;
    } else if (this.props.resizeMode === VideoResizeMode.cover) {
      resizeMode = NativeModules.AVPlayerLayerManager.ScaleAspectFill;
    } else {
      resizeMode = NativeModules.AVPlayerLayerManager.ScaleNone;
    }
    var player = this.props.player;
    var playerUuid = player ? player.uuid : '';
    var nativeProps = extend({}, this.props, {
      style,
      resizeMode: resizeMode,
      playerUuid: playerUuid,
    });

    return <RCTVideoView ref={VIDEO_REF} {... nativeProps} />;
  },
});

var RCTVideoView = requireNativeComponent('RCTAVPlayerLayer', AVPlayerLayer);

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = AVPlayerLayer;
