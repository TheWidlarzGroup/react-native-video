var React = require('react-native');
var { StyleSheet, requireNativeComponent, PropTypes, NativeModules, } = React;

var VideoResizeMode = require('./VideoResizeMode');
var VideoPlayer = require('./Video.ios')
var { extend } = require('lodash');

var VIDEO_REF = 'video';

var Video = React.createClass({
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
      resizeMode = NativeModules.VideoViewManager.ScaleToFill;
    } else if (this.props.resizeMode === VideoResizeMode.contain) {
      resizeMode = NativeModules.VideoViewManager.ScaleAspectFit;
    } else if (this.props.resizeMode === VideoResizeMode.cover) {
      resizeMode = NativeModules.VideoViewManager.ScaleAspectFill;
    } else {
      resizeMode = NativeModules.VideoViewManager.ScaleNone;
    }
    var playerUuid = this.props.player.uuid;
    var nativeProps = extend({}, this.props, {
      style,
      resizeMode: resizeMode,
      playerUuid: playerUuid,
    });

    return <RCTVideoView ref={VIDEO_REF} {... nativeProps} />;
  },
});

var RCTVideoView = requireNativeComponent('RCTVideoView', Video);

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = { Video, VideoPlayer };
