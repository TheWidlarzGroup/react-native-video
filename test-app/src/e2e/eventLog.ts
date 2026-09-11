/**
 * Minimal event log store for E2E.
 * Design goal: expose player state as TEXT with stable testIDs so Maestro can assert on it.
 * Two surfaces:
 *  - markers: monotonic booleans ("this event type has happened at least once",
 *    or a derived condition like progress > 2s). Constant testIDs -> trivial assertions.
 *  - entries: human-readable chronological log (debugging, screenshots in CI artifacts).
 *
 * All marker derivation happens in `handle()`, a pure function of the event sequence, so
 * it is unit-tested without React Native (eventLog.test.ts). ScenarioScreen only maps the
 * player's listener payloads onto `PlayerEvent`s.
 */

export type MarkerId =
  | 'evt-onLoad'
  | 'evt-onProgress'
  | 'evt-progress-gt-2s'
  | 'evt-onEnded'
  | 'evt-onError'
  | 'evt-onPlaybackStateChanged'
  | 'evt-source-replaced' // reserved for replaceSourceAsync coverage
  | 'evt-playing' // isPlaying seen true at least once
  | 'evt-paused' // isPlaying seen false after having been true (real pause, not initial state)
  | 'evt-resumed' // isPlaying seen true again after evt-paused
  | 'evt-onSeek'
  | 'evt-seek-fwd-landed' // first onProgress after an onSeek reports currentTime > 4s
  | 'evt-seek-back-landed' // first onProgress after an onSeek reports currentTime < 2s
  | 'evt-muted'
  | 'evt-unmuted' // muted:false after evt-muted (real unmute, not the initial default)
  | 'evt-volume-low' // onVolumeChange volume <= 0.35 while not muted
  | 'evt-rate-2x'
  | 'evt-rate-0-5x'
  | 'evt-loop-verified'; // an unassisted loop restart: see LOOP_VERIFIED_END_COUNT and
// the wrap-around rule in handle('onProgress') — AVPlayer reports each loop as onEnd,
// ExoPlayer wraps silently, so both are covered (see smoke-loop.yaml)

export type PlayerEvent =
  | { type: 'onLoad'; duration?: number }
  | { type: 'onProgress'; currentTime: number }
  | { type: 'onEnd' }
  | { type: 'onError'; code: string }
  | { type: 'onStatusChange'; status: string }
  | { type: 'onPlaybackStateChange'; isPlaying: boolean }
  | { type: 'onSeek'; seekTime: number }
  | { type: 'onVolumeChange'; muted: boolean; volume: number }
  | { type: 'onPlaybackRateChange'; rate: number };

// btn-rate-cycle steps through these. The next value is tracked in JS, never derived
// from player.rate at press time: a tap issued mid-playback is only delivered once the
// player goes idle, when the native rate reads 0 (see CONTEXT.md).
export const RATE_STEPS = [2, 0.5, 1] as const;
export const PROGRESS_MARKER_SECONDS = 2;
export const SEEK_FORWARD_LANDED_SECONDS = 4;
export const SEEK_BACK_LANDED_SECONDS = 2;
export const VOLUME_LOW_THRESHOLD = 0.35;
export const LOOP_VERIFIED_END_COUNT = 3;
// A loop wrap-around: progress was near the end of the 8 s clip and is now near its
// start, with loop enabled and no seek pending. A manual seek to 1 s (btn-seek-1) never
// lands below LOOP_WRAP_TO_SECONDS, so it cannot be mistaken for a wrap.
export const LOOP_WRAP_FROM_SECONDS = 6;
export const LOOP_WRAP_TO_SECONDS = 0.75;

type Listener = () => void;

const state = {
  markers: new Set<MarkerId>(),
  entries: [] as string[],
  errorCode: '' as string,
  // Derived-marker bookkeeping; cleared by reset() with everything else.
  endCount: 0,
  loopEnabled: false,
  seekPending: false,
  lastProgress: null as number | null,
};

const listeners = new Set<Listener>();
const MAX_ENTRIES = 50;

function emit() {
  listeners.forEach((l) => l());
}

function mark(id: MarkerId) {
  if (!state.markers.has(id)) {
    // useSyncExternalStore bails out on an unchanged snapshot reference,
    // so mutations must produce a new Set/array, never mutate in place.
    state.markers = new Set(state.markers).add(id);
    emit();
  }
}

function has(id: MarkerId) {
  return state.markers.has(id);
}

function log(line: string) {
  const next = [
    ...state.entries,
    `${new Date().toISOString().slice(11, 23)} ${line}`,
  ];
  state.entries =
    next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
  emit();
}

function setErrorCode(code: string) {
  state.errorCode = code;
  emit();
}

function handle(event: PlayerEvent) {
  switch (event.type) {
    case 'onLoad':
      mark('evt-onLoad');
      log(`onLoad duration=${event.duration ?? '?'}`);
      return;

    case 'onProgress': {
      mark('evt-onProgress');
      const t = event.currentTime;
      // derived markers: assert text, not numbers
      if (t > PROGRESS_MARKER_SECONDS) mark('evt-progress-gt-2s');
      // The seek markers are derived from the FIRST progress after an onSeek, so
      // natural playback can never satisfy them: a forward seek must report > 4 s, a
      // backward one < 2 s.
      if (state.seekPending) {
        state.seekPending = false;
        if (t > SEEK_FORWARD_LANDED_SECONDS) mark('evt-seek-fwd-landed');
        if (t < SEEK_BACK_LANDED_SECONDS) mark('evt-seek-back-landed');
      } else if (
        // Loop on Android (ExoPlayer repeat mode) restarts without onEnd or onSeek: the
        // only trace is progress jumping from the end back to the start.
        state.loopEnabled &&
        state.lastProgress !== null &&
        state.lastProgress > LOOP_WRAP_FROM_SECONDS &&
        t < LOOP_WRAP_TO_SECONDS
      ) {
        mark('evt-loop-verified');
      }
      state.lastProgress = t;
      return;
    }

    case 'onEnd':
      mark('evt-onEnded');
      state.endCount += 1;
      // A marker is a one-shot boolean, so proving `loop` restarted playback needs a
      // real counter: smoke-loop.yaml taps play once to get from end #1 to end #2, then
      // makes no further taps — only `loop` itself can produce a #3.
      if (state.endCount >= LOOP_VERIFIED_END_COUNT) mark('evt-loop-verified');
      log(`onEnded (#${state.endCount})`);
      return;

    case 'onError':
      mark('evt-onError');
      setErrorCode(event.code);
      log(`onError code=${event.code}`);
      return;

    case 'onStatusChange':
      log(`status:${event.status}`);
      // A source that resolves initialize() optimistically and fails later only reports
      // through the status observer, never through onError (see CONTEXT.md).
      if (event.status === 'error') {
        mark('evt-onError');
        setErrorCode('status/error');
      }
      return;

    case 'onPlaybackStateChange':
      mark('evt-onPlaybackStateChanged');
      // isPlaying starts false before the first play() too, so "paused" only means
      // something once we've actually seen it playing — same for "resumed" vs. evt-paused.
      if (event.isPlaying) {
        mark('evt-playing');
        if (has('evt-paused')) mark('evt-resumed');
      } else if (has('evt-playing')) {
        mark('evt-paused');
      }
      log(`playbackState isPlaying=${event.isPlaying}`);
      return;

    case 'onSeek':
      mark('evt-onSeek');
      // The next progress event is where this seek landed (and not a loop wrap).
      state.seekPending = true;
      log(`onSeek ${event.seekTime}`);
      return;

    case 'onVolumeChange':
      if (event.muted) {
        mark('evt-muted');
      } else if (has('evt-muted')) {
        mark('evt-unmuted');
      }
      if (!event.muted && event.volume <= VOLUME_LOW_THRESHOLD) {
        mark('evt-volume-low');
      }
      log(`onVolumeChange muted=${event.muted} volume=${event.volume}`);
      return;

    case 'onPlaybackRateChange':
      if (event.rate === 2) mark('evt-rate-2x');
      if (event.rate === 0.5) mark('evt-rate-0-5x');
      log(`onPlaybackRateChange ${event.rate}`);
      return;
  }
}

export const eventLog = {
  mark,
  log,
  setErrorCode,
  handle,
  // Called by btn-loop-toggle: the wrap-around rule above only applies while loop is on.
  setLoopEnabled(enabled: boolean) {
    state.loopEnabled = enabled;
  },
  reset() {
    state.markers = new Set();
    state.entries = [];
    state.errorCode = '';
    state.endCount = 0;
    state.loopEnabled = false;
    state.seekPending = false;
    state.lastProgress = null;
    emit();
  },
  getMarkers: () => state.markers,
  getEntries: () => state.entries,
  getErrorCode: () => state.errorCode,
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
