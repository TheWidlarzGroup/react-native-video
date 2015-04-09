var React = require('react-native');
var NativeModules = require('NativeModules');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var PropTypes = require('ReactPropTypes');
var StyleSheetPropType = require('StyleSheetPropType');
var VideoResizeMode = require('./VideoResizeMode');
var VideoStylePropTypes = require('./VideoStylePropTypes');
var NativeMethodsMixin = require('NativeMethodsMixin');
var flattenStyle = require('flattenStyle');
var merge = require('merge');
var deepDiffer = require('deepDiffer');

var Video = React.createClass({
  propTypes: {
    // should probably be a shape
    source: PropTypes.object,
    style: StyleSheetPropType(VideoStylePropTypes),
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
  },

  mixins: [NativeMethodsMixin],

  viewConfig: {
    uiViewClassName: 'UIView',
    validAttributes: ReactIOSViewAttributes.UIView
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

  render() {
    var style = flattenStyle([styles.base, this.props.style]);
    var source = this.props.source;
    var isNetwork = !!(source.uri && source.uri.match(/^https?:/));
    var isAsset = !!(source.uri && source.uri.match(/^assets-library:/));

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
        uri: source.uri,
        isNetwork,
        isAsset,
        type: source.type || 'mp4'
      },
      onLoad: this._onLoad,
      onProgress: this._onProgress,
    });

    return <RCTVideo {... nativeProps} />;
  },
});

var RCTVideo = createReactIOSNativeComponentClass({
  validAttributes: merge(ReactIOSViewAttributes.UIView,
    {src: {diff: deepDiffer}, resizeMode: true, repeat: true,
     seek: true, paused: true, muted: true, volume: true, rate: true}),
  uiViewClassName: 'RCTVideo',
});

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = Video;
