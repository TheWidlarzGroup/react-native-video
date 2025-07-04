import Slider from '@react-native-community/slider';
import * as React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useEvent,
  useVideoPlayer,
  VideoPlayer,
  VideoView,
  type IgnoreSilentSwitchMode,
  type MixAudioMode,
  type onLoadData,
  type onProgressData,
  type ResizeMode,
  type TextTrack,
  type VideoConfig,
  type VideoPlayerStatus,
  type VideoViewRef,
} from 'react-native-video';

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// Consolidated state interface
interface VideoSettings {
  show: boolean;
  volume: number;
  muted: boolean;
  rate: number;
  loop: boolean;
  showNativeControls: boolean;
  resizeMode: ResizeMode;
  mixAudioMode: MixAudioMode;
  ignoreSilentSwitchMode: IgnoreSilentSwitchMode;
  playInBackground: boolean;
  playWhenInactive: boolean;
}

const defaultSettings: VideoSettings = {
  show: false,
  volume: 1,
  muted: false,
  rate: 1,
  loop: false,
  showNativeControls: false,
  resizeMode: 'contain',
  mixAudioMode: 'auto',
  ignoreSilentSwitchMode: 'auto',
  playInBackground: true,
  playWhenInactive: false,
};

const VideoDemo = () => {
  const videoViewRef = React.useRef<VideoViewRef>(null);
  const [settings, setSettings] =
    React.useState<VideoSettings>(defaultSettings);
  const [progress, setProgress] = React.useState(0);
  const [events, setEvents] = React.useState<
    Array<{ id: string; message: string; timestamp: string }>
  >([]);

  // Helper function to update settings
  const updateSetting = <K extends keyof VideoSettings>(
    key: K,
    value: VideoSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Helper function to add events
  const addEvent = React.useCallback((message: string) => {
    const newEvent = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // Keep latest 50 events
  }, []);

  // Event handlers
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

  // Setup player
  const player = useVideoPlayer(
    {
      uri: 'https://www.w3schools.com/html/movie.mp4',
      externalSubtitles: [
        {
          uri: 'https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt',
          label: 'External',
        },
      ],
    },
    (_player) => {
      // Setup player
    }
  );

  useEvent(player, 'onEnd', handlePlayerEnd);
  useEvent(player, 'onLoad', handlePlayerLoad);
  useEvent(player, 'onBuffer', handlePlayerBuffer);
  useEvent(player, 'onProgress', handlePlayerProgress);
  useEvent(player, 'onStatusChange', handlePlayerStatusChange);
  useEvent(player, 'onSeek', handlePlayerSeek);
  useEvent(player, 'onPlaybackStateChange', handlePlayerStateChange);

  // Sync settings with player
  React.useEffect(() => {
    if (!settings.show) return;

    player.volume = settings.volume;
    player.muted = settings.muted;
    player.rate = settings.rate;
    player.loop = settings.loop;
    player.playInBackground = settings.playInBackground;
    player.playWhenInactive = settings.playWhenInactive;
    player.mixAudioMode = settings.mixAudioMode;
    player.ignoreSilentSwitchMode = settings.ignoreSilentSwitchMode;
  }, [settings, player]);

  const handleSeek = (val: number) => {
    player.seekTo(val);
    setProgress(val);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Video Player */}
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

      {/* Progress Controls */}
      <View style={styles.section}>
        <View style={styles.progressRow}>
          <Text style={styles.timeText}>{formatTime(progress)}</Text>
          <Slider
            style={styles.progressSlider}
            minimumValue={0}
            maximumValue={
              settings.show ? (isNaN(player.duration) ? 1 : player.duration) : 0
            }
            value={progress}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#007aff"
            maximumTrackTintColor="#e1e1e1"
            thumbTintColor="#007aff"
          />
          <Text style={styles.timeText}>
            {formatTime(settings.show ? player.duration : 0)}
          </Text>
        </View>
      </View>

      {/* Transport Controls */}
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
      </View>

      {/* Display Settings */}
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

      {/* Audio Controls */}
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

      {/* Background Playback Controls */}
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
        </View>
      </View>

      {/* Audio Settings */}
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

      {/* Text Track Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Tracks</Text>
        <TextTrackManager player={player} />
      </View>

      {/* Advanced Controls */}
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

      {/* Event Log */}
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

// Reusable Components
const ControlButton = ({
  icon,
  onPress,
  size = 'normal',
}: {
  icon: string;
  onPress: () => void;
  size?: 'normal' | 'large';
}) => (
  <TouchableOpacity
    style={[
      styles.controlButton,
      size === 'large' && styles.controlButtonLarge,
    ]}
    onPress={onPress}
  >
    <Text
      style={[styles.controlIcon, size === 'large' && styles.controlIconLarge]}
    >
      {icon}
    </Text>
  </TouchableOpacity>
);

const SwitchControl = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View style={styles.switchControl}>
    <Text style={styles.switchLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#e1e1e1', true: '#007aff' }}
      thumbColor={value ? '#ffffff' : '#f4f3f4'}
    />
  </View>
);

const ToggleButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.toggleButton, active && styles.toggleButtonActive]}
    onPress={onPress}
  >
    <Text
      style={[styles.toggleButtonText, active && styles.toggleButtonTextActive]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const ActionButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Text style={styles.actionButtonText}>{label}</Text>
  </TouchableOpacity>
);

const TextTrackManager = ({ player }: { player: VideoPlayer }) => {
  const [textTracks, setTextTracks] = React.useState<TextTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = React.useState<string | null>(
    null
  );
  const [currentSelectedTrack, setCurrentSelectedTrack] =
    React.useState<TextTrack | null>(null);
  const [trackChangeEvents, setTrackChangeEvents] = React.useState<string[]>(
    []
  );

  const loadTextTracks = React.useCallback(() => {
    try {
      const tracks = player.getAvailableTextTracks();
      setTextTracks(tracks);

      // Get currently selected track using the new property
      const selectedTrack = player.selectedTrack;
      setSelectedTrackId(selectedTrack?.id || null);
      setCurrentSelectedTrack(selectedTrack || null);

      console.log('Available text tracks:', tracks);
      console.log('Currently selected track:', selectedTrack);
    } catch (error) {
      console.error('Error loading text tracks:', error);
    }
  }, [player]);

  const selectTrack = React.useCallback(
    (track: TextTrack) => {
      try {
        player.selectTextTrack(track);
        console.log('Selected text track:', track);
        // onTrackChange event will update the state automatically
      } catch (error) {
        console.error('Error selecting text track:', error);
      }
    },
    [player]
  );

  const disableTextTracks = React.useCallback(() => {
    try {
      // Pass null to disable text tracks
      player.selectTextTrack(null);
      console.log('Disabled text tracks');
      // onTrackChange event will update the state automatically
    } catch (error) {
      console.error('Error disabling text tracks:', error);
    }
  }, [player]);

  useEvent(player, 'onReadyToDisplay', () => {
    loadTextTracks();
  });

  useEvent(player, 'onTrackChange', (track) => {
    // Update state when track changes through any means (API or native controls)
    setCurrentSelectedTrack(track);
    setSelectedTrackId(track?.id || null);

    // Add to event log
    const timestamp = new Date().toLocaleTimeString();
    const eventMessage = track
      ? `${timestamp}: Track changed to "${track.label}" (${track.id})${track.id.startsWith('external-') ? ' [External]' : ''}`
      : `${timestamp}: All tracks disabled`;

    setTrackChangeEvents((prev) => [eventMessage, ...prev.slice(0, 4)]); // Keep last 5 events
  });

  return (
    <View>
      <View style={styles.buttonGroup}>
        <ActionButton label="Refresh Tracks" onPress={loadTextTracks} />
        <ActionButton label="Disable Tracks" onPress={disableTextTracks} />
        <ActionButton
          label="Sync Selection"
          onPress={() => {
            try {
              const selectedTrack = player.selectedTrack;
              setCurrentSelectedTrack(selectedTrack || null);
              setSelectedTrackId(selectedTrack?.id || null);
            } catch (error) {
              console.error('Error syncing selection:', error);
            }
          }}
        />
      </View>

      {currentSelectedTrack && (
        <View style={styles.selectedTrackInfo}>
          <Text style={styles.selectedTrackLabel}>Currently Selected:</Text>
          <Text style={styles.selectedTrackText}>
            {currentSelectedTrack.label}
            {currentSelectedTrack.language &&
              ` (${currentSelectedTrack.language})`}
            {currentSelectedTrack.id.startsWith('external-') && ' [External]'}
          </Text>
        </View>
      )}

      {trackChangeEvents.length > 0 && (
        <View style={styles.eventLogContainer}>
          <Text style={styles.eventLogTitle}>Track Change Events:</Text>
          {trackChangeEvents.map((event, index) => (
            <Text key={index} style={styles.eventLogText}>
              {event}
            </Text>
          ))}
        </View>
      )}

      {textTracks.length > 0 ? (
        <View style={styles.trackList}>
          <Text style={styles.subSectionTitle}>
            Available Tracks ({textTracks.length})
          </Text>
          {textTracks.map((track) => (
            <TouchableOpacity
              key={track.id}
              style={[
                styles.trackButton,
                selectedTrackId === track.id && styles.trackButtonSelected,
              ]}
              onPress={() => selectTrack(track)}
            >
              <Text
                style={[
                  styles.trackButtonText,
                  selectedTrackId === track.id &&
                    styles.trackButtonTextSelected,
                ]}
              >
                {track.label} {track.language && `(${track.language})`}
                {track.selected && ' ✓'}
                {track.id.startsWith('external-') && ' [External]'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          <Text style={styles.noTracksText}>No text tracks available</Text>
          <Text style={styles.noTracksSubText}>
            Make sure the video is loaded. External subtitles are loaded but not
            automatically enabled - you need to select them manually.
          </Text>
        </View>
      )}
    </View>
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

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  hiddenVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenVideoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressSlider: {
    flex: 1,
    marginHorizontal: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 50,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  transportRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  controlButtonLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007aff',
  },
  controlIcon: {
    fontSize: 20,
    color: '#333',
  },
  controlIconLarge: {
    fontSize: 28,
    color: '#fff',
  },
  audioControls: {
    gap: 16,
  },
  sliderControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 60,
  },
  slider: {
    flex: 1,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 40,
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  switchColumn: {
    flexDirection: 'column',
    gap: 8,
  },
  switchControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 120,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toggleButtonActive: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textTransform: 'capitalize',
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  eventLog: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007aff',
    height: 200,
  },
  eventLogScroll: {
    flex: 1,
    padding: 12,
  },
  eventItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  eventTime: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  eventText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  mountControl: {
    padding: 16,
    alignItems: 'center',
  },
  trackList: {
    marginTop: 12,
  },
  trackButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  trackButtonSelected: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  trackButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  noTracksText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  noTracksSubText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  selectedTrackInfo: {
    backgroundColor: '#e7f4ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007aff',
    marginBottom: 12,
  },
  selectedTrackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  selectedTrackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007aff',
  },
  eventLogContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#28a745',
    marginBottom: 12,
  },
  eventLogTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  eventLogText: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
