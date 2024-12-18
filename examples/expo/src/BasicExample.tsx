import React, {useCallback, useRef, useState, useEffect} from 'react';

import {Platform, TouchableOpacity, View, StatusBar} from 'react-native';

import Video, {
  SelectedVideoTrackType,
  BufferingStrategyType,
  SelectedTrackType,
  ResizeMode,
  type VideoRef,
  type AudioTrack,
  type OnAudioTracksData,
  type OnLoadData,
  type OnProgressData,
  type OnTextTracksData,
  type OnVideoAspectRatioData,
  type TextTrack,
  type OnBufferData,
  type OnAudioFocusChangedData,
  type OnVideoErrorData,
  type OnTextTrackDataChangedData,
  type OnSeekData,
  type OnPlaybackStateChangedData,
  type OnPlaybackRateChangeData,
  type OnVideoTracksData,
  type VideoTrack,
  type SelectedTrack,
  type SelectedVideoTrack,
  type EnumValues,
  type OnBandwidthUpdateData,
  type ControlsStyles,
} from 'react-native-video';
import styles from './styles';
import {type AdditionalSourceInfo} from './types';
import {
  bufferConfig,
  srcList,
  textTracksSelectionBy,
  audioTracksSelectionBy,
} from './constants';
import {Overlay, toast, VideoLoader} from './components';

const BasicExample = () => {
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [resizeMode, setResizeMode] = useState<EnumValues<ResizeMode>>(
    ResizeMode.CONTAIN,
  );
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [_, setVideoSize] = useState({videoWidth: 0, videoHeight: 0});
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<
    SelectedTrack | undefined
  >(undefined);
  const [selectedTextTrack, setSelectedTextTrack] = useState<
    SelectedTrack | undefined
  >(undefined);
  const [selectedVideoTrack, setSelectedVideoTrack] =
    useState<SelectedVideoTrack>({
      type: SelectedVideoTrackType.AUTO,
    });
  const [srcListId, setSrcListId] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [controls, setControls] = useState(false);
  const [useCache, setUseCache] = useState(false);
  const [showPoster, setShowPoster] = useState<boolean>(false);
  const [showNotificationControls, setShowNotificationControls] =
    useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const videoRef = useRef<VideoRef>(null);
  const viewStyle = fullscreen ? styles.fullScreen : styles.halfScreen;
  const currentSrc = srcList[srcListId];
  const additional = currentSrc as AdditionalSourceInfo;

  const goToChannel = useCallback((channel: number) => {
    setSrcListId(channel);
    setDuration(0);
    setCurrentTime(0);
    setVideoSize({videoWidth: 0, videoHeight: 0});
    setIsLoading(false);
    setAudioTracks([]);
    setTextTracks([]);
    setSelectedAudioTrack(undefined);
    setSelectedTextTrack(undefined);
    setSelectedVideoTrack({
      type: SelectedVideoTrackType.AUTO,
    });
  }, []);

  const channelUp = useCallback(() => {
    console.log('channel up');
    goToChannel((srcListId + 1) % srcList.length);
  }, [goToChannel, srcListId]);

  const channelDown = useCallback(() => {
    console.log('channel down');
    goToChannel((srcListId + srcList.length - 1) % srcList.length);
  }, [goToChannel, srcListId]);

  const onAudioTracks = (data: OnAudioTracksData) => {
    console.log('onAudioTracks', data);
    const selectedTrack = data.audioTracks?.find((x: AudioTrack) => {
      return x.selected;
    });
    let value;
    if (audioTracksSelectionBy === SelectedTrackType.INDEX) {
      value = selectedTrack?.index;
    } else if (audioTracksSelectionBy === SelectedTrackType.LANGUAGE) {
      value = selectedTrack?.language;
    } else if (audioTracksSelectionBy === SelectedTrackType.TITLE) {
      value = selectedTrack?.title;
    }
    setAudioTracks(data.audioTracks);
    setSelectedAudioTrack({
      type: audioTracksSelectionBy,
      value: value,
    });
  };

  const onVideoTracks = (data: OnVideoTracksData) => {
    console.log('onVideoTracks', data.videoTracks);
    setVideoTracks(data.videoTracks);
  };

  const onTextTracks = (data: OnTextTracksData) => {
    const selectedTrack = data.textTracks?.find((x: TextTrack) => {
      return x?.selected;
    });

    setTextTracks(data.textTracks);
    let value;
    if (textTracksSelectionBy === SelectedTrackType.INDEX) {
      value = selectedTrack?.index;
    } else if (textTracksSelectionBy === SelectedTrackType.LANGUAGE) {
      value = selectedTrack?.language;
    } else if (textTracksSelectionBy === SelectedTrackType.TITLE) {
      value = selectedTrack?.title;
    }
    setSelectedTextTrack({
      type: textTracksSelectionBy,
      value: value,
    });
  };

  const onLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    onAudioTracks(data);
    onTextTracks(data);
    onVideoTracks(data);
  };

  const onProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  };

  const onSeek = (data: OnSeekData) => {
    setCurrentTime(data.currentTime);
    setIsSeeking(false);
  };

  const onVideoLoadStart = () => {
    console.log('onVideoLoadStart');
    setIsLoading(true);
  };

  const onTextTrackDataChanged = (data: OnTextTrackDataChangedData) => {
    console.log(`Subtitles: ${JSON.stringify(data, null, 2)}`);
  };

  const onAspectRatio = (data: OnVideoAspectRatioData) => {
    console.log('onAspectRadio called ' + JSON.stringify(data));
    setVideoSize({videoWidth: data.width, videoHeight: data.height});
  };

  const onVideoBuffer = (param: OnBufferData) => {
    console.log('onVideoBuffer');
    setIsLoading(param.isBuffering);
  };

  const onReadyForDisplay = () => {
    console.log('onReadyForDisplay');
    setIsLoading(false);
  };

  const onAudioBecomingNoisy = () => {
    setPaused(true);
  };

  const onAudioFocusChanged = (event: OnAudioFocusChangedData) => {
    setPaused(!event.hasAudioFocus);
  };

  const onError = (err: OnVideoErrorData) => {
    console.log(JSON.stringify(err));
    toast(true, 'error: ' + JSON.stringify(err));
  };

  const onEnd = () => {
    if (!repeat) {
      channelUp();
    }
  };

  const onPlaybackRateChange = (data: OnPlaybackRateChangeData) => {
    console.log('onPlaybackRateChange', data);
  };

  const onPlaybackStateChanged = (data: OnPlaybackStateChangedData) => {
    console.log('onPlaybackStateChanged', data);
  };

  const onVideoBandwidthUpdate = (data: OnBandwidthUpdateData) => {
    console.log('onVideoBandwidthUpdate', data);
  };

  const onFullScreenExit = () => {
    // iOS pauses video on exit from full screen
    Platform.OS === 'ios' && setPaused(true);
  };

  const _renderLoader = showPoster ? () => <VideoLoader /> : undefined;

  const _subtitleStyle = {subtitlesFollowVideo: true};
  const _controlsStyles: ControlsStyles = {
    hideNavigationBarOnFullScreenMode: true,
    hideNotificationBarOnFullScreenMode: true,
    liveLabel: 'LIVE',
  };
  const _bufferConfig = {
    ...bufferConfig,
    cacheSizeMB: useCache ? 200 : 0,
  };

  useEffect(() => {
    videoRef.current?.setSource({...currentSrc, bufferConfig: _bufferConfig });
  }, [currentSrc]);

  return (
    <View style={styles.container}>
      <StatusBar animated={true} backgroundColor="black" hidden={false} />

      {(srcList[srcListId] as AdditionalSourceInfo)?.noView ? null : (
        <TouchableOpacity style={viewStyle}>
          <Video
            showNotificationControls={showNotificationControls}
            ref={videoRef}
            //            source={currentSrc as ReactVideoSource}
            drm={additional?.drm}
            style={viewStyle}
            rate={rate}
            paused={paused}
            volume={volume}
            muted={muted}
            controls={controls}
            resizeMode={resizeMode}
            onFullscreenPlayerWillDismiss={onFullScreenExit}
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
            onBandwidthUpdate={onVideoBandwidthUpdate}
            onSeek={onSeek}
            repeat={repeat}
            selectedTextTrack={selectedTextTrack}
            selectedAudioTrack={selectedAudioTrack}
            selectedVideoTrack={selectedVideoTrack}
            playInBackground={false}
            preventsDisplaySleepDuringVideoPlayback={true}
            renderLoader={_renderLoader}
            onPlaybackRateChange={onPlaybackRateChange}
            onPlaybackStateChanged={onPlaybackStateChanged}
            bufferingStrategy={BufferingStrategyType.DEFAULT}
            debug={{enable: true, thread: true}}
            subtitleStyle={_subtitleStyle}
            controlsStyles={_controlsStyles}
          />
        </TouchableOpacity>
      )}
      <Overlay
        channelDown={channelDown}
        channelUp={channelUp}
        ref={videoRef}
        videoTracks={videoTracks}
        selectedVideoTrack={selectedVideoTrack}
        setSelectedTextTrack={setSelectedTextTrack}
        audioTracks={audioTracks}
        controls={controls}
        resizeMode={resizeMode}
        textTracks={textTracks}
        selectedTextTrack={selectedTextTrack}
        selectedAudioTrack={selectedAudioTrack}
        setSelectedAudioTrack={setSelectedAudioTrack}
        setSelectedVideoTrack={setSelectedVideoTrack}
        currentTime={currentTime}
        setMuted={setMuted}
        muted={muted}
        duration={duration}
        paused={paused}
        volume={volume}
        setControls={setControls}
        showPoster={showPoster}
        rate={rate}
        setFullscreen={setFullscreen}
        setPaused={setPaused}
        isLoading={isLoading}
        isSeeking={isSeeking}
        setIsSeeking={setIsSeeking}
        repeat={repeat}
        setRepeat={setRepeat}
        setShowPoster={setShowPoster}
        setRate={setRate}
        setResizeMode={setResizeMode}
        setShowNotificationControls={setShowNotificationControls}
        showNotificationControls={showNotificationControls}
        setUseCache={setUseCache}
        setVolume={setVolume}
        useCache={useCache}
        srcListId={srcListId}
      />
    </View>
  );
};
export default BasicExample;
