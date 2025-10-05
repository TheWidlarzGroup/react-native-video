import React, {useCallback, useRef, useState, useEffect} from 'react';

import {Platform, TouchableOpacity, View, StatusBar} from 'react-native';

// Import logging utilities - create simple inline logger for now
const logger = {
  log: (...args: any[]) => console.log('[LOG]', ...args),
  info: (...args: any[]) => console.info('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
  videoEvent: (event: string, data?: any) => console.log(`[VIDEO] ${event}`, data || ''),
  datazoom: (action: string, data?: any) => console.log(`[DATAZOOM] ${action}`, data || ''),
};

import Video, {
  Datazoom,
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

  // Add refs to store previous track data for comparison
  const previousAudioTracksRef = useRef<AudioTrack[]>([]);
  const previousTextTracksRef = useRef<TextTrack[]>([]);

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

    // Check if audio tracks have actually changed
    const currentTracks = data.audioTracks || [];
    const previousTracks = previousAudioTracksRef.current;

    // Simple comparison - check if tracks array length or selected track changed
    const tracksChanged =
      currentTracks.length !== previousTracks.length ||
      JSON.stringify(
        currentTracks.map((t) => ({
          index: t.index,
          selected: t.selected,
          language: t.language,
        })),
      ) !==
        JSON.stringify(
          previousTracks.map((t) => ({
            index: t.index,
            selected: t.selected,
            language: t.language,
          })),
        );

    if (!tracksChanged) {
      return; // Skip if tracks haven't changed
    }

    previousAudioTracksRef.current = currentTracks;

    const selectedTrack = currentTracks.find((x: AudioTrack) => {
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
    setAudioTracks(currentTracks);
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
    // Check if text tracks have actually changed
    const currentTracks = data.textTracks || [];
    const previousTracks = previousTextTracksRef.current;

    // Simple comparison - check if tracks array length or selected track changed
    const tracksChanged =
      currentTracks.length !== previousTracks.length ||
      JSON.stringify(
        currentTracks.map((t) => ({
          index: t.index,
          selected: t.selected,
          language: t.language,
        })),
      ) !==
        JSON.stringify(
          previousTracks.map((t) => ({
            index: t.index,
            selected: t.selected,
            language: t.language,
          })),
        );

    if (!tracksChanged) {
      return; // Skip if tracks haven't changed
    }

    previousTextTracksRef.current = currentTracks;

    const selectedTrack = currentTracks.find((x: TextTrack) => {
      return x?.selected;
    });

    setTextTracks(currentTracks);
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
    // Enhanced logging for video load
    logger.videoEvent('onLoad', {
      duration: data.duration,
      naturalSize: data.naturalSize,
      canPlayFastForward: data.canPlayFastForward,
      canPlayReverse: data.canPlayReverse,
      canStepForward: data.canStepForward,
      canStepBackward: data.canStepBackward,
      audioTracks: data.audioTracks?.length || 0,
      textTracks: data.textTracks?.length || 0,
      videoTracks: data.videoTracks?.length || 0,
    });
    
    setDuration(data.duration);
    onAudioTracks(data);
    onTextTracks(data);
    onVideoTracks(data);
  };

  const onProgress = (data: OnProgressData) => {
    // Log progress every 10 seconds to avoid spam
    if (Math.floor(data.currentTime) % 10 === 0 && Math.floor(data.currentTime) !== Math.floor(currentTime)) {
      logger.videoEvent('onProgress', {
        currentTime: data.currentTime,
        playableDuration: data.playableDuration,
        seekableDuration: data.seekableDuration,
        progressPercent: ((data.currentTime / duration) * 100).toFixed(1),
      });
    }
    setCurrentTime(data.currentTime);
  };

  const onSeek = (data: OnSeekData) => {
    setCurrentTime(data.currentTime);
    setIsSeeking(false);
  };

  const onVideoLoadStart = () => {
    logger.videoEvent('onLoadStart', {
      uri: currentSrc.uri,
      isNetwork: currentSrc.uri?.startsWith('http'),
      timestamp: new Date().toISOString(),
    });
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
    logger.videoEvent('onBuffer', {
      isBuffering: param.isBuffering,
      currentTime: currentTime,
      timestamp: new Date().toISOString(),
    });
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
    logger.error('Video Error:', {
      errorString: err.errorString,
      errorException: err.errorException,
      errorStackTrace: err.errorStackTrace,
      errorCode: err.errorCode,
      timestamp: new Date().toISOString(),
      videoSrc: currentSrc.uri,
    });
    console.log(JSON.stringify(err));
    toast(true, 'error: ' + JSON.stringify(err));
  };

  const onEnd = () => {
    logger.videoEvent('onEnd', {
      currentTime,
      duration,
      timestamp: new Date().toISOString(),
    });
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
    videoRef.current?.setSource({...currentSrc, bufferConfig: _bufferConfig});    
  }, [currentSrc]);

  useEffect(() => {
    (async () => {
      try {
        const config = {
          apiKey: 'f4864053-3ed0-4b94-bc19-1d130d624704'
        };
        
        logger.datazoom('initialize_start', {
          config,
          timestamp: new Date().toISOString(),
        });
        
        await Datazoom.initialize(config);
        
        logger.datazoom('initialize_success', {
          timestamp: new Date().toISOString(),
        });
        console.log('✅ Datazoom SDK initialized successfully');
      } catch (e) {
        logger.datazoom('initialize_error', {
          error: e,
          timestamp: new Date().toISOString(),
        });
        console.error('❌ Failed to initialize Datazoom', e);
      }
    })();
  }, []); 

  // Add state change logging
  const logVideoState = useCallback((action: string) => {
    logger.debug('Video State Change', {
      action,
      paused,
      currentTime,
      duration,
      rate,
      volume,
      muted,
      resizeMode,
      fullscreen,
      isLoading,
      selectedAudioTrack: selectedAudioTrack?.value,
      selectedTextTrack: selectedTextTrack?.value,
      timestamp: new Date().toISOString(),
    });
  }, [paused, currentTime, duration, rate, volume, muted, resizeMode, fullscreen, isLoading, selectedAudioTrack, selectedTextTrack]);

  // Log state changes when important properties change
  useEffect(() => {
    logVideoState('paused_changed');
  }, [paused, logVideoState]);

  useEffect(() => {
    logVideoState('rate_changed');
  }, [rate, logVideoState]);

  useEffect(() => {
    logVideoState('volume_changed');
  }, [volume, logVideoState]); 

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
