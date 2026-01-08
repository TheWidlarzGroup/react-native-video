import React, {useState, useCallback, useRef} from 'react';
import {StatusBar, StyleSheet, useColorScheme, View} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Video, {
  type VideoRef,
  type OnReceiveAdEventData,
  type OnProgressData,
  type OnLoadData,
  type OnVideoErrorData,
  type OnBufferData,
  type OnLoadStartData,
  type OnSeekData,
  type OnVideoAspectRatioData,
  type OnControlsVisibilityChange,
  type OnAudioFocusChangedData,
  type OnPlaybackRateChangeData,
  type OnPlaybackStateChangedData,
  type OnBandwidthUpdateData,
  type OnExternalPlaybackChangeData,
  type OnVolumeChangeData,
  type OnTextTrackDataChangedData,
  type OnTimedMetadataData,
  type OnAudioTracksData,
  type OnVideoTracksData,
  type OnTextTracksData,
  type OnPictureInPictureStatusChangedData,
  type ReactVideoSource,
} from 'react-native-video';

import {ControlPanel} from './src/components';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

interface EventLog {
  id: string;
  timestamp: number;
  type: string;
  data: unknown;
  readableTime: string;
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [eventBuffer, setEventBuffer] = useState<EventLog[]>([]);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paused, setPaused] = useState(true);
  const videoRef = useRef<VideoRef>(null);

  // Content type and input state
  const [contentType, setContentType] = useState<'vod' | 'live'>('vod');
  const [vodContentSourceId, setVodContentSourceId] = useState('2548831');
  const [vodVideoId, setVodVideoId] = useState('tears-of-steel');
  const [liveAssetKey, setLiveAssetKey] = useState('c-rArva4ShKVIAkNfy6HUQ');
  const [backupStreamUri, setBackupStreamUri] = useState('');

  // Video source state - updated when Apply button is pressed
  const [videoSource, setVideoSource] = useState<ReactVideoSource>({
    ad: {
      type: 'dai',
      contentSourceId: '2548831',
      videoId: 'tears-of-steel',
    },
  });

  const addEvent = useCallback(
    (type: string, data: unknown) => {
      const timestamp = Date.now();
      const readableTime = new Date(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newEvent: EventLog = {
        id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        type,
        data,
        readableTime,
      };

      if (isStreaming) {
        setEvents((prev) => [newEvent, ...prev]);
      } else {
        setEventBuffer((prev) => [newEvent, ...prev]);
      }
    },
    [isStreaming],
  );

  const toggleStreaming = useCallback(() => {
    setIsStreaming((prev) => {
      const newStreamingState = !prev;

      if (newStreamingState) {
        // When enabling streaming, move buffer to events and clear buffer
        setEvents((currentEvents) => [...eventBuffer, ...currentEvents]);
        setEventBuffer([]);
        addEvent('Streaming Enabled', {bufferedEvents: eventBuffer.length});
      } else {
        // When disabling streaming, add a marker event
        addEvent('Streaming Disabled', {});
      }

      return newStreamingState;
    });
  }, [eventBuffer, addEvent]);

  const handleAdEvent = useCallback(
    (event: OnReceiveAdEventData) => {
      console.log('onReceiveAdEvent', event);

      const AD_EVENTS_TO_SKIP = ['AD_PROGRESS'];
      if (event.event && AD_EVENTS_TO_SKIP.includes(event.event)) {
        return;
      }

      addEvent('Ad Event', event);
    },
    [addEvent],
  );

  const handleVideoProgress = useCallback(
    (event: OnProgressData) => {
      console.log('Video Progress', event);
      addEvent('Video Progress', event);
    },
    [addEvent],
  );

  const handleVideoLoad = useCallback(
    (event: OnLoadData) => {
      addEvent('Video Load', event);
    },
    [addEvent],
  );

  const handleVideoReady = useCallback(() => {
    addEvent('Video Ready', {});
  }, [addEvent]);

  const handleVideoEnd = useCallback(() => {
    addEvent('Video End', {});
  }, [addEvent]);

  const handleError = useCallback(
    (event: OnVideoErrorData) => {
      addEvent('Error', event);
    },
    [addEvent],
  );

  const handleBuffer = useCallback(
    (event: OnBufferData) => {
      addEvent('Buffer', event);
    },
    [addEvent],
  );

  const handleLoadStart = useCallback(
    (event: OnLoadStartData) => {
      addEvent('Load Start', event);
    },
    [addEvent],
  );

  const handleSeek = useCallback(
    (event: OnSeekData) => {
      addEvent('Seek', event);
    },
    [addEvent],
  );

  const handleAspectRatio = useCallback(
    (event: OnVideoAspectRatioData) => {
      addEvent('Aspect Ratio', event);
    },
    [addEvent],
  );

  const handleControlsVisibilityChange = useCallback(
    (event: OnControlsVisibilityChange) => {
      addEvent('Controls Visibility Change', event);
    },
    [addEvent],
  );

  const handleAudioBecomingNoisy = useCallback(() => {
    addEvent('Audio Becoming Noisy', {});
  }, [addEvent]);

  const handleAudioFocusChanged = useCallback(
    (event: OnAudioFocusChangedData) => {
      addEvent('Audio Focus Changed', event);
    },
    [addEvent],
  );

  const handlePlaybackRateChange = useCallback(
    (event: OnPlaybackRateChangeData) => {
      addEvent('Playback Rate Change', event);
    },
    [addEvent],
  );

  const handlePlaybackStateChanged = useCallback(
    (event: OnPlaybackStateChangedData) => {
      setPaused(!event.isPlaying);
      addEvent('Playback State Changed', event);
    },
    [addEvent],
  );

  const handleBandwidthUpdate = useCallback(
    (event: OnBandwidthUpdateData) => {
      addEvent('Bandwidth Update', event);
    },
    [addEvent],
  );

  const handleExternalPlaybackChange = useCallback(
    (event: OnExternalPlaybackChangeData) => {
      addEvent('External Playback Change', event);
    },
    [addEvent],
  );

  const handleVolumeChange = useCallback(
    (event: OnVolumeChangeData) => {
      addEvent('Volume Change', event);
    },
    [addEvent],
  );

  const handleTextTrackDataChanged = useCallback(
    (event: OnTextTrackDataChangedData) => {
      addEvent('Text Track Data Changed', event);
    },
    [addEvent],
  );

  const handleTimedMetadata = useCallback(
    (event: OnTimedMetadataData) => {
      addEvent('Timed Metadata', event);
    },
    [addEvent],
  );

  const handleAudioTracks = useCallback(
    (event: OnAudioTracksData) => {
      addEvent('Audio Tracks', event);
    },
    [addEvent],
  );

  const handleVideoTracks = useCallback(
    (event: OnVideoTracksData) => {
      addEvent('Video Tracks', event);
    },
    [addEvent],
  );

  const handleTextTracks = useCallback(
    (event: OnTextTracksData) => {
      addEvent('Text Tracks', event);
    },
    [addEvent],
  );

  const handleFullscreenPlayerDidDismiss = useCallback(() => {
    setIsFullscreen(false);
    addEvent('Fullscreen Player Did Dismiss', {});
  }, [addEvent]);

  const handleFullscreenPlayerWillDismiss = useCallback(() => {
    addEvent('Fullscreen Player Will Dismiss', {});
  }, [addEvent]);

  const handleFullscreenPlayerWillPresent = useCallback(() => {
    addEvent('Fullscreen Player Will Present', {});
  }, [addEvent]);

  const handleFullscreenPlayerDidPresent = useCallback(() => {
    setIsFullscreen(true);
    addEvent('Fullscreen Player Did Present', {});
  }, [addEvent]);

  const handleIdle = useCallback(() => {
    addEvent('Idle', {});
  }, [addEvent]);

  const handlePictureInPictureStatusChanged = useCallback(
    (event: OnPictureInPictureStatusChangedData) => {
      setIsPictureInPicture(event.isActive);
      addEvent('Picture In Picture Status Changed', event);
    },
    [addEvent],
  );

  const togglePictureInPicture = useCallback(() => {
    if (videoRef.current) {
      if (isPictureInPicture) {
        console.log('exitPictureInPicture');
        videoRef.current.exitPictureInPicture();
      } else {
        console.log('enterPictureInPicture');
        videoRef.current.enterPictureInPicture();
      }
    }
  }, [isPictureInPicture]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const togglePlayPause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  const applySource = useCallback(() => {
    // Update video source state based on content type
    if (contentType === 'vod') {
      setVideoSource({
        ad: {
          type: 'dai',
          contentSourceId: vodContentSourceId,
          videoId: vodVideoId,
          ...(backupStreamUri && {fallbackUri: backupStreamUri}),
        },
      });
    } else {
      setVideoSource({
        ad: {
          type: 'dai',
          assetKey: liveAssetKey,
          ...(backupStreamUri && {fallbackUri: backupStreamUri}),
        },
      });
    }

    addEvent('Source Applied', {
      contentType,
      vodContentSourceId,
      vodVideoId,
      liveAssetKey,
      backupStreamUri,
    });
  }, [
    contentType,
    vodContentSourceId,
    vodVideoId,
    liveAssetKey,
    backupStreamUri,
    addEvent,
  ]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
        },
      ]}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={videoSource}
          debug={{
            enable: true,
            thread: true,
          }}
          fullscreen={isFullscreen}
          paused={paused}
          enterPictureInPictureOnLeave={true}
          onReceiveAdEvent={handleAdEvent}
          onLoad={handleVideoLoad}
          onLoadStart={handleLoadStart}
          onProgress={handleVideoProgress}
          progressUpdateInterval={5000}
          onEnd={handleVideoEnd}
          onError={handleError}
          onBuffer={handleBuffer}
          onReadyForDisplay={handleVideoReady}
          onSeek={handleSeek}
          onAudioBecomingNoisy={handleAudioBecomingNoisy}
          onAudioFocusChanged={handleAudioFocusChanged}
          onPlaybackRateChange={handlePlaybackRateChange}
          onPlaybackStateChanged={handlePlaybackStateChanged}
          onBandwidthUpdate={handleBandwidthUpdate}
          onExternalPlaybackChange={handleExternalPlaybackChange}
          onVolumeChange={handleVolumeChange}
          onTextTrackDataChanged={handleTextTrackDataChanged}
          onTimedMetadata={handleTimedMetadata}
          onControlsVisibilityChange={handleControlsVisibilityChange}
          onAspectRatio={handleAspectRatio}
          onAudioTracks={handleAudioTracks}
          onVideoTracks={handleVideoTracks}
          onTextTracks={handleTextTracks}
          onFullscreenPlayerDidDismiss={handleFullscreenPlayerDidDismiss}
          onFullscreenPlayerWillDismiss={handleFullscreenPlayerWillDismiss}
          onFullscreenPlayerWillPresent={handleFullscreenPlayerWillPresent}
          onFullscreenPlayerDidPresent={handleFullscreenPlayerDidPresent}
          onIdle={handleIdle}
          onPictureInPictureStatusChanged={handlePictureInPictureStatusChanged}
        />
      </View>

      <ControlPanel
        isPictureInPicture={isPictureInPicture}
        isFullscreen={isFullscreen}
        paused={paused}
        isStreaming={isStreaming}
        eventBufferLength={eventBuffer.length}
        showDebug={showDebug}
        contentType={contentType}
        vodContentSourceId={vodContentSourceId}
        vodVideoId={vodVideoId}
        liveAssetKey={liveAssetKey}
        backupStreamUri={backupStreamUri}
        events={events}
        onTogglePictureInPicture={togglePictureInPicture}
        onToggleFullscreen={toggleFullscreen}
        onTogglePlayPause={togglePlayPause}
        onToggleStreaming={toggleStreaming}
        onToggleDebug={() => setShowDebug(!showDebug)}
        onContentTypeChange={setContentType}
        onVodContentSourceIdChange={setVodContentSourceId}
        onVodVideoIdChange={setVodVideoId}
        onLiveAssetKeyChange={setLiveAssetKey}
        onBackupStreamUriChange={setBackupStreamUri}
        onApplySource={applySource}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  videoContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: 200,
    backgroundColor: 'black',
    borderColor: 'gray',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});

export default App;
