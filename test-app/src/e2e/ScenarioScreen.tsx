import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
// v7 API only — never <Video>, never v6 props (see e2e/CONTEXT.md)
import {
  useVideoPlayer,
  VideoView,
  type ControlsStyles,
  type VideoPlayer,
  type VideoTrack,
  type VideoViewRef,
} from 'react-native-video';
import {
  eventLog,
  PROGRESS_MARKER_SECONDS,
  STATUS_SETTLE_MS,
} from './eventLog';
import { EventLogPanel } from './EventLogPanel';
import type { ScenarioName } from './deepLink';
import {
  AUDIO_REPLACEMENT_SOURCE,
  CACHE_TOKEN,
  FIXTURE_BASE,
  RETRY_TOKEN,
  SCENARIO_SOURCES,
  scenarioSource,
} from './fixtures';

/**
 * replaceSourceAsync() is awaited here and, for a new source, followed by play() from
 * JS, so the flow needs one tap on an idle player. A separate play tap after the
 * replacement could be issued while the new source already plays, and iOS delivers such
 * taps only once the player is idle again (e2e/CONTEXT.md). The rejection handler is the
 * second `then` argument, so a failure of the play() that follows is never logged as the
 * replacement rejecting.
 */
function replaceSource(
  player: VideoPlayer,
  target: 'hls' | 'null' | 'audio-tracks' | 'cache'
) {
  const report = (phase: 'requested' | 'resolved' | 'rejected') =>
    eventLog.handle({ type: 'replaceSource', phase, source: target });
  report('requested');
  player
    .replaceSourceAsync(
      target === 'null'
        ? null
        : target === 'audio-tracks'
          ? AUDIO_REPLACEMENT_SOURCE
          : target === 'cache'
            ? SCENARIO_SOURCES['mp4-cache']
            : scenarioSource('hls')
    )
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

// Scenarios with the native controls (#5272; controlsStyles is Android only), and what each
// hides. mp4-controls hides nothing: smoke-controls-default.yaml finds every Media3 view
// there, so a hidden one in the other flows means hidden, not a wrong id.
const CONTROLS_STYLES: Partial<Record<ScenarioName, ControlsStyles>> = {
  'mp4-controls': {},
  'mp4-controls-styles': {
    hideSeekBar: true,
    hidePosition: true,
    hideDuration: true,
  },
  'mp4-controls-no-play-pause': { hidePlayPause: true },
};

const STATUS_AFTER_RELEASE_TIMEOUT_MS = 2000;
const STATUS_AFTER_RELEASE_POLL_MS = 50;

/**
 * Reads player.status once replaceSourceAsync(null) has resolved. Read, not listened
 * for: both native players detach every emitter listener while releasing, so no
 * onStatusChange can deliver the idle status (replaceSourceAsync(null) releases the native
 * player like release(), e2e/CONTEXT.md). Native defers the teardown by one main-thread
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
 * Reads player.status STATUS_SETTLE_MS after onEnd or onError (#5285). Read, not taken
 * from onStatusChange alone: the question is where the status stays, and on Android it
 * went to idle a few milliseconds after both events.
 */
function reportStatusSettled(player: VideoPlayer, after: 'end' | 'error') {
  setTimeout(() => {
    let status;
    try {
      status = player.status;
    } catch {
      return; // the scenario's player was released in the meantime
    }
    eventLog.handle({ type: 'statusSettled', after, status });
  }, STATUS_SETTLE_MS);
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

  // Set before the load, as an app does in the setup callback of useVideoPlayer.
  if (scenario === 'mp4-progress-1s') {
    player.progressUpdateInterval = 1000;
  }

  // The player has given up by the time it reports the error: count its requests then.
  if (
    scenario === 'error-503-retry' ||
    scenario === 'error-503-retry-offline'
  ) {
    player.addEventListener('onError', () => {
      fetch(`${FIXTURE_BASE}/__requests?token=${RETRY_TOKEN}`)
        .then((res) => res.json())
        .then(({ count }: { count: number }) =>
          eventLog.handle({ type: 'requestCount', count })
        )
        .catch((error) =>
          eventLog.log(`request count failed: ${String(error)}`)
        );
    });
  }

  if (scenario === 'mp4-release-mid-playback') {
    let released = false;
    player.addEventListener('onProgress', ({ currentTime }) => {
      if (!released && currentTime > PROGRESS_MARKER_SECONDS) {
        released = true;
        replaceSource(player, 'null');
      }
    });
  }

  if (scenario === 'audio-tracks-replace') {
    // Replace only once the first source has loaded and listed its two tracks, and a
    // second later, so no event of the first source can arrive after the request.
    let loaded = false;
    let listed = false;
    let replaced = false;
    const replaceWhenReady = () => {
      if (!loaded || !listed || replaced) return;
      replaced = true;
      setTimeout(() => replaceSource(player, 'audio-tracks'), 1000);
    };
    player.addEventListener('onLoad', () => {
      loaded = true;
      replaceWhenReady();
    });
    player.addEventListener('onAudioTrackChange', ({ availableTracks }) => {
      if (availableTracks.length === 2) {
        listed = true;
        replaceWhenReady();
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

/**
 * mp4-fullscreen-rotate: the app pattern from #5152. Turning the device to landscape calls
 * enterFullscreen() through the VideoView ref, turning it back to portrait calls
 * exitFullscreen(), both from JS. On Android both ran on the JS thread, and the exit
 * touched the view hierarchy and threw CalledFromWrongThreadException (a red screen in
 * debug, a crash in release) from the second rotation on. The calls are caught and
 * reported as evt-fullscreen-call-failed, so the flow can assert on it.
 */
function useFullscreenFollowsRotation(
  enabled: boolean,
  view: React.RefObject<VideoViewRef | null>
) {
  const { width, height } = useWindowDimensions();
  const entered = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    const call = (name: 'enterFullscreen' | 'exitFullscreen') => {
      try {
        view.current?.[name]();
      } catch (e) {
        eventLog.handle({
          type: 'fullscreenCallFailed',
          call: name,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    };
    if (width > height) {
      entered.current = true;
      call('enterFullscreen');
    } else if (entered.current) {
      entered.current = false;
      call('exitFullscreen');
    }
  }, [enabled, view, width, height]);
}

const FULLSCREEN_LANDSCAPE_HOLD_MS = 12000;

/**
 * mp4-fullscreen-landscape (#5286): fullscreenOrientation="landscape" with
 * fullscreenAutorotate={false}. Fullscreen opens from JS once the clip has loaded (the
 * device stays upright) and closes FULLSCREEN_LANDSCAPE_HOLD_MS later, so the flow only
 * turns the device in between. The window's shape goes to the log on every change of its
 * size or of the fullscreen state, and the markers judge it (eventLog.ts).
 */
function useFullscreenLandscape(
  enabled: boolean,
  player: VideoPlayer,
  view: React.RefObject<VideoViewRef | null>,
  fullscreen: boolean
) {
  const { width, height } = useWindowDimensions();
  useEffect(() => {
    if (!enabled) return;
    eventLog.handle({
      type: 'windowOrientation',
      landscape: width > height,
      fullscreen,
    });
  }, [enabled, width, height, fullscreen]);
  useEffect(() => {
    if (!enabled) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const call = (name: 'enterFullscreen' | 'exitFullscreen') => {
      try {
        view.current?.[name]();
      } catch (e) {
        eventLog.handle({
          type: 'fullscreenCallFailed',
          call: name,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    };
    let entered = false;
    const subscription = player.addEventListener('onLoad', () => {
      if (entered) return;
      entered = true;
      timers.push(setTimeout(() => call('enterFullscreen'), 500));
      timers.push(
        setTimeout(
          () => call('exitFullscreen'),
          500 + FULLSCREEN_LANDSCAPE_HOLD_MS
        )
      );
    });
    return () => {
      subscription.remove();
      timers.forEach(clearTimeout);
    };
  }, [enabled, player, view]);
}

/**
 * mp4-fullscreen-cycle: an app with its own fullscreen button. enterFullscreen() and
 * exitFullscreen() are called twice each through the VideoView ref, 3 s apart, starting
 * with the first onLoad. No taps: the screen is covered while fullscreen is shown, and iOS
 * would hold a tap back until playback stops. On iOS 18 the first exit was never
 * reported and the second entry was dropped; before that it showed a black screen.
 */
const FULLSCREEN_CYCLE_STEP_MS = 3000;
function useFullscreenCycle(
  enabled: boolean,
  player: VideoPlayer,
  view: React.RefObject<VideoViewRef | null>
) {
  useEffect(() => {
    if (!enabled) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const calls = [
      'enterFullscreen',
      'exitFullscreen',
      'enterFullscreen',
      'exitFullscreen',
    ] as const;
    const sub = player.addEventListener('onLoad', () => {
      if (timers.length > 0) return;
      player.loop = true;
      timers = calls.map((name, index) =>
        setTimeout(
          () => {
            eventLog.log(`call ${name}`);
            try {
              view.current?.[name]();
            } catch (e) {
              eventLog.handle({
                type: 'fullscreenCallFailed',
                call: name,
                message: e instanceof Error ? e.message : String(e),
              });
            }
          },
          (index + 1) * FULLSCREEN_CYCLE_STEP_MS
        )
      );
    });
    return () => {
      sub.remove();
      timers.forEach(clearTimeout);
    };
  }, [enabled, player, view]);
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
    id: 'btn-quality-low',
    title: 'quality low',
    press: (p) => {
      const lowest = p
        .getAvailableVideoTracks()
        .reduce<
          VideoTrack | undefined
        >((min, t) => (min === undefined || (t.height ?? Infinity) < (min.height ?? Infinity) ? t : min), undefined);
      if (lowest) p.selectVideoTrack(lowest.id);
    },
  },
  {
    id: 'btn-quality-auto',
    title: 'quality auto',
    press: (p) => p.selectVideoTrack(),
  },
  {
    id: 'btn-audio-es',
    title: 'audio es',
    press: (p) => {
      const es = p.getAvailableAudioTracks().find((t) => t.language === 'es');
      if (es) p.selectAudioTrack(es.id);
    },
  },
  {
    id: 'btn-audio-auto',
    title: 'audio auto',
    press: (p) => p.selectAudioTrack(),
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
  {
    // mp4-cache: cut the source off at the fixture server, then load it again. It can only
    // play from the disk cache now.
    id: 'btn-cache-replay',
    title: 'replay offline',
    press: (p) => {
      fetch(`${FIXTURE_BASE}/__go-offline?token=${CACHE_TOKEN}`)
        .then((res) => {
          eventLog.log(`go-offline: ${res.status}`);
          replaceSource(p, 'cache');
        })
        .catch((error) => eventLog.log(`go-offline failed: ${String(error)}`));
    },
  },
];

/**
 * The renderLoader of mp4-loader. VideoView mounts it while the source loads and unmounts
 * it once the video is ready to display; both moments go to the event log, so the flow does
 * not depend on catching the loader on screen.
 */
function LoaderProbe() {
  useEffect(() => {
    eventLog.handle({ type: 'loader', shown: true, at: Date.now() });
    return () =>
      eventLog.handle({ type: 'loader', shown: false, at: Date.now() });
  }, []);
  // The label makes the loader an element of the view hierarchy (an empty view may be
  // left out of it), so the flow's last check can see that nothing of it is left.
  return (
    <View testID="video-loader" style={styles.loader}>
      <Text testID="video-loader-label" style={styles.loaderLabel}>
        loading
      </Text>
    </View>
  );
}

// Marker derivation lives in eventLog.handle(); this only maps payloads.
function logPlayerEvents(player: VideoPlayer) {
  // Bound to this scenario: events of a player whose screen is gone are dropped.
  const handle = eventLog.forSession();
  player.addEventListener('onLoadStart', () => handle({ type: 'onLoadStart' }));
  player.addEventListener('onLoad', ({ duration }) =>
    handle({ type: 'onLoad', duration })
  );
  player.addEventListener('onProgress', ({ currentTime }) =>
    handle({ type: 'onProgress', currentTime })
  );
  player.addEventListener('onEnd', () => {
    handle({ type: 'onEnd' });
    reportStatusSettled(player, 'end');
  });
  player.addEventListener('onReadyToDisplay', () =>
    handle({ type: 'onReadyToDisplay' })
  );
  player.addEventListener('onError', (error) => {
    handle({ type: 'onError', code: error.code });
    reportStatusSettled(player, 'error');
  });
  player.addEventListener('onStatusChange', (status) =>
    handle({ type: 'onStatusChange', status })
  );
  player.addEventListener('onPlaybackStateChange', ({ isPlaying }) =>
    handle({ type: 'onPlaybackStateChange', isPlaying })
  );
  player.addEventListener('onBuffer', (buffering) =>
    handle({ type: 'onBuffer', buffering })
  );
  player.addEventListener('onSeek', (seekTime) =>
    handle({ type: 'onSeek', seekTime })
  );
  player.addEventListener('onVolumeChange', ({ muted, volume }) =>
    handle({ type: 'onVolumeChange', muted, volume })
  );
  player.addEventListener('onPlaybackRateChange', (rate) =>
    handle({ type: 'onPlaybackRateChange', rate })
  );
  player.addEventListener(
    'onVideoTrackChange',
    ({ availableTracks, selectedTrackId }) =>
      handle({
        type: 'onVideoTrackChange',
        tracks: availableTracks,
        selectedTrackId,
      })
  );
  player.addEventListener('onAudioTrackChange', ({ availableTracks }) =>
    handle({ type: 'onAudioTrackChange', tracks: availableTracks })
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
  const viewRef = useRef<VideoViewRef>(null);
  const player = useVideoPlayer(scenarioSource(scenario), (p) => {
    eventLog.reset();
    eventLog.log(`scenario:${scenario}`);
    logPlayerEvents(p);
    startScenario(scenario, p);
  });

  useFullscreenFollowsRotation(scenario === 'mp4-fullscreen-rotate', viewRef);
  useFullscreenCycle(scenario === 'mp4-fullscreen-cycle', player, viewRef);

  const [fullscreen, setFullscreen] = useState(false);
  const landscapeLocked = scenario === 'mp4-fullscreen-landscape';
  useFullscreenLandscape(landscapeLocked, player, viewRef, fullscreen);

  const onFullscreenChange = (isFullscreen: boolean) => {
    eventLog.handle({ type: 'onFullscreenChange', fullscreen: isFullscreen });
    setFullscreen(isFullscreen);
  };

  return (
    <View style={styles.screen} testID={`scenario-${scenario}`}>
      <Text>scenario:{scenario}</Text>
      <VideoView
        ref={viewRef}
        player={player}
        style={styles.video}
        resizeMode="contain"
        // #5152 needs the native controls: exitFullscreen() resets the fullscreen button
        // icon, and only a shown controller makes that touch the view hierarchy.
        controls={
          scenario === 'mp4-fullscreen-rotate' || scenario in CONTROLS_STYLES
        }
        // Android only (#5272): the smoke-controls-* flows check the native controls.
        controlsStyles={CONTROLS_STYLES[scenario]}
        onFullscreenChange={onFullscreenChange}
        renderLoader={scenario === 'mp4-loader' ? <LoaderProbe /> : undefined}
        fullscreenOrientation={landscapeLocked ? 'landscape' : undefined}
        fullscreenAutorotate={landscapeLocked ? false : undefined}
      />
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
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202020',
  },
  loaderLabel: { color: '#ffffff' },
});
