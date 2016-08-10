import React, { Component, PropTypes } from 'react';
import VideoResizeMode from './VideoResizeMode.js';

import {
  StyleSheet,
  requireNativeComponent,
  NativeModules,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

export default class Video extends Component {

  constructor(props, context) {
    super(props, context);
    this.seek = this.seek.bind(this);
    this.seekToClip = this.seekToClip.bind(this);
    this._assignRoot = this._assignRoot.bind(this);
    this._onLoadStart = this._onLoadStart.bind(this);
    this._onLoad = this._onLoad.bind(this);
    this._onError = this._onError.bind(this);
    this._onProgress = this._onProgress.bind(this);
    this._onSeek = this._onSeek.bind(this);
    this._onSeekToClip = this._onSeekToClip.bind(this);
    this._onClipEnd = this._onClipEnd.bind(this);
    this._onEnd = this._onEnd.bind(this);
  }

  setNativeProps(nativeProps) {
    this._root.setNativeProps(nativeProps);
  }

  seek(time) {
    this.setNativeProps({ seek: time });
  }

  // time is optional
  seekToClip(index, time) {
    this.setNativeProps({ seekClip: { index, time } });
  }

  _assignRoot(component) {
    this._root = component;
  }

  _onLoadStart(event) {
    if (this.props.onLoadStart) {
      this.props.onLoadStart(event.nativeEvent);
    }
  }

  _onLoad(event) {
    if (this.props.onLoad) {
      this.props.onLoad(event.nativeEvent);
    }
  }

  _onError(event) {
    if (this.props.onError) {
      this.props.onError(event.nativeEvent);
    }
  }

  _onProgress(event) {
    if (this.props.onProgress) {
      this.props.onProgress(event.nativeEvent);
    }
  }

  _onSeek(event) {
    if (this.props.onSeek) {
      this.props.onSeek(event.nativeEvent);
    }
  }

  _onSeekToClip(event) {
    if (this.props.onSeekToClip) {
      this.props.onSeekToClip(event.nativeEvent);
    }
  }

  _onClipEnd(event) {
    if (this.props.onClipEnd) {
      this.props.onClipEnd(event.nativeEvent);
    }
  }

  _onEnd(event) {
    if (this.props.onEnd) {
      this.props.onEnd(event.nativeEvent);
    }
  }

  render() {
    const {
      source,
      resizeMode,
      buffering
    } = this.props;

    if (source.constructor !== Object && source.constructor !== Array) {
      throw "react-native-video: Invalid type for props.source, expected Object or Array, got: " + source.constructor;
    }

    sources = (source.constructor === Object ? [source] : source).map(function(src) {
      let uri = src.uri;
      if (uri && uri.match(/^\//)) {
        uri = `file://${uri}`;
      }
      let isNetwork = !!(uri && uri.match(/^https?:/));
      let isAsset = !!(uri && uri.match(/^(assets-library|file):/));
      return {
        uri,
        isNetwork,
        isAsset,
        type: src.type || 'mp4'
      };
    }).filter((src) => src.uri);

    let nativeResizeMode;
    if (resizeMode === VideoResizeMode.stretch) {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleToFill;
    } else if (resizeMode === VideoResizeMode.contain) {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleAspectFit;
    } else if (resizeMode === VideoResizeMode.cover) {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleAspectFill;
    } else {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleNone;
    }

    const nativeProps = Object.assign({}, this.props);
    Object.assign(nativeProps, {
      style: [styles.base, nativeProps.style],
      resizeMode: nativeResizeMode,
      src: sources,
      buffering: buffering === false ? false : true,
      onVideoLoadStart: this._onLoadStart,
      onVideoLoad: this._onLoad,
      onVideoError: this._onError,
      onVideoProgress: this._onProgress,
      onVideoSeek: this._onSeek,
      onVideoSeekToClip: this._onSeekToClip,
      onVideoClipEnd: this._onClipEnd,
      onVideoEnd: this._onEnd,
    });

    return (
      <RCTVideo
        ref={this._assignRoot}
        {...nativeProps}
      />
    );
  }
}

Video.propTypes = {
  /* Native only */
  src: PropTypes.array,
  seek: PropTypes.number,
  seekClip: PropTypes.object,

  /* Wrapper component */
  // source: object or array
  resizeMode: PropTypes.string,
  repeat: PropTypes.bool,
  paused: PropTypes.bool,
  muted: PropTypes.bool,
  volume: PropTypes.number,
  rate: PropTypes.number,
  controls: PropTypes.bool,
  currentTime: PropTypes.number,
  buffering: PropTypes.bool,
  onLoadStart: PropTypes.func,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  onProgress: PropTypes.func,
  onSeek: PropTypes.func,
  onSeekToClip: PropTypes.func,
  onClipEnd: PropTypes.func,
  onEnd: PropTypes.func,

  /* Required by react-native */
  scaleX: React.PropTypes.number,
  scaleY: React.PropTypes.number,
  translateX: React.PropTypes.number,
  translateY: React.PropTypes.number,
  rotation: React.PropTypes.number,
  ...View.propTypes,
};

const RCTVideo = requireNativeComponent('RCTVideo', Video, {
  nativeOnly: {
    src: true,
    seek: true,
    buffering: true
  },
});
