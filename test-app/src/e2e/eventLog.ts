/**
 * Minimal event log store for E2E.
 * Design goal: expose player state as TEXT with stable testIDs so Maestro can assert on it.
 * Three surfaces:
 *  - markers: monotonic booleans ("this event type has happened at least once",
 *    or a derived condition like progress > 2s). Constant testIDs -> trivial assertions.
 *  - presses: how many times each control was pressed, rendered as one marker per press
 *    (`pressed-<testID>-<n>`) so a flow can prove its tap arrived.
 *  - entries: human-readable chronological log (debugging, screenshots in CI artifacts).
 *
 * All marker derivation happens in `handle()`, a pure function of the event sequence, so
 * it is unit-tested without React Native (eventLog.test.ts). ScenarioScreen only maps the
 * player's listener payloads onto `PlayerEvent`s.
 */
import type { VideoPlayerStatus } from 'react-native-video';

// Every marker, in the order EventLogPanel renders them.
export const MARKER_IDS = [
  'evt-onLoad',
  'evt-onProgress',
  'evt-progress-gt-2s',
  'evt-onEnded',
  'evt-onError',
  'evt-onPlaybackStateChanged',
  'evt-playing', // isPlaying seen true at least once
  'evt-paused', // isPlaying seen false after having been true (real pause, not initial state)
  'evt-resumed', // isPlaying seen true again after evt-paused
  'evt-onSeek',
  'evt-seek-fwd-landed', // first onProgress after an onSeek reports currentTime > 4s
  'evt-seek-back-landed', // first onProgress after an onSeek reports currentTime < 2s
  'evt-muted',
  'evt-unmuted', // muted:false after evt-muted (real unmute, not the initial default)
  'evt-volume-low', // onVolumeChange volume <= 0.35 while not muted
  'evt-rate-2x',
  'evt-rate-0-5x',
  // An unassisted loop restart: see LOOP_VERIFIED_END_COUNT and the wrap-around rule in
  // handle('onProgress') — AVPlayer reports each loop as onEnd, ExoPlayer wraps silently,
  // so both are covered (see smoke-loop.yaml).
  'evt-loop-verified',
] as const;

export type MarkerId = (typeof MARKER_IDS)[number];

export type LogEntry = { readonly id: number; readonly text: string };

export type PlayerEvent =
  | { type: 'onLoad'; duration: number }
  | { type: 'onProgress'; currentTime: number }
  | { type: 'onEnd' }
  | { type: 'onError'; code: string }
  | { type: 'onStatusChange'; status: VideoPlayerStatus }
  | { type: 'onPlaybackStateChange'; isPlaying: boolean }
  | { type: 'onSeek'; seekTime: number }
  | { type: 'onVolumeChange'; muted: boolean; volume: number }
  | { type: 'onPlaybackRateChange'; rate: number };

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
// Set when the player reports an error status without a code (see handle).
export const STATUS_ERROR_CODE = 'status/error';

const MAX_ENTRIES = 50;

type State = {
  // useSyncExternalStore compares snapshots by reference, so markers and entries are
  // replaced on every change and never mutated in place.
  markers: ReadonlySet<MarkerId>;
  entries: readonly LogEntry[];
  // Presses per control testID. EventLogPanel renders `pressed-<testID>-<n>` for every
  // n up to the count, so a flow can wait for a specific press (e2e/shared/press.yaml)
  // on a marker that never scrolls out of view, unlike the log below.
  presses: ReadonlyMap<string, number>;
  errorCode: string;
  // Derived-marker bookkeeping.
  endCount: number;
  loopEnabled: boolean;
  seekPending: boolean;
  lastProgress: number | null;
};

const initialState = (): State => ({
  markers: new Set(),
  entries: [],
  presses: new Map(),
  errorCode: '',
  endCount: 0,
  loopEnabled: false,
  seekPending: false,
  lastProgress: null,
});

let state = initialState();
// Never reset, so a key stays unique even across scenarios and after old entries drop off.
let nextEntryId = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function mark(id: MarkerId) {
  if (!state.markers.has(id)) {
    state.markers = new Set(state.markers).add(id);
  }
}

function append(line: string) {
  const entry = {
    id: nextEntryId++,
    text: `${new Date().toISOString().slice(11, 23)} ${line}`,
  };
  state.entries = [...state.entries, entry].slice(-MAX_ENTRIES);
}

function apply(event: PlayerEvent) {
  switch (event.type) {
    case 'onLoad':
      mark('evt-onLoad');
      append(`onLoad duration=${event.duration}`);
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
      append(`onEnded (#${state.endCount})`);
      return;

    case 'onError':
      mark('evt-onError');
      state.errorCode = event.code;
      append(`onError code=${event.code}`);
      return;

    case 'onStatusChange':
      // A source that resolves initialize() optimistically and fails later only reports
      // through the status observer, never through onError (#5083, see CONTEXT.md). That
      // path has no code, so it must not replace one onError already reported.
      if (event.status === 'error') {
        mark('evt-onError');
        if (state.errorCode === '') state.errorCode = STATUS_ERROR_CODE;
      }
      append(`status:${event.status}`);
      return;

    case 'onPlaybackStateChange':
      mark('evt-onPlaybackStateChanged');
      // isPlaying starts false before the first play() too, so "paused" only means
      // something once we've actually seen it playing — same for "resumed" vs. evt-paused.
      if (event.isPlaying) {
        mark('evt-playing');
        if (state.markers.has('evt-paused')) mark('evt-resumed');
      } else if (state.markers.has('evt-playing')) {
        mark('evt-paused');
      }
      append(`playbackState isPlaying=${event.isPlaying}`);
      return;

    case 'onSeek':
      mark('evt-onSeek');
      // The next progress event is where this seek landed (and not a loop wrap).
      state.seekPending = true;
      append(`onSeek ${event.seekTime}`);
      return;

    case 'onVolumeChange':
      if (event.muted) {
        mark('evt-muted');
      } else if (state.markers.has('evt-muted')) {
        mark('evt-unmuted');
      }
      if (!event.muted && event.volume <= VOLUME_LOW_THRESHOLD) {
        mark('evt-volume-low');
      }
      append(`onVolumeChange muted=${event.muted} volume=${event.volume}`);
      return;

    case 'onPlaybackRateChange':
      if (event.rate === 2) mark('evt-rate-2x');
      if (event.rate === 0.5) mark('evt-rate-0-5x');
      append(`onPlaybackRateChange ${event.rate}`);
      return;

    default:
      // A new PlayerEvent type fails to compile here until it is handled.
      event satisfies never;
  }
}

export const eventLog = {
  handle(event: PlayerEvent) {
    apply(event);
    emit();
  },
  log(line: string) {
    append(line);
    emit();
  },
  // Called synchronously in a control's onPress, before the control touches the player.
  press(id: string, title: string) {
    state.presses = new Map(state.presses).set(
      id,
      (state.presses.get(id) ?? 0) + 1
    );
    append(`press:${title}`);
    emit();
  },
  // Called by btn-loop-on: the wrap-around rule in handle only applies while loop is on.
  setLoopEnabled(enabled: boolean) {
    state.loopEnabled = enabled;
  },
  reset() {
    state = initialState();
    emit();
  },
  getMarkers: (): ReadonlySet<MarkerId> => state.markers,
  getEntries: (): readonly LogEntry[] => state.entries,
  getPresses: (): ReadonlyMap<string, number> => state.presses,
  getErrorCode: (): string => state.errorCode,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
