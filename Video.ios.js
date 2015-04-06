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

var Video = React.createClass({
  propTypes: {
    source: PropTypes.string,
    style: StyleSheetPropType(VideoStylePropTypes),
    resizeMode: PropTypes.string,
    repeat: PropTypes.bool,
    pause: PropTypes.bool,
    onLoad: PropTypes.func,
    onProgress: PropTypes.func,
  },

  mixins: [NativeMethodsMixin],

  viewConfig: {
    uiViewClassName: 'UIView',
    validAttributes: ReactIOSViewAttributes.UIView
  },

  _onLoad(event) {
    this.props.onLoad && this.props.onLoad(event.nativeEvent);
  },

  _onProgress(event) {
    this.props.onProgress && this.props.onProgress(event.nativeEvent);
  },

  render() {
    var style = flattenStyle([styles.base, this.props.style]);
    var source = this.props.source;

    var resizeMode;
    if (this.props.resizeMode === VideoResizeMode.stretch) {
      resizeMode = NativeModules.VideoManager.ScaleToFill;
    } else if (this.props.resizeMode === VideoResizeMode.contain) {
      resizeMode = NativeModules.VideoManager.ScaleAspectFit;
    } else if (this.props.resizeMode == VideoResizeMode.cover) {
      resizeMode = NativeModules.VideoManager.ScaleAspectFill;
    } else {
      resizeMode = NativeModules.VideoManager.ScaleNone;
    }

    var nativeProps = merge(this.props, {
      style,
      resizeMode: resizeMode,
      src: source,
      onLoad: this._onLoad,
      onProgress: this._onProgress,
    });

    return <RCTVideo {... nativeProps} />
  },
});

var RCTVideo = createReactIOSNativeComponentClass({
  validAttributes: merge(ReactIOSViewAttributes.UIView,
    {src: true, resizeMode: true, repeat: true, pause: true}),
  uiViewClassName: 'RCTVideo',
});

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = Video;
