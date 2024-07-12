'use strict';

import React, {FC, useCallback, useRef, useState} from 'react';

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
  TextTracks,
  ResizeMode,
  VideoTrack,
  SelectedTrack,
  SelectedVideoTrack,
  EnumValues,
} from 'react-native-video';
import styles from './styles';
import {AdditionalSourceInfo} from './types';
import {bufferConfig, srcList, textTracksSelectionBy} from './constants';
import {Overlay, toast} from './components';

type AdditionnalSourceInfo = {
  textTracks: TextTracks;
  adTagUrl: string;
  description: string;
  noView: boolean;
};

type Props = NonNullable<unknown>;

const VideoPlayer: FC<Props> = ({}) => {
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
  const [decoration, setDecoration] = useState(true);
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
  const [poster, setPoster] = useState<string | undefined>(undefined);
  const [showNotificationControls, setShowNotificationControls] =
    useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const videoRef = useRef<VideoRef>(null);
  const viewStyle = fullscreen ? styles.fullScreen : styles.halfScreen;
  const currentSrc = srcList[srcListId];
  const additional = currentSrc as AdditionalSourceInfo;

  const onAudioTracks = (data: OnAudioTracksData) => {
    const selectedTrack = data.audioTracks?.find((x: AudioTrack) => {
      return x.selected;
    });
    if (selectedTrack?.index) {
      setAudioTracks(data.audioTracks);
      setSelectedAudioTrack({
        type: SelectedTrackType.INDEX,
        value: selectedTrack.index,
      });
    } else {
      setAudioTracks(data.audioTracks);
    }
  };

  const onVideoTracks = (data: OnVideoTracksData) => {
    console.log('onVideoTracks', data.videoTracks);
    setVideoTracks(data.videoTracks);
  };

  const onTextTracks = (data: OnTextTracksData) => {
    const selectedTrack = data.textTracks?.find((x: TextTrack) => {
      return x?.selected;
    });

    if (selectedTrack?.language) {
      setTextTracks(data.textTracks);
      if (textTracksSelectionBy === 'index') {
        setSelectedTextTrack({
          type: SelectedTrackType.INDEX,
          value: selectedTrack?.index,
        });
      } else {
        setSelectedTextTrack({
          type: SelectedTrackType.LANGUAGE,
          value: selectedTrack?.language,
        });
      }
    } else {
      setTextTracks(data.textTracks);
    }
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

  const goToChannel = (channel: number) => {
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
  };

  const channelUp = useCallback(() => {
    console.log('channel up');
    goToChannel((srcListId + 1) % srcList.length);
  }, [srcListId]);

  const channelDown = useCallback(() => {
    console.log('channel down');
    goToChannel((srcListId + srcList.length - 1) % srcList.length);
  }, [srcListId]);

  return (
    <View style={styles.container}>
      {(srcList[srcListId] as AdditionalSourceInfo)?.noView ? null : (
        <TouchableOpacity style={viewStyle}>
          <Video
            showNotificationControls={showNotificationControls}
            ref={videoRef}
            source={currentSrc as ReactVideoSource}
            textTracks={additional?.textTracks}
            adTagUrl={additional?.adTagUrl}
            drm={additional?.drm}
            style={viewStyle}
            rate={rate}
            paused={paused}
            volume={volume}
            muted={muted}
            fullscreen={fullscreen}
            controls={controls}
            resizeMode={resizeMode}
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
            repeat={repeat}
            selectedTextTrack={selectedTextTrack}
            selectedAudioTrack={selectedAudioTrack}
            selectedVideoTrack={selectedVideoTrack}
            playInBackground={false}
            bufferConfig={{
              ...bufferConfig,
              cacheSizeMB: useCache ? 200 : 0,
            }}
            preventsDisplaySleepDuringVideoPlayback={true}
            poster={poster}
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
        fullscreen={fullscreen}
        duration={duration}
        decoration={decoration}
        paused={paused}
        volume={volume}
        setControls={setControls}
        poster={poster}
        setDecoration={setDecoration}
        rate={rate}
        setFullscreen={setFullscreen}
        setPaused={setPaused}
        isLoading={isLoading}
        isSeeking={isSeeking}
        setIsSeeking={setIsSeeking}
        repeat={repeat}
        setRepeat={setRepeat}
        setPoster={setPoster}
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
export default VideoPlayer;
