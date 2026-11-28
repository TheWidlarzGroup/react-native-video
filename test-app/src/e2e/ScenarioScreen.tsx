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
  VideoPlayer as VideoPlayerClass,
  VideoView,
  type ControlsStyles,
  type ResizeMode,
  type VideoPlayer,
  type VideoTrack,
  type VideoViewRef,
} from 'react-native-video';
import {
  eventLog,
  LOOP_OFF_SETTLE_MS,
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
  SCENARIO_TEXT_LANGUAGES,
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
  target: 'hls' | 'mp4' | 'null' | 'audio-tracks' | 'cache'
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
            : scenarioSource(target)
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

  if (scenario === 'mp4-loop-toggle') {
    // loop switched from JS while the clip plays: on during the first pass, off once the
    // wrap was seen (the marker is derived before this listener runs: it was added first),
    // then a timer after the final onEnd, so the flow can assert that nothing restarted.
    let phase: 'first-pass' | 'looping' | 'last-pass' | 'done' = 'first-pass';
    const setLoop = (enabled: boolean) => {
      eventLog.handle({ type: 'loopSet', enabled });
      player.loop = enabled;
    };
    player.addEventListener('onProgress', ({ currentTime }) => {
      if (phase === 'first-pass' && currentTime > PROGRESS_MARKER_SECONDS) {
        phase = 'looping';
        setLoop(true);
      } else if (
        phase === 'looping' &&
        eventLog.getMarkers().has('evt-loop-wrapped')
      ) {
        phase = 'last-pass';
        setLoop(false);
      }
    });
    player.addEventListener('onEnd', () => {
      if (phase !== 'last-pass') return;
      phase = 'done';
      setTimeout(
        () => eventLog.handle({ type: 'loopOffSettled' }),
        LOOP_OFF_SETTLE_MS
      );
    });
  }

  if (scenario === 'mp4-seek-by') {
    // Relative seeks during playback, from JS: a tap would be deferred to the clip's end
    // on iOS. Each step waits until the previous landing was judged (eventLog), and the
    // request is logged before the call, because onSeek can arrive from inside it.
    const steps = [3, -2, -100];
    let next = 0;
    player.addEventListener('onProgress', ({ currentTime }) => {
      const by = steps[next];
      if (by === undefined || eventLog.isSeekByBusy()) return;
      if (next === 0 && currentTime <= PROGRESS_MARKER_SECONDS) return;
      next += 1;
      eventLog.handle({ type: 'seekByRequest', from: currentTime, by });
      try {
        player.seekBy(by);
      } catch (error) {
        eventLog.log(`seekBy(${by}) threw: ${String(error)}`);
      }
    });
  }

  if (scenario === 'error-then-recover') {
    // From JS and only once: the replacement must follow the failure whatever a tap would
    // do (iOS defers taps), and a second onError must not start a second replacement.
    let recovering = false;
    player.addEventListener('onError', () => {
      if (!recovering) {
        recovering = true;
        replaceSource(player, 'mp4');
      }
    });
  }

  if (scenario === 'mp4-replace-while-loading') {
    // Not awaited: the replacement has to find this load in flight (the fixture server
    // holds the clip back, see fixtures.ts). A superseded load only rejects; it is not a
    // failure, so onError must stay silent.
    player.initialize().then(
      () => eventLog.handle({ type: 'supersededLoad', outcome: 'resolved' }),
      () => eventLog.handle({ type: 'supersededLoad', outcome: 'rejected' })
    );
    replaceSource(player, 'hls');
    return;
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

// mp4-resize-modes: every other mode, then back to the one the screen starts with, one
// per second of playback.
const RESIZE_STEPS: readonly { mode: ResizeMode; after: number }[] = [
  { mode: 'cover', after: 1 },
  { mode: 'stretch', after: 2 },
  { mode: 'none', after: 3 },
  { mode: 'contain', after: 4 },
];

/**
 * The resizeMode for VideoView. On mp4-resize-modes it changes while the clip plays,
 * driven by playback position rather than by taps (iOS defers taps during playback). Each
 * change is logged with the position that triggered it, so the flow can assert that
 * playback went on afterwards and that nothing reloaded.
 */
function useResizeMode(enabled: boolean, player: VideoPlayer): ResizeMode {
  const [mode, setMode] = useState<ResizeMode>('contain');
  useEffect(() => {
    if (!enabled) return;
    let next = 0;
    const subscription = player.addEventListener(
      'onProgress',
      ({ currentTime }) => {
        const step = RESIZE_STEPS[next];
        if (step === undefined || currentTime <= step.after) return;
        next += 1;
        eventLog.handle({
          type: 'resizeMode',
          mode: step.mode,
          at: currentTime,
        });
        setMode(step.mode);
      }
    );
    return () => {
      try {
        subscription.remove();
      } catch {
        // The player was released first (the screen is going away): nothing to remove.
      }
    };
  }, [enabled, player]);
  return mode;
}

// The library keeps a released player's native object for 5 s (VideoPlayer.ts, __destroy);
// after that every method throws `player/released`. The call is made past that window, so
// what it does is defined by JS alone and is the same on every platform.
const RELEASED_CALL_DELAY_MS = 5500;

const errorCode = (error: unknown): string =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';

/**
 * mp4-release-reuse: once the scenario's player has played past PROGRESS_MARKER_SECONDS it
 * is released with release(), and a new VideoPlayer for the same clip takes its place on
 * the view. Returns the player to show. The second player is released when the screen goes
 * away, so it cannot play on under the next scenario.
 */
function useReleaseAndReuse(enabled: boolean, first: VideoPlayer): VideoPlayer {
  const [second, setSecond] = useState<VideoPlayer | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let created: VideoPlayer | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    first.addEventListener('onProgress', ({ currentTime }) => {
      if (created !== null || currentTime <= PROGRESS_MARKER_SECONDS) return;
      first.release();
      eventLog.log('release()');
      timer = setTimeout(() => {
        try {
          first.play();
          eventLog.handle({ type: 'releasedCall', code: null });
        } catch (error) {
          eventLog.handle({ type: 'releasedCall', code: errorCode(error) });
        }
      }, RELEASED_CALL_DELAY_MS);

      const player = new VideoPlayerClass(SCENARIO_SOURCES.mp4);
      created = player;
      player.addEventListener('onLoad', () =>
        eventLog.handle({ type: 'secondPlayer', event: 'onLoad' })
      );
      player.addEventListener('onProgress', (progress) =>
        eventLog.handle({
          type: 'secondPlayer',
          event: 'onProgress',
          currentTime: progress.currentTime,
        })
      );
      player.addEventListener('onError', () =>
        eventLog.handle({ type: 'secondPlayer', event: 'onError' })
      );
      setSecond(player);
      player
        .initialize()
        .then(() => player.play())
        .catch(() => {
          // Surfaced by the onError listener.
        });
    });
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      created?.release();
    };
  }, [enabled, first]);
  return second ?? first;
}

type Control = {
  id: string;
  title: string;
  press: (player: VideoPlayer) => void;
  // Shown only on scenarios that pass this test; every other control is on all of them.
  // Keeps the marker panel where the existing flows expect it.
  when?: (scenario: ScenarioName) => boolean;
};

const hasExternalSubtitles = (scenario: ScenarioName) =>
  SCENARIO_TEXT_LANGUAGES[scenario] !== undefined;

const TEXT_TRACKS_TIMEOUT_MS = 5000;
const TEXT_TRACKS_POLL_MS = 100;

/**
 * Reads getAvailableTextTracks() once the list has as many tracks as the scenario expects
 * and reports it; at the deadline it reports whatever is there, so a short list fails the
 * flow on its marker instead of on a timeout. Polled because the list is filled by the
 * native player on its own schedule: it is not guaranteed to be complete at onLoad.
 */
function reportTextTracks(
  player: VideoPlayer,
  expectedLanguages: readonly string[]
) {
  const deadline = Date.now() + TEXT_TRACKS_TIMEOUT_MS;
  const poll = () => {
    let tracks: ReturnType<VideoPlayer['getAvailableTextTracks']> = [];
    try {
      tracks = player.getAvailableTextTracks();
    } catch (error) {
      eventLog.log(`getAvailableTextTracks threw: ${String(error)}`);
    }
    if (tracks.length >= expectedLanguages.length || Date.now() >= deadline) {
      eventLog.handle({
        type: 'textTracks',
        tracks: tracks.map(({ id, language, selected }) => ({
          id,
          language,
          selected,
        })),
        expectedLanguages,
      });
      return;
    }
    setTimeout(poll, TEXT_TRACKS_POLL_MS);
  };
  poll();
}

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
  {
    id: 'btn-subs-es',
    title: 'subs es',
    when: hasExternalSubtitles,
    press: (p) => {
      const track = p
        .getAvailableTextTracks()
        .find((t) => (t.language ?? '').toLowerCase().startsWith('es'));
      eventLog.handle({ type: 'textTrackSelect', id: track?.id ?? null });
      if (track) p.selectTextTrack(track);
    },
  },
  {
    id: 'btn-subs-off',
    title: 'subs off',
    when: hasExternalSubtitles,
    press: (p) => {
      eventLog.handle({ type: 'textTrackClear' });
      p.selectTextTrack(null);
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
function logPlayerEvents(player: VideoPlayer, scenario: ScenarioName) {
  // Bound to this scenario: events of a player whose screen is gone are dropped.
  const handle = eventLog.forSession();
  const expectedLanguages = SCENARIO_TEXT_LANGUAGES[scenario];
  let textTracksReported = false;
  player.addEventListener('onLoadStart', () => handle({ type: 'onLoadStart' }));
  player.addEventListener('onLoad', ({ duration }) => {
    handle({ type: 'onLoad', duration });
    // Once per scenario: Android repeats onLoad after a re-buffer or a replay.
    if (expectedLanguages !== undefined && !textTracksReported) {
      textTracksReported = true;
      reportTextTracks(player, expectedLanguages);
    }
  });
  player.addEventListener('onTrackChange', (track) => {
    // Read inside the listener: by now the selection the event reports is applied, so the
    // getter has to agree with it (an immediate read after selectTextTrack() need not).
    let selectedId: string | null = null;
    try {
      selectedId = player.selectedTrack?.id ?? null;
    } catch (error) {
      eventLog.log(`selectedTrack threw: ${String(error)}`);
    }
    handle({
      type: 'onTrackChange',
      id: track?.id ?? null,
      selectedId,
    });
  });
  player.addEventListener('onProgress', ({ currentTime, bufferDuration }) =>
    handle({ type: 'onProgress', currentTime, bufferDuration })
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
  player.addEventListener('onAudioFocusChange', (hasAudioFocus) =>
    handle({ type: 'onAudioFocusChange', hasAudioFocus })
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
    logPlayerEvents(p, scenario);
    startScenario(scenario, p);
  });

  useFullscreenFollowsRotation(scenario === 'mp4-fullscreen-rotate', viewRef);
  useFullscreenCycle(scenario === 'mp4-fullscreen-cycle', player, viewRef);
  const resizeMode = useResizeMode(scenario === 'mp4-resize-modes', player);
  const shownPlayer = useReleaseAndReuse(
    scenario === 'mp4-release-reuse',
    player
  );

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
        player={shownPlayer}
        style={styles.video}
        resizeMode={resizeMode}
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
        {CONTROLS.filter(
          ({ when }) => when === undefined || when(scenario)
        ).map(({ id, title, press }) => (
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
