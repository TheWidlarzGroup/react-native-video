import Slider from '@react-native-community/slider';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {
  type ControlsStyles,
  type VideoConfig,
  type VideoLoaderProps,
  type VideoPlayerStatus,
  type VideoRuntimeError,
  VideoView,
  type VideoViewRef,
  type onLoadData,
  type onLoadStartData,
  type onProgressData,
  type onVolumeChangeData,
  useEvent,
  useVideoPlayer,
} from 'react-native-video';
import {
  ActionButton,
  ControlButton,
  OptionGroup,
  SwitchControl,
  ToggleButton,
} from './components/Controls';
import AudioTrackManager from './components/AudioTrackManager';
import TextTrackManager from './components/TextTrackManager';
import VideoQualityManager from './components/VideoQualityManager';
import { styles } from './styles';
import {
  type SourceOptions,
  type VideoSettings,
  defaultSettings,
} from './types/videoSettings';
import { formatTime } from './utils/time';
import { getVideoSource } from './utils/videoSource';

// The artwork of the sample sources, used as the poster.
const POSTER_URI =
  'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg';

const VideoLoader = ({ style }: VideoLoaderProps) => (
  <View style={[style as StyleProp<ViewStyle>, styles.loader]}>
    <ActivityIndicator color="#ffffff" />
    <Text style={styles.loaderText}>renderLoader</Text>
  </View>
);

// Native controls elements, as ControlsStyles keys (Android).
const CONTROLS_STYLES_OPTIONS: ReadonlyArray<
  readonly [keyof ControlsStyles, string]
> = [
  ['hideSeekBar', 'Hide Seek Bar'],
  ['hidePosition', 'Hide Position'],
  ['hideDuration', 'Hide Duration'],
  ['hidePlayPause', 'Hide Play/Pause'],
  ['hideForward', 'Hide Forward'],
  ['hideRewind', 'Hide Rewind'],
  ['hideFullscreen', 'Hide Fullscreen Button'],
  ['hideSettingButton', 'Hide Settings Button'],
  ['hideNavigationBarOnFullScreenMode', 'Hide Navigation Bar in Fullscreen'],
  ['hideNotificationBarOnFullScreenMode', 'Hide Status Bar in Fullscreen'],
];

const timestamp = () => {
  const now = new Date();
  return `${now.toLocaleTimeString()}.${String(now.getMilliseconds()).padStart(3, '0')}`;
};

const VideoDemo = () => {
  const videoViewRef = React.useRef<VideoViewRef>(null);
  const [settings, setSettings] =
    React.useState<VideoSettings>(defaultSettings);
  const [progress, setProgress] = React.useState(0);
  const [events, setEvents] = React.useState<
    Array<{ id: string; message: string; timestamp: string }>
  >([]);

  const updateSetting = <K extends keyof VideoSettings>(
    key: K,
    value: VideoSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateSource = <K extends keyof SourceOptions>(
    key: K,
    value: SourceOptions[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      source: { ...prev.source, [key]: value },
    }));
  };

  const updateControlsStyle = (key: keyof ControlsStyles, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      controlsStyles: { ...prev.controlsStyles, [key]: value },
    }));
  };

  const addEvent = React.useCallback((message: string) => {
    const newEvent = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      timestamp: timestamp(),
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
  }, []);

  const handleFullscreenChange = React.useCallback(
    (fullscreen: boolean) => {
      addEvent(
        'View: onFullscreenChange ' + (fullscreen ? 'entered' : 'exited')
      );
    },
    [addEvent]
  );

  const handlePictureInPictureChange = React.useCallback(
    (pipEnabled: boolean) => {
      addEvent(
        'View: onPictureInPictureChange ' + (pipEnabled ? 'entered' : 'exited')
      );
    },
    [addEvent]
  );

  const handlePlayerEnd = React.useCallback(() => {
    addEvent('Player: onEnd');
  }, [addEvent]);

  const handlePlayerLoad = React.useCallback(
    (data: onLoadData) => {
      addEvent(
        `Player: onLoad duration=${data.duration.toFixed(2)}s ${data.width}x${data.height}`
      );
    },
    [addEvent]
  );

  const handlePlayerLoadStart = React.useCallback(
    (data: onLoadStartData) => {
      addEvent(`Player: onLoadStart ${data.sourceType}`);
    },
    [addEvent]
  );

  const handlePlayerReadyToDisplay = React.useCallback(() => {
    addEvent('Player: onReadyToDisplay');
  }, [addEvent]);

  const handlePlayerError = React.useCallback(
    (error: VideoRuntimeError) => {
      addEvent(`Player: onError ${error.code} ${error.message}`);
    },
    [addEvent]
  );

  const handleAudioFocusChange = React.useCallback(
    (hasAudioFocus: boolean) => {
      addEvent(`Player: onAudioFocusChange ${hasAudioFocus}`);
    },
    [addEvent]
  );

  const handleAudioBecomingNoisy = React.useCallback(() => {
    addEvent('Player: onAudioBecomingNoisy');
  }, [addEvent]);

  const handlePlaybackRateChange = React.useCallback(
    (rate: number) => {
      addEvent(`Player: onPlaybackRateChange ${rate}`);
    },
    [addEvent]
  );

  const handleExternalPlaybackChange = React.useCallback(
    (active: boolean) => {
      addEvent(`Player: onExternalPlaybackChange ${active}`);
    },
    [addEvent]
  );

  const handlePlayerBuffer = React.useCallback(
    (buffering: boolean) => {
      addEvent('Player: onBuffer ' + buffering);
    },
    [addEvent]
  );

  const handlePlayerProgress = React.useCallback((data: onProgressData) => {
    setProgress(data.currentTime);
  }, []);

  const handlePlayerStatusChange = React.useCallback(
    (status: VideoPlayerStatus) => {
      addEvent('Player: onStatusChange ' + status);
    },
    [addEvent]
  );

  const handlePlayerSeek = React.useCallback(
    (time: number) => {
      addEvent(`Player: onSeek ${time.toFixed(2)}s`);
    },
    [addEvent]
  );

  const handlePlayerStateChange = React.useCallback(
    (state: { isPlaying: boolean; isBuffering: boolean }) => {
      addEvent(
        `Player: onPlaybackStateChange isPlaying=${state.isPlaying}, isBuffering=${state.isBuffering}`
      );
    },
    [addEvent]
  );

  const handleVolumeChange = React.useCallback(
    ({ muted, volume }: onVolumeChangeData) => {
      addEvent(`Player: onVolumeChange ${volume.toFixed(2)} isMuted=${muted}`);
    },
    [addEvent]
  );

  const player = useVideoPlayer(
    getVideoSource(defaultSettings.videoType),
    (_player) => {
      player.seekTo(1);
    }
  );

  useEvent(player, 'onEnd', handlePlayerEnd);
  useEvent(player, 'onLoad', handlePlayerLoad);
  useEvent(player, 'onBuffer', handlePlayerBuffer);
  useEvent(player, 'onProgress', handlePlayerProgress);
  useEvent(player, 'onStatusChange', handlePlayerStatusChange);
  useEvent(player, 'onSeek', handlePlayerSeek);
  useEvent(player, 'onPlaybackStateChange', handlePlayerStateChange);
  useEvent(player, 'onVolumeChange', handleVolumeChange);
  useEvent(player, 'onLoadStart', handlePlayerLoadStart);
  useEvent(player, 'onReadyToDisplay', handlePlayerReadyToDisplay);
  useEvent(player, 'onError', handlePlayerError);
  useEvent(player, 'onAudioFocusChange', handleAudioFocusChange);
  useEvent(player, 'onAudioBecomingNoisy', handleAudioBecomingNoisy);
  useEvent(player, 'onPlaybackRateChange', handlePlaybackRateChange);
  useEvent(player, 'onExternalPlaybackChange', handleExternalPlaybackChange);

  // Volume and muted have their own effect: iOS sends onVolumeChange on every write, also
  // when the value does not change, so writing them on any other setting flooded the log.
  React.useEffect(() => {
    player.volume = settings.volume;
    player.muted = settings.muted;
  }, [settings.volume, settings.muted, player]);

  React.useEffect(() => {
    if (player.isPlaying) {
      player.rate = settings.rate;
    }

    player.loop = settings.loop;
    player.playInBackground = settings.playInBackground;
    player.playWhenInactive = settings.playWhenInactive;
    player.mixAudioMode = settings.mixAudioMode;
    player.ignoreSilentSwitchMode = settings.ignoreSilentSwitchMode;
    player.showNotificationControls = settings.showNotificationControls;
    player.audioOutput = settings.audioOutput;
    player.allowsExternalPlayback = settings.allowsExternalPlayback;
    // Back to the platform default when nothing is chosen
    player.progressUpdateInterval =
      settings.progressUpdateInterval ?? (Platform.OS === 'ios' ? 500 : 250);
  }, [settings, player]);

  const applySourceOptions = async () => {
    try {
      await player.replaceSourceAsync(
        getVideoSource(settings.videoType, settings.source)
      );
      addEvent('Source options applied');
    } catch (error) {
      console.error('Error replacing source:', error);
    }
  };

  const handleSeek = (val: number) => {
    player.seekTo(val);
    setProgress(val);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.videoContainer}>
        {settings.show ? (
          <VideoView
            player={player}
            style={styles.video}
            ref={videoViewRef}
            controls={settings.showNativeControls}
            pictureInPicture={true}
            autoEnterPictureInPicture={true}
            onFullscreenChange={handleFullscreenChange}
            onPictureInPictureChange={handlePictureInPictureChange}
            resizeMode={settings.resizeMode}
            surfaceType={settings.surfaceType}
            fullscreenOrientation={settings.fullscreenOrientation}
            fullscreenAutorotate={settings.fullscreenAutorotate}
            controlsStyles={settings.controlsStyles}
            poster={settings.poster ? POSTER_URI : undefined}
            posterResizeMode={
              settings.poster ? settings.posterResizeMode : undefined
            }
            renderLoader={settings.renderLoader ? VideoLoader : undefined}
            shutterColor={settings.shutterColor ?? undefined}
            hideShutterView={settings.hideShutterView}
          />
        ) : (
          <View style={styles.hiddenVideo}>
            <Text style={styles.hiddenVideoText}>Video Hidden</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.progressRow}>
          <Text style={styles.timeText}>{formatTime(progress)}</Text>
          <Slider
            style={styles.progressSlider}
            minimumValue={0}
            maximumValue={isNaN(player.duration) ? 1 : player.duration}
            value={progress}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#007aff"
            maximumTrackTintColor="#e1e1e1"
            thumbTintColor="#007aff"
          />
          <Text style={styles.timeText}>{formatTime(player.duration)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.transportRow}>
          <ControlButton icon="⏮" onPress={() => player.seekTo(0)} />
          <ControlButton icon="⏪" onPress={() => player.seekBy(-10)} />
          <ControlButton
            icon="⏯"
            onPress={() => (player.isPlaying ? player.pause() : player.play())}
            size="large"
          />
          <ControlButton icon="⏩" onPress={() => player.seekBy(10)} />
        </View>
        <Text style={styles.subSectionTitle}>Video Type</Text>
        <View style={styles.buttonGroup}>
          {(['hls', 'mp4', 'drm'] as const).map((mode) => (
            <ToggleButton
              key={mode}
              label={mode}
              active={settings.videoType === mode}
              onPress={async () => {
                updateSetting('videoType', mode);
                try {
                  await player.replaceSourceAsync(
                    getVideoSource(mode, settings.source)
                  );
                } catch (error) {
                  console.error('Error replacing source:', error);
                }
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Video Quality</Text>
        <VideoQualityManager player={player} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display Settings</Text>

        <View style={styles.switchRow}>
          <SwitchControl
            label="Show Video"
            value={settings.show}
            onValueChange={(value) => updateSetting('show', value)}
          />
          <SwitchControl
            label="Native Controls"
            value={settings.showNativeControls}
            onValueChange={(value) =>
              updateSetting('showNativeControls', value)
            }
          />
        </View>

        <Text style={styles.subSectionTitle}>Resize Mode</Text>
        <View style={styles.buttonGroup}>
          {(['contain', 'cover', 'stretch', 'none'] as const).map((mode) => (
            <ToggleButton
              key={mode}
              label={mode}
              active={settings.resizeMode === mode}
              onPress={() => updateSetting('resizeMode', mode)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Controls</Text>
        <View style={styles.audioControls}>
          <View style={styles.sliderControl}>
            <Text style={styles.controlLabel}>Volume</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={settings.volume}
              step={0.01}
              onValueChange={(value) => updateSetting('volume', value)}
              minimumTrackTintColor="#007aff"
              maximumTrackTintColor="#e1e1e1"
              thumbTintColor="#007aff"
            />
            <Text style={styles.valueText}>
              {Math.round(settings.volume * 100)}%
            </Text>
          </View>

          <View style={styles.sliderControl}>
            <Text style={styles.controlLabel}>Speed</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.25}
              maximumValue={2}
              value={settings.rate}
              step={0.25}
              onValueChange={(value) => updateSetting('rate', value)}
              minimumTrackTintColor="#007aff"
              maximumTrackTintColor="#e1e1e1"
              thumbTintColor="#007aff"
            />
            <Text style={styles.valueText}>{settings.rate}x</Text>
          </View>
        </View>

        <View style={styles.switchRow}>
          <SwitchControl
            label="Muted"
            value={settings.muted}
            onValueChange={(value) => updateSetting('muted', value)}
          />
          <SwitchControl
            label="Loop"
            value={settings.loop}
            onValueChange={(value) => updateSetting('loop', value)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Playback</Text>
        <View style={styles.switchColumn}>
          <SwitchControl
            label="Play in Background"
            value={settings.playInBackground}
            onValueChange={(value) => updateSetting('playInBackground', value)}
          />
          <SwitchControl
            label="Play When Inactive"
            value={settings.playWhenInactive}
            onValueChange={(value) => updateSetting('playWhenInactive', value)}
          />
          <SwitchControl
            label="Notification Controls"
            value={settings.showNotificationControls}
            onValueChange={(value) =>
              updateSetting('showNotificationControls', value)
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Settings</Text>

        <Text style={styles.subSectionTitle}>Mix Audio Mode</Text>
        <View style={styles.buttonGroup}>
          {(['mixWithOthers', 'doNotMix', 'duckOthers', 'auto'] as const).map(
            (mode) => (
              <ToggleButton
                key={mode}
                label={mode}
                active={settings.mixAudioMode === mode}
                onPress={() => updateSetting('mixAudioMode', mode)}
              />
            )
          )}
        </View>

        <Text style={styles.subSectionTitle}>Silent Switch Mode</Text>
        <View style={styles.buttonGroup}>
          {(['auto', 'ignore', 'obey'] as const).map((mode) => (
            <ToggleButton
              key={mode}
              label={mode}
              active={settings.ignoreSilentSwitchMode === mode}
              onPress={() => updateSetting('ignoreSilentSwitchMode', mode)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Options</Text>

        <OptionGroup
          title="Audio Output"
          options={[
            ['speaker', 'speaker'],
            ['earpiece', 'earpiece'],
          ]}
          value={settings.audioOutput}
          onChange={(value) => updateSetting('audioOutput', value)}
        />

        <OptionGroup
          title="Progress Update Interval"
          options={[
            [null, 'default'],
            [100, '100 ms'],
            [1000, '1000 ms'],
          ]}
          value={settings.progressUpdateInterval}
          onChange={(value) => updateSetting('progressUpdateInterval', value)}
        />

        <View style={styles.switchColumn}>
          <SwitchControl
            label="Allows External Playback (iOS, AirPlay)"
            value={settings.allowsExternalPlayback}
            onValueChange={(value) =>
              updateSetting('allowsExternalPlayback', value)
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Source Options</Text>

        <View style={styles.switchColumn}>
          <SwitchControl
            label="External Subtitles"
            value={settings.source.externalSubtitles}
            onValueChange={(value) => updateSource('externalSubtitles', value)}
          />
          <SwitchControl
            label="Should Cache (progressive files only)"
            value={settings.source.shouldCache}
            onValueChange={(value) => updateSource('shouldCache', value)}
          />
          <SwitchControl
            label="Disable Disconnect Error (Android)"
            value={settings.source.disableDisconnectError}
            onValueChange={(value) =>
              updateSource('disableDisconnectError', value)
            }
          />
        </View>
        <Text style={styles.hint}>
          A source with external subtitles is never cached: turn them off to try
          Should Cache.
        </Text>

        <OptionGroup
          title="Start Position"
          options={[
            [null, 'off'],
            [2000, '2 s'],
            [10000, '10 s'],
          ]}
          value={settings.source.startPosition}
          onChange={(value) => updateSource('startPosition', value)}
        />
        <OptionGroup
          title="Crop Start"
          options={[
            [null, 'off'],
            [1000, '1 s'],
            [5000, '5 s'],
          ]}
          value={settings.source.cropStart}
          onChange={(value) => updateSource('cropStart', value)}
        />
        <OptionGroup
          title="Crop End"
          options={[
            [null, 'off'],
            [8000, '8 s'],
            [20000, '20 s'],
          ]}
          value={settings.source.cropEnd}
          onChange={(value) => updateSource('cropEnd', value)}
        />
        <Text style={styles.hint}>
          Milliseconds, as in v6. startPosition counts from cropStart. The MP4
          is 10 s long.
        </Text>

        <OptionGroup
          title="Min Load Retry Count (Android)"
          options={[
            [null, 'default'],
            [0, '0'],
            [10, '10'],
          ]}
          value={settings.source.minLoadRetryCount}
          onChange={(value) => updateSource('minLoadRetryCount', value)}
        />
        <OptionGroup
          title="Type (Android)"
          options={[
            [null, 'from URL'],
            ['m3u8', 'm3u8'],
            ['mpd', 'mpd'],
            ['mp4', 'mp4'],
          ]}
          value={settings.source.type}
          onChange={(value) => updateSource('type', value)}
        />
        <OptionGroup
          title="CMCD (Android)"
          options={[
            ['off', 'off'],
            ['query', 'query'],
            ['header', 'header'],
          ]}
          value={settings.source.cmcd}
          onChange={(value) => updateSource('cmcd', value)}
        />
        <OptionGroup
          title="Buffering Strategy (Android)"
          options={[
            ['default', 'default'],
            ['disableBuffering', 'disableBuffering'],
            ['dependingOnMemory', 'dependingOnMemory'],
          ]}
          value={settings.source.bufferingStrategy}
          onChange={(value) => updateSource('bufferingStrategy', value)}
        />

        <View style={styles.actionGrid}>
          <ActionButton
            label="Apply Source Options"
            onPress={applySourceOptions}
          />
        </View>
        <Text style={styles.hint}>
          Source options apply when a source loads: here, or when you pick a
          video type.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>View Options</Text>

        <OptionGroup
          title="Fullscreen Orientation"
          options={[
            ['all', 'all'],
            ['landscape', 'landscape'],
            ['portrait', 'portrait'],
          ]}
          value={settings.fullscreenOrientation}
          onChange={(value) => updateSetting('fullscreenOrientation', value)}
        />
        <View style={styles.switchColumn}>
          <SwitchControl
            label="Fullscreen Autorotate"
            value={settings.fullscreenAutorotate}
            onValueChange={(value) =>
              updateSetting('fullscreenAutorotate', value)
            }
          />
        </View>

        <OptionGroup
          title="Surface Type (Android)"
          options={[
            ['surface', 'surface'],
            ['texture', 'texture'],
            ['secureSurface', 'secureSurface'],
          ]}
          value={settings.surfaceType}
          onChange={(value) => updateSetting('surfaceType', value)}
        />

        <Text style={styles.subSectionTitle}>
          Controls Styles (Android, with Native Controls)
        </Text>
        <View style={styles.switchColumn}>
          {CONTROLS_STYLES_OPTIONS.map(([key, label]) => (
            <SwitchControl
              key={key}
              label={label}
              value={settings.controlsStyles[key] === true}
              onValueChange={(value) => updateControlsStyle(key, value)}
            />
          ))}
        </View>

        <Text style={styles.subSectionTitle}>Poster, Loader and Shutter</Text>
        <View style={styles.switchColumn}>
          <SwitchControl
            label="Poster"
            value={settings.poster}
            onValueChange={(value) => updateSetting('poster', value)}
          />
          <SwitchControl
            label="Render Loader (instead of the poster)"
            value={settings.renderLoader}
            onValueChange={(value) => updateSetting('renderLoader', value)}
          />
          <SwitchControl
            label="Hide Shutter View"
            value={settings.hideShutterView}
            onValueChange={(value) => updateSetting('hideShutterView', value)}
          />
        </View>
        <OptionGroup
          title="Poster Resize Mode"
          options={[
            ['contain', 'contain'],
            ['cover', 'cover'],
            ['stretch', 'stretch'],
            ['center', 'center'],
          ]}
          value={settings.posterResizeMode}
          onChange={(value) => updateSetting('posterResizeMode', value)}
        />
        <OptionGroup
          title="Shutter Color"
          options={[
            [null, 'none'],
            ['black', 'black'],
            ['#1e3a8a', 'blue'],
          ]}
          value={settings.shutterColor}
          onChange={(value) => updateSetting('shutterColor', value)}
        />
        <Text style={styles.hint}>
          The cover shows until the first frame and comes back with the next
          source. Set these before Show Video: with one of them on when the view
          mounts, style goes to a wrapper view.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Tracks</Text>
        <TextTrackManager player={player} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Tracks</Text>
        <AudioTrackManager player={player} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced Controls</Text>

        <View style={styles.actionGrid}>
          <ActionButton
            label="Preload"
            onPress={() => player.preload().catch(console.error)}
          />
          <ActionButton
            label="Replace Source"
            onPress={() => {
              const newSource = {
                uri: 'https://playertest.longtailvideo.com/adaptive/elephants_dream_v4/index.m3u8',
                externalSubtitles: [
                  {
                    uri: 'https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt',
                    label: 'External English',
                    language: 'en',
                    type: 'vtt',
                  },
                  {
                    uri: 'https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_fr.vtt',
                    label: 'External French',
                    language: 'External French',
                    type: 'vtt',
                  },
                ],
              } satisfies VideoConfig;
              player.replaceSourceAsync(newSource);
            }}
          />
          <ActionButton
            label="Get Source Asset Info"
            onPress={() => {
              player.source
                .getAssetInformationAsync()
                .then((info) => {
                  console.log('Asset info:', info);
                })
                .catch((error) => {
                  console.error('Error getting asset info:', error);
                });
            }}
          />
          <ActionButton
            label="Enter Fullscreen"
            onPress={() => {
              if (videoViewRef.current) {
                videoViewRef.current.enterFullscreen();
              } else {
                Alert.alert('No video view found');
              }
            }}
          />
          <ActionButton
            label="Enter PiP"
            onPress={() => {
              if (videoViewRef.current) {
                videoViewRef.current.enterPictureInPicture();
              } else {
                Alert.alert('No video view found');
              }
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Log</Text>
        <View style={styles.actionGrid}>
          <ActionButton label="Clear Log" onPress={() => setEvents([])} />
        </View>
        <View style={styles.eventLog}>
          <ScrollView
            style={styles.eventLogScroll}
            showsVerticalScrollIndicator={true}
          >
            {events.length === 0 ? (
              <Text style={styles.eventText}>No events yet</Text>
            ) : (
              events.map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <Text style={styles.eventTime}>{event.timestamp}</Text>
                  <Text style={styles.eventText}>{event.message}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

export default function App() {
  const [mounted, setMounted] = React.useState(true);

  return (
    <SafeAreaView style={styles.app}>
      {mounted && <VideoDemo />}
      <View style={styles.mountControl}>
        <ActionButton
          label={mounted ? 'Unmount Demo' : 'Mount Demo'}
          onPress={() => setMounted((prev) => !prev)}
        />
      </View>
    </SafeAreaView>
  );
}
