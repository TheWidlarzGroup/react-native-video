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
  createSource,
  useVideoPlayer,
  VideoView,
  type onLoadData,
  type onProgressData,
  type VideoPlayerStatus,
  type VideoViewRef,
} from 'react-native-video';

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const VideoDemo = () => {
  const videoViewRef = React.useRef<VideoViewRef>(null);
  const [show, setShow] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [loop, setLoop] = React.useState(false);
  const [showNativeControls, setShowNativeControls] = React.useState(false);

  // For demo: log last event
  const [lastEvent, setLastEvent] = React.useState<string>('');

  // View event handlers
  const handleFullscreenChange = React.useCallback((fullscreen: boolean) => {
    setLastEvent(
      'View: onFullscreenChange ' + (fullscreen ? 'entered' : 'exited')
    );
    console.log('Fullscreen:', fullscreen);
  }, []);

  const handlePictureInPictureChange = React.useCallback(
    (pipEnabled: boolean) => {
      setLastEvent(
        'View: onPictureInPictureChange ' + (pipEnabled ? 'entered' : 'exited')
      );
      console.log('PictureInPicture:', pipEnabled);
    },
    []
  );

  const handlePlayerEnd = React.useCallback(() => {
    setLastEvent('Player: onEnd');
    console.log('Video has ended');
  }, []);

  const handlePlayerLoad = React.useCallback((data: onLoadData) => {
    setLastEvent('Player: onLoad');
    console.log('Video loaded', data);
  }, []);

  const handlePlayerBuffer = React.useCallback((buffering: boolean) => {
    setLastEvent('Player: onBuffer ' + buffering);
    console.log('Buffering:', buffering);
  }, []);

  const handlePlayerProgress = React.useCallback((data: onProgressData) => {
    setProgress(data.currentTime);
  }, []);

  const handlePlayerStatusChange = React.useCallback(
    (status: VideoPlayerStatus) => {
      setLastEvent('Player: onStatusChange ' + status);
      console.log('Status:', status);
    },
    []
  );

  // Setup player and events
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
      _player.onEnd = handlePlayerEnd;
      _player.onLoad = handlePlayerLoad;
      _player.onBuffer = handlePlayerBuffer;
      _player.onProgress = handlePlayerProgress;
      _player.onStatusChange = handlePlayerStatusChange;
    }
  );

  // Sync volume, muted, rate with player
  React.useEffect(() => {
    if (!show) return;
    player.volume = volume;
  }, [volume, player, show]);
  React.useEffect(() => {
    if (!show) return;
    player.muted = muted;
  }, [muted, player, show]);
  React.useEffect(() => {
    if (!show) return;
    player.rate = rate;
  }, [rate, player, show]);
  React.useEffect(() => {
    if (!show) return;
    player.loop = loop;
  }, [loop, player, show]);

  // Progress state
  const [progress, setProgress] = React.useState(0);

  // Handlers
  const handleSeek = (val: number) => {
    player.seekTo(val);
    setProgress(val);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <View style={styles.card}>
        {show ? (
          <VideoView
            player={player}
            style={styles.video}
            ref={videoViewRef}
            controls={showNativeControls}
            pictureInPicture={true}
            autoEnterPictureInPicture={true}
            onFullscreenChange={handleFullscreenChange}
            onPictureInPictureChange={handlePictureInPictureChange}
          />
        ) : (
          <View style={styles.hiddenVideo}>
            <Text style={styles.hiddenVideoText}>Video Hidden</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <Text style={styles.timeText}>{formatTime(progress)}</Text>
        <Slider
          style={styles.progress}
          minimumValue={0}
          maximumValue={
            show ? (isNaN(player.duration) ? 1 : player.duration) : 0
          }
          value={progress}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#007aff"
          maximumTrackTintColor="#ccc"
          thumbTintColor="#007aff"
        />
        <Text style={styles.timeText}>
          {formatTime(show ? player.duration : 0)}
        </Text>
      </View>

      {/* Event log */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ color: '#888', fontSize: 12 }}>
          Last event: {lastEvent}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <IconButton icon="⏮" onPress={() => player.seekTo(0)} />
        <IconButton icon="⏪" onPress={() => player.seekBy(-1)} />
        <IconButton icon="⏯" onPress={() => player.play()} label="Play" />
        <IconButton icon="⏸" onPress={() => player.pause()} label="Pause" />
        <IconButton icon="⏩" onPress={() => player.seekBy(1)} />
      </View>

      {/* Volume/Mute/Speed */}
      <View style={styles.settingsRow}>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>🔊 Volume</Text>
          <Slider
            style={styles.settingSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            step={0.01}
            onValueChange={setVolume}
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>🔇 Mute</Text>
          <Switch
            value={muted}
            onValueChange={setMuted}
            style={styles.switch}
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>🔁 Loop</Text>
          <Switch value={loop} onValueChange={setLoop} style={styles.switch} />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>⏩ Speed</Text>
          <Slider
            style={styles.settingSlider}
            minimumValue={0.25}
            maximumValue={2}
            value={rate}
            step={0.25}
            onValueChange={setRate}
          />
          <Text style={styles.settingValue}>{rate}x</Text>
        </View>
      </View>

      {/* Extra actions */}
      <View style={styles.extraRow}>
        <Section title="Source">
          <ActionButton
            label="Preload"
            onPress={() => player.preload().catch(console.error)}
          />
          <ActionButton
            label="Replace Source"
            onPress={() => {
              const newSource = createSource(
                'https://www.w3schools.com/html/movie.mp4'
              );
              newSource.getAssetInformationAsync().then(console.log);
              player.replaceSourceAsync(newSource);
            }}
          />
        </Section>
        <Section title="Video">
          <ActionButton
            label={(show ? 'Hide' : 'Show') + ' Video'}
            onPress={() => setShow((prev) => !prev)}
          />
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Native Controls</Text>
            <Switch
              value={showNativeControls}
              onValueChange={setShowNativeControls}
              style={styles.switch}
            />
          </View>
        </Section>
        <Section title="Fullscreen">
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
            label="Enter Fullscreen for 5s then exit"
            onPress={() => {
              if (videoViewRef.current) {
                videoViewRef.current.enterFullscreen();

                setTimeout(() => {
                  videoViewRef.current?.exitFullscreen();
                }, 5000);
              }
            }}
          />
        </Section>
        <Section title="Picture In Picture">
          <ActionButton
            label="Enter Picture In Picture"
            onPress={() => {
              if (videoViewRef.current) {
                videoViewRef.current.enterPictureInPicture();
              } else {
                Alert.alert('No video view found');
              }
            }}
          />
          <ActionButton
            label="Can Enter Picture In Picture"
            onPress={() => {
              if (videoViewRef.current) {
                const canEnter =
                  videoViewRef.current.canEnterPictureInPicture();
                Alert.alert(
                  `${canEnter ? 'Can' : 'Cannot'} Enter Picture In Picture on this device`
                );
              } else {
                Alert.alert('No video view found');
              }
            }}
          />
          <ActionButton
            label="Exit Picture In Picture"
            onPress={() => {
              if (videoViewRef.current) {
                videoViewRef.current.exitPictureInPicture();
              } else {
                Alert.alert('No video view found');
              }
            }}
          />
        </Section>
      </View>
    </ScrollView>
  );
};

// Simple icon button
const IconButton = ({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label?: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.iconButton} onPress={onPress}>
    <Text style={styles.icon}>{icon}</Text>
    {label && <Text style={styles.iconLabel}>{label}</Text>}
  </TouchableOpacity>
);

// Simple action button
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

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.section}>{children}</View>
  </>
);

export default function App() {
  const [mounted, setMounted] = React.useState(true);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {mounted && <VideoDemo />}
      <View style={{ alignItems: 'center', margin: 12 }}>
        <ActionButton
          label={mounted ? 'Unmount Demo' : 'Mount Demo'}
          onPress={() => setMounted((prev) => !prev)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 16,
  },
  card: {
    width: 340,
    height: 220,
    backgroundColor: '#222',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  hiddenVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenVideoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 340,
    marginBottom: 8,
  },
  progress: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeText: {
    color: '#444',
    fontVariant: ['tabular-nums'],
    width: 44,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  icon: {
    fontSize: 22,
    marginRight: 2,
  },
  iconLabel: {
    fontSize: 14,
    color: '#222',
  },
  settingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    width: '100%',
    marginVertical: 8,
    gap: 8,
    paddingHorizontal: 32,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#fcfcfc',
    borderRadius: 8,
    padding: 8,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 2,
  },
  settingSlider: {
    width: 80,
    marginVertical: 2,
  },
  settingValue: {
    fontSize: 12,
    color: '#555',
  },
  switch: {
    marginHorizontal: 8,
    borderRadius: 11,
    justifyContent: 'center',
    padding: 2,
  },
  extraRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 8,
    paddingHorizontal: 32,
  },
  actionButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderColor: 'black',
    borderWidth: 1,
    elevation: 2,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
