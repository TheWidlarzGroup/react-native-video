var React = require('react-native');
var { StyleSheet, requireNativeComponent, PropTypes, NativeModules, } = React;

var VideoResizeMode = require('./VideoResizeMode');
var merge = require('merge');

var VIDEO_REF = 'video';

var Video = React.createClass({
  propTypes: {
    /* Native only */
    src: PropTypes.object,
    seek: PropTypes.number,

    /* Wrapper component */
    source: PropTypes.object,
    resizeMode: PropTypes.string,
    repeat: PropTypes.bool,
    paused: PropTypes.bool,
    muted: PropTypes.bool,
    volume: PropTypes.number,
    rate: PropTypes.number,
    onLoadStart: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    onProgress: PropTypes.func,
    onEnd: PropTypes.func,
  },

  setNativeProps(props) {
    this.refs[VIDEO_REF].setNativeProps(props);
  },

  _onLoadStart(event) {
    this.props.onLoadStart && this.props.onLoadStart(event.nativeEvent);
  },

  _onLoad(event) {
    this.props.onLoad && this.props.onLoad(event.nativeEvent);
  },

  _onError(event) {
    this.props.onError && this.props.onError(event.nativeEvent);
  },

  _onProgress(event) {
    this.props.onProgress && this.props.onProgress(event.nativeEvent);
  },

  _onSeek(event) {
    this.props.onSeek && this.props.onSeek(event.nativeEvent);
  },

  seek(time) {
    this.setNativeProps({seek: parseFloat(time)});
  },

  _onEnd(event) {
    this.props.onEnd && this.props.onEnd(event.nativeEvent);
  },

  render() {
    var style = [styles.base, this.props.style];
    var source = this.props.source;
    var uri = source.uri;
    if (uri && uri.match(/^\//)) {
      uri = 'file://' + uri;
    }
    var isNetwork = !!(uri && uri.match(/^https?:/));
    var isAsset = !!(uri && uri.match(/^(assets-library|file):/));

    var resizeMode;
    if (this.props.resizeMode === VideoResizeMode.stretch) {
      resizeMode = NativeModules.VideoManager.ScaleToFill;
    } else if (this.props.resizeMode === VideoResizeMode.contain) {
      resizeMode = NativeModules.VideoManager.ScaleAspectFit;
    } else if (this.props.resizeMode === VideoResizeMode.cover) {
      resizeMode = NativeModules.VideoManager.ScaleAspectFill;
    } else {
      resizeMode = NativeModules.VideoManager.ScaleNone;
    }

    var nativeProps = merge(this.props, {
      style,
      resizeMode: resizeMode,
      src: {
        uri: uri,
        isNetwork,
        isAsset,
        type: source.type || 'mp4'
      },
      onVideoLoad: this._onLoad,
      onVideoProgress: this._onProgress,
      onVideoEnd: this._onEnd,
    });

    return <RCTVideo ref={VIDEO_REF} {... nativeProps} />;
  },
});

var RCTVideo = requireNativeComponent('RCTVideo', Video);

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = Video;
