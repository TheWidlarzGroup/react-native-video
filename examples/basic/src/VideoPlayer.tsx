'use strict';

import React, {FC, useRef, useState} from 'react';

import {TouchableOpacity, View} from 'react-native';

import Video, {
  AudioTrack,
  OnAudioTracksData,
  OnLoadData,
  OnProgressData,
  OnTextTracksData,
  OnVideoAspectRatioData,
  TextTrack,
  OnBufferData,
  OnAudioFocusChangedData,
  OnVideoErrorData,
  VideoRef,
  OnTextTrackDataChangedData,
  OnSeekData,
  OnPlaybackStateChangedData,
  OnPlaybackRateChangeData,
  OnVideoTracksData,
  SelectedVideoTrackType,
  BufferingStrategyType,
  ReactVideoSource,
  SelectedTrackType,
} from 'react-native-video';
import styles from './styles';
import {AdditionalSourceInfo} from './types';
import {defaultValue, srcList, textTracksSelectionBy} from './constants';
import {Overlay, toast} from './components';

type Props = NonNullable<unknown>;

const VideoPlayer: FC<Props> = ({}) => {
  const [state, setState] = useState(defaultValue);
  const videoRef = useRef<VideoRef>(null);
  const viewStyle = state.fullscreen ? styles.fullScreen : styles.halfScreen;
  const currentSrc = srcList[state.srcListId];
  const additional = currentSrc as AdditionalSourceInfo;

  const onAudioTracks = (data: OnAudioTracksData) => {
    const selectedTrack = data.audioTracks?.find((x: AudioTrack) => {
      return x.selected;
    });
    if (selectedTrack?.index) {
      setState({
        ...state,
        audioTracks: data.audioTracks,
        selectedAudioTrack: {
          type: SelectedTrackType.INDEX,
          value: selectedTrack?.index,
        },
      });
    } else {
      setState({
        ...state,
        audioTracks: data.audioTracks,
      });
    }
  };

  const onVideoTracks = (data: OnVideoTracksData) => {
    console.log('onVideoTracks', data.videoTracks);
    setState({
      ...state,
      videoTracks: data.videoTracks,
    });
  };

  const onTextTracks = (data: OnTextTracksData) => {
    const selectedTrack = data.textTracks?.find((x: TextTrack) => {
      return x?.selected;
    });

    if (selectedTrack?.language) {
      setState({
        ...state,
        textTracks: data.textTracks,
        selectedTextTrack:
          textTracksSelectionBy === 'index'
            ? {
                type: SelectedTrackType.INDEX,
                value: selectedTrack?.index,
              }
            : {
                type: SelectedTrackType.LANGUAGE,
                value: selectedTrack?.language,
              },
      });
    } else {
      setState({
        ...state,
        textTracks: data.textTracks,
      });
    }
  };

  const onLoad = (data: OnLoadData) => {
    setState({...state, duration: data.duration});
    onAudioTracks(data);
    onTextTracks(data);
    onVideoTracks(data);
  };

  const onProgress = (data: OnProgressData) => {
    setState({...state, currentTime: data.currentTime});
  };

  const onSeek = (data: OnSeekData) => {
    setState({...state, isSeeking: false});
    setState({...state, currentTime: data.currentTime});
  };

  const onVideoLoadStart = () => {
    console.log('onVideoLoadStart');
    setState({...state, isLoading: true});
  };

  const onTextTrackDataChanged = (data: OnTextTrackDataChangedData) => {
    console.log(`Subtitles: ${JSON.stringify(data, null, 2)}`);
  };

  const onAspectRatio = (data: OnVideoAspectRatioData) => {
    console.log('onAspectRadio called ' + JSON.stringify(data));
    setState({
      ...state,
      videoWidth: data.width,
      videoHeight: data.height,
    });
  };

  const onVideoBuffer = (param: OnBufferData) => {
    console.log('onVideoBuffer');
    setState({...state, isLoading: param.isBuffering});
  };

  const onReadyForDisplay = () => {
    console.log('onReadyForDisplay');
    setState({...state, isLoading: false});
  };

  const onAudioBecomingNoisy = () => {
    setState({...state, paused: true});
  };

  const onAudioFocusChanged = (event: OnAudioFocusChangedData) => {
    setState({...state, paused: !event.hasAudioFocus});
  };

  const onError = (err: OnVideoErrorData) => {
    console.log(JSON.stringify(err));
    toast(true, 'error: ' + JSON.stringify(err));
  };

  const onEnd = () => {
    if (!state.loop) {
      channelUp();
    }
  };

  const onPlaybackRateChange = (data: OnPlaybackRateChangeData) => {
    console.log('onPlaybackRateChange', data);
  };

  const onPlaybackStateChanged = (data: OnPlaybackStateChangedData) => {
    console.log('onPlaybackStateChanged', data);
  };

  const goToChannel = (channel: number) => {
    setState({
      ...state,
      srcListId: channel,
      duration: 0.0,
      currentTime: 0.0,
      videoWidth: 0,
      videoHeight: 0,
      isLoading: false,
      audioTracks: [],
      textTracks: [],
      selectedAudioTrack: undefined,
      selectedTextTrack: undefined,
      selectedVideoTrack: {
        type: SelectedVideoTrackType.AUTO,
      },
    });
  };

  const channelUp = () => {
    console.log('channel up');
    goToChannel((state.srcListId + 1) % srcList.length);
  };

  const channelDown = () => {
    console.log('channel down');
    goToChannel((state.srcListId + srcList.length - 1) % srcList.length);
  };

  return (
    <View style={styles.container}>
      {(srcList[state.srcListId] as AdditionalSourceInfo)?.noView ? null : (
        <TouchableOpacity style={viewStyle}>
          <Video
            showNotificationControls={state.showNotificationControls}
            ref={videoRef}
            source={currentSrc as ReactVideoSource}
            textTracks={additional?.textTracks}
            adTagUrl={additional?.adTagUrl}
            drm={additional?.drm}
            style={viewStyle}
            rate={state.rate}
            paused={state.paused}
            volume={state.volume}
            muted={state.muted}
            fullscreen={state.fullscreen}
            controls={state.showRNVControls}
            resizeMode={state.resizeMode}
            onLoad={onLoad}
            onAudioTracks={onAudioTracks}
            onTextTracks={onTextTracks}
            onVideoTracks={onVideoTracks}
            onTextTrackDataChanged={onTextTrackDataChanged}
            onProgress={onProgress}
            onEnd={onEnd}
            progressUpdateInterval={1000}
            onError={onError}
            onAudioBecomingNoisy={onAudioBecomingNoisy}
            onAudioFocusChanged={onAudioFocusChanged}
            onLoadStart={onVideoLoadStart}
            onAspectRatio={onAspectRatio}
            onReadyForDisplay={onReadyForDisplay}
            onBuffer={onVideoBuffer}
            onSeek={onSeek}
            repeat={state.loop}
            selectedTextTrack={state.selectedTextTrack}
            selectedAudioTrack={state.selectedAudioTrack}
            selectedVideoTrack={state.selectedVideoTrack}
            playInBackground={false}
            bufferConfig={{
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000,
              cacheSizeMB: state.useCache ? 200 : 0,
              live: {
                targetOffsetMs: 500,
              },
            }}
            preventsDisplaySleepDuringVideoPlayback={true}
            poster={state.poster}
            onPlaybackRateChange={onPlaybackRateChange}
            onPlaybackStateChanged={onPlaybackStateChanged}
            bufferingStrategy={BufferingStrategyType.DEFAULT}
            debug={{enable: true, thread: true}}
          />
        </TouchableOpacity>
      )}
      <Overlay
        channelDown={channelDown}
        channelUp={channelUp}
        setState={setState}
        state={state}
        ref={videoRef}
      />
    </View>
  );
};
export default VideoPlayer;
