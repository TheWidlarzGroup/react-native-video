import Slider from '@react-native-community/slider';
import * as React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { VideoView, createSource, useVideoPlayer } from 'react-native-video';

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const VideoDemo = () => {
  const [show, setShow] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [loop, setLoop] = React.useState(false);

  const player = useVideoPlayer(
    'https://www.w3schools.com/html/mov_bbb.mp4',
    (_player) => {
      //_player.loop = loop;
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
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(
        show ? (isNaN(player.currentTime) ? 0 : player.currentTime) : 0
      );
    }, 300);
    return () => clearInterval(interval);
  }, [player, show]);

  // Handlers
  const handleSeek = (val: number) => {
    player.seekTo(val);
    setProgress(val);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {show ? (
          <VideoView player={player} style={styles.video} />
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
          onValueChange={handleSeek}
          minimumTrackTintColor="#007aff"
          maximumTrackTintColor="#ccc"
          thumbTintColor="#007aff"
        />
        <Text style={styles.timeText}>
          {formatTime(show ? player.duration : 0)}
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
        <ActionButton
          label={(show ? 'Hide' : 'Show') + ' Video'}
          onPress={() => setShow((prev) => !prev)}
        />
      </View>
    </View>
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
    alignItems: 'center',
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
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
    width: 340,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setting: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  settingLabel: {
    fontSize: 12,
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
    marginTop: 2,
  },
  switch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    padding: 2,
  },
  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    elevation: 1,
  },
  extraRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 8,
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
});
