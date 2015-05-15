var React = require('react-native');
var NativeModules = require('NativeModules');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var StyleSheet = require('StyleSheet');
var createReactNativeComponentClass = require('createReactNativeComponentClass');
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
    style: StyleSheetPropType(VideoStylePropTypes),
    source: PropTypes.object,
    videoResizeMode: PropTypes.string,
    autoplay: PropTypes.bool,
    onLoadStart: PropTypes.func,
    onProgress: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    onSeek: PropTypes.func,
    onUpdateTime: PropTypes.func,
    onEnd: PropTypes.func,
  },

  mixins: [NativeMethodsMixin],

  viewConfig: {
    uiViewClassName: 'UIView',
    validAttributes: ReactNativeViewAttributes.UIView
  },

  _onLoadStart(event) {
    this.props.onLoadStart && this.props.onLoadStart(event.nativeEvent);
  },

  _onProgress(event) {
    this.props.onProgress && this.props.onProgress(event.nativeEvent);
  },

  _onLoad(event) {
    this.props.onLoad && this.props.onLoad(event.nativeEvent);
  },

  _onError(event) {
    this.props.onError && this.props.onError(event.nativeEvent);
  },

  _onSeek(event) {
    this.props.onSeek && this.props.onSeek(event.nativeEvent);
  },

  _onUpdateTime(event) {
    this.props.onUpdateTime && this.props.onUpdateTime(event.nativeEvent);
  },

  _onEnd(event) {
    // TODO rename this to `onEnded` ?!
    this.props.onEnd && this.props.onEnd(event.nativeEvent);
  },

  /* public api */

  seek(time) {
    this.setNativeProps({seek: parseFloat(time)});
  },

  play() {
    // TODO: should this start the video from the beginning if it is being
    // called while the video is running?
    this.setNativeProps({paused: false});
  },

  pause() {
    this.setNativeProps({paused: true});
  },

  setPlaybackRate(rate) {
    this.setNativeProps({rate: parseFloat(rate)});
  },

  setVolume(volume) {
    this.setNativeProps({volume: parseFloat(volume)});
  },

  setMuted(muted) {
    this.setNativeProps({muted});
  },

  setRepeat(repeat) {
    this.setNativeProps({repeat});
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
      onLoadStart: this._onLoadStart,
      onProgress: this._onProgress,
      onLoad: this._onLoad,
      onError: this._onError,
      onSeek: this._onSeek,
      onUpdateTime: this._onUpdateTime,
      onEnd: this._onEnd,
    });

    return <RCTVideo {... nativeProps} />;
  },
});

var RCTVideo = createReactNativeComponentClass({
  validAttributes: merge(
    ReactNativeViewAttributes.UIView,
    {
      src: {diff: deepDiffer},
      resizeMode: true,
      autoplay: true
      /*repeat: true,
      seek: true,
      paused: true,
      muted: true,
      volume: true,
      rate: true*/
    }
  ),
  uiViewClassName: 'RCTVideo',
});

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = Video;
