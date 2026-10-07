import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
// v7 API only — never <Video>, never v6 props (see e2e/CONTEXT.md)
import {
  useVideoPlayer,
  VideoView,
  type VideoPlayer,
} from 'react-native-video';
import { eventLog, PROGRESS_MARKER_SECONDS } from './eventLog';
import { EventLogPanel } from './EventLogPanel';
import type { ScenarioName } from './deepLink';
import { SCENARIO_SOURCES } from './fixtures';

/**
 * replaceSourceAsync() is awaited here and, for a new source, followed by play() from
 * JS, so the flow needs one tap on an idle player. A separate play tap after the
 * replacement could be issued while the new source already plays, and iOS delivers such
 * taps only once the player is idle again (e2e/CONTEXT.md). The rejection handler is the
 * second `then` argument, so a failure of the play() that follows is never logged as the
 * replacement rejecting.
 */
function replaceSource(player: VideoPlayer, target: 'hls' | 'null') {
  const report = (phase: 'requested' | 'resolved' | 'rejected') =>
    eventLog.handle({ type: 'replaceSource', phase, source: target });
  report('requested');
  player
    .replaceSourceAsync(target === 'null' ? null : SCENARIO_SOURCES.hls)
    .then(
      () => {
        report('resolved');
        if (target === 'null') {
          reportStatusAfterRelease(player);
        } else {
          try {
            player.play();
          } catch (error) {
            eventLog.log(`play after replace threw: ${String(error)}`);
          }
        }
      },
      () => report('rejected')
    );
}

const STATUS_AFTER_RELEASE_TIMEOUT_MS = 2000;
const STATUS_AFTER_RELEASE_POLL_MS = 50;

/**
 * Reads player.status once replaceSourceAsync(null) has resolved. Read, not listened
 * for: both native players detach every emitter listener while releasing, so no
 * onStatusChange can deliver the idle status (whether the player is reusable afterwards
 * is an open question, e2e/CONTEXT.md). Native defers the teardown by one main-thread
 * turn, so the status is polled briefly; the last value read is reported either way.
 */
function reportStatusAfterRelease(player: VideoPlayer) {
  const deadline = Date.now() + STATUS_AFTER_RELEASE_TIMEOUT_MS;
  const poll = () => {
    const status = player.status;
    if (status === 'idle' || Date.now() >= deadline) {
      eventLog.handle({ type: 'statusAfterRelease', status });
      return;
    }
    setTimeout(poll, STATUS_AFTER_RELEASE_POLL_MS);
  };
  poll();
}

/**
 * How a scenario starts its load once every listener is attached. The preload scenario
 * only prepares the source, so a flow can assert that nothing plays until btn-play. The
 * release scenario plays and then calls replaceSourceAsync(null) itself, from JS, once
 * playback has passed PROGRESS_MARKER_SECONDS: a release during playback proves that the
 * release stops playback (the clip must not reach its end), and needs no tap, which iOS
 * would defer until the end anyway. Every other scenario initializes and plays.
 */
function startScenario(scenario: ScenarioName, player: VideoPlayer) {
  eventLog.handle({ type: 'initialStatus', status: player.status });

  if (scenario === 'mp4-release-mid-playback') {
    let released = false;
    player.addEventListener('onProgress', ({ currentTime }) => {
      if (!released && currentTime > PROGRESS_MARKER_SECONDS) {
        released = true;
        replaceSource(player, 'null');
      }
    });
  }

  const load =
    scenario === 'mp4-preload'
      ? player.preload()
      : player.initialize().then(() => player.play());
  load.catch(() => {
    // Surfaced by the onError listener.
  });
}

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
  {
    id: 'btn-replace-hls',
    title: 'replace hls',
    press: (p) => replaceSource(p, 'hls'),
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
    startScenario(scenario, p);
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
