import React from 'react';
import {
  StyleSheet,
  requireNativeComponent,
  NativeModules,
  Platform,
  findNodeHandle,
} from 'react-native';

import { IVideoPlayer } from './types/player';
import { VideoResizeMode } from './types/resizeMode';
import { SeekToCommand } from './types/SeekToCommand';

const RCTVideo = requireNativeComponent('RCTVideo');

export default class Video extends React.PureComponent<IVideoPlayer> {
  private refPlayer: React.RefObject<any> = React.createRef();

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
    this.props.onPlaybackRateChange?.(event.nativeEvent);
  };

  onBuffer = (event) => {
    this.props?.onBuffer(event.nativeEvent);
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
    let args = [];

    if (time !== 'now') {
      command =
        typeof time === 'string'
          ? SeekToCommand.SEEK_TO_TIMESTAMP
          : SeekToCommand.SEEK_TO_POSITION;
      args.push(time);
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
    if (resizeMode === VideoResizeMode.STRETCH) {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleToFill;
    } else if (resizeMode === VideoResizeMode.CONTAIN) {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleAspectFit;
    } else if (resizeMode === VideoResizeMode.COVER) {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleAspectFill;
    } else {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleNone;
    }
  }

  render() {
    const { source } = this.props;
    const isNetwork = !!(source.uri && source.uri.match(/^https?:/));
    const isAsset = !!(source.uri && source.uri.match(/^(assets-library|file|content|ms-appx|ms-appdata):/));


    return (
      <RCTVideo
        {...this.props}
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
        onVideoLoadStart={this.onLoadStart}
        onVideoLoad={this.onLoad}
        onVideoError={this.onError}
        onVideoProgress={this.onProgress}
        onVideoSeek={this.onSeek}
        onVideoEnd={this.onEnd}
        onVideoBuffer={this.onBuffer}
        onTimedMetadata={this.onTimedMetadata}
        onReadyForDisplay={this.onReadyForDisplay}
        onPlaybackStalled={this.onPlaybackStalled}
        onPlaybackResume={this.onPlaybackResume}
        onPlaybackRateChange={this.onPlaybackRateChange}
      />
    );
  }
}



const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
