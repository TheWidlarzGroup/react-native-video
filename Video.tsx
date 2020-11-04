import React from 'react';
import {
  Image,
  StyleSheet,
  requireNativeComponent,
  NativeModules,
  Platform,
  findNodeHandle,
  View,
} from 'react-native';

import { IVideoPlayer } from './types/player';
import { SeekToCommand } from './types/SeekToCommand';

const RCTVideo = requireNativeComponent('RCTVideo');

interface IState {
  showPoster: boolean;
}

export default class Video extends React.PureComponent<IVideoPlayer, IState> {
  private refPlayer: React.RefObject<any> = React.createRef();

  state: IState = {
    showPoster: true,
  };

  constructor(props) {
    super(props);

    this.state = {
      showPoster: true,
    };
  }

  setNativeProps(nativeProps) {
    this.refPlayer?.current?.setNativeProps(nativeProps);
  }

  seek = (time, tolerance = 100) => {
    if (Platform.OS === 'ios') {
      this.setNativeProps({
        seek: {
          time,
          tolerance,
        },
      });
    } else {
      this.setNativeProps({ seek: time });
    }
  };

  assignRoot = (component) => {
    this.refPlayer = component;
  };

  onLoadStart = (event) => {
    this.props.onLoadStart?.(event.nativeEvent);
  };

  onLoad = (event) => {
    this.props.onLoad?.(event.nativeEvent);
  };

  onError = (event) => {
    this.props.onError?.(event.nativeEvent);
  };

  onProgress = (event) => {
    this.props.onProgress?.(event.nativeEvent);
  };

  onSeek = (event) => {
    if (this.state.showPoster && !this.props.audioOnly) {
      this.setState({ showPoster: false });
    }
    this.props.onSeek?.(event.nativeEvent);
  };

  onEnd = (event) => {
    this.props.onEnd?.(event.nativeEvent);
  };

  onTimedMetadata = (event) => {
    this.props.onTimedMetadata?.(event.nativeEvent);
  };

  onReadyForDisplay = (event) => {
    this.props.onReadyForDisplay?.(event.nativeEvent);
  };

  onPlaybackStalled = (event) => {
    this.props.onPlaybackStalled?.(event.nativeEvent);
  };

  onPlaybackResume = (event) => {
    this.props.onPlaybackResume?.(event.nativeEvent);
  };

  onPlaybackRateChange = (event) => {
    if (this.state.showPoster && event.nativeEvent.playbackRate !== 0 && !this.props.audioOnly) {
      this.setState({ showPoster: false });
    }
    this.props.onPlaybackRateChange?.(event.nativeEvent);
  };

  onBuffer = (event) => {
    this.props.onBuffer?.(event.nativeEvent);
  };

  /**
   * seekTo jumps to a certain position for vod and live content
   * time parameter can be the following:
   * string: unix timestamp (used for live annotation)
   * number: seconds elapsed (used for vod annotation)
   * now: for DVR content to jump back to current live time
   */
  seekTo = (time: 'now' | string | number) => {
    let command = SeekToCommand.SEEK_TO_NOW;
    const args: string[] = [];

    if (time !== 'now') {
      command =
        typeof time === 'string' ? SeekToCommand.SEEK_TO_TIMESTAMP : SeekToCommand.SEEK_TO_POSITION;
      args.push(time as string);
    }

    if (this.refPlayer) {
      NativeModules.UIManager.dispatchViewManagerCommand(
        findNodeHandle(this.refPlayer.current),
        NativeModules.UIManager.RCTVideo.Commands[command],
        args
      );
    }
  };

  getNativeResizeMode = () => {
    const { resizeMode } = this.props;
    let nativeResizeMode;
    if (resizeMode === 'stretch') {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleToFill;
    } else if (resizeMode === 'contain') {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleAspectFit;
    } else if (resizeMode === 'cover') {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleAspectFill;
    } else {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleNone;
    }
    return nativeResizeMode;
  };

  getVideoPlayerProps = () => {
    return {
      ...this.props,
      resizeMode: this.getNativeResizeMode(),
      onVideoLoadStart: this.onLoadStart,
      onVideoLoad: this.onLoad,
      onVideoError: this.onError,
      onVideoProgress: this.onProgress,
      onVideoSeek: this.onSeek,
      onVideoEnd: this.onEnd,
      onVideoBuffer: this.onBuffer,
      onTimedMetadata: this.onTimedMetadata,
      onReadyForDisplay: this.onReadyForDisplay,
      onPlaybackStalled: this.onPlaybackStalled,
      onPlaybackResume: this.onPlaybackResume,
      onPlaybackRateChange: this.onPlaybackRateChange,
    };
  };

  render() {
    const { source, poster } = this.props;
    const { showPoster } = this.state;
    const isNetwork = !!(source.uri && source.uri.match(/^https?:/));
    const isAsset = !!(
      source.uri && source.uri.match(/^(assets-library|file|content|ms-appx|ms-appdata):/)
    );

    if (poster && showPoster) {
      return (
        <View style={this.props.style}>
          <RCTVideo ref={this.assignRoot} {...this.getVideoPlayerProps()} />
          <Image source={{ uri: poster }} style={styles.posterStyle} />
        </View>
      );
    }

    return (
      <RCTVideo
        {...this.getVideoPlayerProps()}
        ref={this.assignRoot}
        style={[styles.base, this.props.style]}
        resizeMode={this.getNativeResizeMode()}
        src={{
          isNetwork,
          isAsset,
          ...source,
          mainVer: source.mainVer || 0,
          patchVer: source.patchVer || 0,
        }}
      />
    );
  }
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  posterStyle: {
    ...StyleSheet.absoluteFillObject,
  },
});
