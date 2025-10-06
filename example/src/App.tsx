import React from 'react';
import { Alert, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { styles } from './styles';
import {
  ActionButton,
  ControlButton,
  SwitchControl,
  ToggleButton,
} from './components/Controls';
import Slider from '@react-native-community/slider';
import {
  type VideoViewRef,
  type onLoadData,
  type onProgressData,
  type VideoPlayerStatus,
  type onVolumeChangeData,
  useVideoPlayer,
  useEvent,
  VideoView,
  type VideoConfig,
} from 'react-native-video';
import TextTrackManager from './components/TextTrackManager';
import { type VideoSettings, defaultSettings } from './types/videoSettings';
import { formatTime } from './utils/time';
import { getVideoSource } from './utils/videoSource';

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

  const addEvent = React.useCallback((message: string) => {
    const newEvent = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      timestamp: new Date().toLocaleTimeString(),
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
    (_data: onLoadData) => {
      addEvent('Player: onLoad');
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
    (_player) => {}
  );

  useEvent(player, 'onEnd', handlePlayerEnd);
  useEvent(player, 'onLoad', handlePlayerLoad);
  useEvent(player, 'onBuffer', handlePlayerBuffer);
  useEvent(player, 'onProgress', handlePlayerProgress);
  useEvent(player, 'onStatusChange', handlePlayerStatusChange);
  useEvent(player, 'onSeek', handlePlayerSeek);
  useEvent(player, 'onPlaybackStateChange', handlePlayerStateChange);
  useEvent(player, 'onVolumeChange', handleVolumeChange);

  React.useEffect(() => {
    player.volume = settings.volume;
    player.muted = settings.muted;

    if (player.isPlaying) {
      player.rate = settings.rate;
    }

    player.loop = settings.loop;
    player.playInBackground = settings.playInBackground;
    player.playWhenInactive = settings.playWhenInactive;
    player.mixAudioMode = settings.mixAudioMode;
    player.ignoreSilentSwitchMode = settings.ignoreSilentSwitchMode;
    player.showNotificationControls = settings.showNotificationControls;
  }, [settings, player]);

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
                await player.replaceSourceAsync(getVideoSource(mode));
              }}
            />
          ))}
        </View>
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
        <Text style={styles.sectionTitle}>Text Tracks</Text>
        <TextTrackManager player={player} />
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
