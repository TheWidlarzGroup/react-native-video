/**
 * Minimal event log store for E2E.
 * Design goal: expose player state as TEXT with stable testIDs so Maestro can assert on it.
 * Two surfaces:
 *  - markers: monotonic booleans ("this event type has happened at least once",
 *    or a derived condition like progress > 2s). Constant testIDs -> trivial assertions.
 *  - entries: human-readable chronological log (debugging, screenshots in CI artifacts).
 */

export type MarkerId =
  | 'evt-onLoad'
  | 'evt-onProgress'
  | 'evt-progress-gt-2s'
  | 'evt-onEnded'
  | 'evt-onError'
  | 'evt-onPlaybackStateChanged'
  | 'evt-source-replaced' // wave 2: replaceSourceAsync
  // wave-1 expansion (see e2e/CONTEXT.md): pause/resume, seek, mute/volume, rate, loop
  | 'evt-playing' // isPlaying seen true at least once
  | 'evt-paused' // isPlaying seen false after having been true (real pause, not initial state)
  | 'evt-resumed' // isPlaying seen true again after evt-paused
  | 'evt-onSeek'
  | 'evt-seek-fwd-landed' // onProgress currentTime > 4s (proves a forward seek landed, not natural playback)
  | 'evt-seek-back-landed' // onProgress currentTime < 2s after evt-seek-fwd-landed (proves a backward seek landed)
  | 'evt-muted'
  | 'evt-unmuted' // muted:false after evt-muted (real unmute, not the initial default)
  | 'evt-volume-low' // onVolumeChange volume <= 0.35 while not muted
  | 'evt-rate-2x'
  | 'evt-rate-0-5x'
  | 'evt-loop-verified'; // onEnd fired a 3rd time with no tap between the 2nd and 3rd —
// only an unassisted `loop` restart could produce that (see ScenarioScreen.tsx endCount)

type Listener = () => void;

const state = {
  markers: new Set<MarkerId>(),
  entries: [] as string[],
  errorCode: '' as string,
};

const listeners = new Set<Listener>();
const MAX_ENTRIES = 50;

function emit() {
  listeners.forEach((l) => l());
}

export const eventLog = {
  mark(id: MarkerId) {
    if (!state.markers.has(id)) {
      // useSyncExternalStore bails out on an unchanged snapshot reference,
      // so mutations must produce a new Set/array, never mutate in place.
      state.markers = new Set(state.markers).add(id);
      emit();
    }
  },
  log(line: string) {
    const next = [
      ...state.entries,
      `${new Date().toISOString().slice(11, 23)} ${line}`,
    ];
    state.entries =
      next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
    emit();
  },
  setErrorCode(code: string) {
    state.errorCode = code;
    emit();
  },
  reset() {
    state.markers = new Set();
    state.entries = [];
    state.errorCode = '';
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
