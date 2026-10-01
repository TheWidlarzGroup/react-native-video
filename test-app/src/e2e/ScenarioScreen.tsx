import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
// v7 API only — never <Video>, never v6 props (see e2e/CONTEXT.md)
import {
  useVideoPlayer,
  VideoView,
  type VideoPlayer,
} from 'react-native-video';
import { eventLog } from './eventLog';
import { EventLogPanel } from './EventLogPanel';
import type { ScenarioName } from './deepLink';
import { SCENARIO_SOURCES } from './fixtures';

type Control = {
  id: string;
  title: string;
  press: (player: VideoPlayer) => void;
};

// Every control sets an absolute value: a Maestro tap can be delivered long after it was
// issued (see e2e/CONTEXT.md), so none may depend on the player's state at press time.
const CONTROLS: Control[] = [
  { id: 'btn-play', title: 'play', press: (p) => p.play() },
  { id: 'btn-seek-1', title: 'seek 1s', press: (p) => p.seekTo(1) },
  { id: 'btn-seek-5', title: 'seek 5s', press: (p) => p.seekTo(5) },
  {
    id: 'btn-rate-2',
    title: 'rate 2x',
    press: (p) => {
      p.rate = 2;
    },
  },
  {
    id: 'btn-rate-0-5',
    title: 'rate 0.5x',
    press: (p) => {
      p.rate = 0.5;
    },
  },
  {
    id: 'btn-mute',
    title: 'mute',
    press: (p) => {
      p.muted = true;
    },
  },
  {
    id: 'btn-unmute',
    title: 'unmute',
    press: (p) => {
      p.muted = false;
    },
  },
  {
    id: 'btn-volume-low',
    title: 'vol .3',
    press: (p) => {
      p.muted = false;
      p.volume = 0.3;
    },
  },
  {
    id: 'btn-loop-on',
    title: 'loop',
    press: (p) => {
      eventLog.setLoopEnabled(true);
      p.loop = true;
    },
  },
];

// Marker derivation lives in eventLog.handle(); this only maps payloads.
function logPlayerEvents(player: VideoPlayer) {
  player.addEventListener('onLoad', ({ duration }) =>
    eventLog.handle({ type: 'onLoad', duration })
  );
  player.addEventListener('onProgress', ({ currentTime }) =>
    eventLog.handle({ type: 'onProgress', currentTime })
  );
  player.addEventListener('onEnd', () => eventLog.handle({ type: 'onEnd' }));
  player.addEventListener('onError', (error) =>
    eventLog.handle({ type: 'onError', code: error.code })
  );
  player.addEventListener('onStatusChange', (status) =>
    eventLog.handle({ type: 'onStatusChange', status })
  );
  player.addEventListener('onPlaybackStateChange', ({ isPlaying }) =>
    eventLog.handle({ type: 'onPlaybackStateChange', isPlaying })
  );
  player.addEventListener('onSeek', (seekTime) =>
    eventLog.handle({ type: 'onSeek', seekTime })
  );
  player.addEventListener('onVolumeChange', ({ muted, volume }) =>
    eventLog.handle({ type: 'onVolumeChange', muted, volume })
  );
  player.addEventListener('onPlaybackRateChange', (rate) =>
    eventLog.handle({ type: 'onPlaybackRateChange', rate })
  );
}

/**
 * One screen per scenario; App.tsx keys it on the scenario, so each one gets a fresh
 * player. Sources set `initializeOnCreation: false`, which makes useVideoPlayer run the
 * setup callback synchronously during the first render: the log is reset and every
 * listener attached there, before this screen starts the load itself. See e2e/CONTEXT.md
 * ("Test app gotchas") for why neither may happen later.
 */
export function ScenarioScreen({ scenario }: { scenario: ScenarioName }) {
  const player = useVideoPlayer(SCENARIO_SOURCES[scenario], (p) => {
    eventLog.reset();
    eventLog.log(`scenario:${scenario}`);
    logPlayerEvents(p);
    p.initialize()
      .then(() => p.play())
      .catch(() => {
        // Surfaced by the onError listener.
      });
  });

  return (
    <View style={styles.screen} testID={`scenario-${scenario}`}>
      <Text>scenario:{scenario}</Text>
      <VideoView player={player} style={styles.video} resizeMode="contain" />
      <View style={styles.controls}>
        {CONTROLS.map(({ id, title, press }) => (
          <Button
            key={id}
            testID={id}
            title={title}
            onPress={() => {
              eventLog.press(id, title);
              press(player);
            }}
          />
        ))}
      </View>
      {/* Text-surface of player state — everything Maestro asserts on lives here */}
      <EventLogPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  video: { width: '100%', aspectRatio: 16 / 9 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
