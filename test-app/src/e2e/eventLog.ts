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
  'evt-onLoad-repeated', // a second onLoad for the same source (#5268): one load reports once
  'evt-onProgress',
  'evt-progress-gt-2s',
  // PROGRESS_SPARSE_GAPS consecutive onProgress events at least PROGRESS_SPARSE_MIN_GAP_SECONDS
  // of playback apart: only a progressUpdateInterval near 1 s produces it (#5281). The
  // defaults (250 ms on Android, 500 ms on iOS) never do.
  'evt-progress-sparse',
  'evt-onEnded',
  'evt-onReadyToDisplay',
  'evt-onReadyToDisplay-repeated', // a second onReadyToDisplay for the same source (#5282)
  'evt-onError', // onError itself, never the error status
  'evt-onError-repeated', // a second onError in one scenario: one failure must report once
  'evt-status-error', // onStatusChange('error')
  // error-503-retry(-offline) (#5275): after onError the fixture server reports exactly
  // RETRIED_ONCE_REQUESTS requests, the first one and minLoadRetryCount: 1 retry.
  'evt-retried-once',
  'evt-onPlaybackStateChanged',
  'evt-onBuffer', // onBuffer(true) seen at least once
  // onBuffer(true) twice in a row without onBuffer(false) between (#5269): iOS reported the
  // same state up to seven times at start. A repeated false is not counted: Android reports
  // the ready state and then the end of the clip with false.
  'evt-onBuffer-true-repeated',
  // onBuffer(false) twice in a row. Not asserted by a flow yet: Android still reports the
  // ready state and the end of the clip with false. The marker is here so the same flow can
  // assert it once Android reports changes only.
  'evt-onBuffer-false-repeated',
  // VideoView's renderLoader (#5264): the loader mounted, and later unmounted because the
  // video was ready to display (smoke-loader.yaml).
  'evt-loader-shown',
  'evt-loader-hidden',
  'evt-loader-before-load', // the loader was up before onLoad and before any progress
  'evt-loader-held', // it stayed up for at least LOADER_HELD_MIN_MS of the held load
  'evt-playing', // isPlaying seen true at least once
  'evt-paused', // isPlaying seen false after having been true (real pause, not initial state)
  'evt-resumed', // isPlaying seen true again after evt-paused
  'evt-onSeek',
  'evt-seek-fwd-landed', // first onProgress after an onSeek reports currentTime > 4s
  'evt-seek-back-landed', // first onProgress after an onSeek reports currentTime < 2s
  'evt-started-at-position', // the scenario's FIRST onProgress reports currentTime > 4s
  // mp4-crop (smoke-crop.yaml): onLoad reports the length of the cropped part, and
  // progress never goes past the length onLoad reported.
  'evt-duration-crop',
  'evt-progress-past-duration',
  'evt-muted',
  'evt-unmuted', // muted:false after evt-muted (real unmute, not the initial default)
  'evt-volume-low', // onVolumeChange volume <= 0.35 while not muted
  'evt-rate-2x',
  'evt-rate-0-5x',
  'evt-video-tracks-listed', // onVideoTrackChange lists all three renditions
  'evt-video-track-pinned', // ...then reports the lowest rendition as the pinned selection
  'evt-video-track-auto', // ...then reports no pinned selection again (automatic)
  'evt-audio-alt-selected', // onAudioTrackChange reports the Spanish track selected (2 tracks listed)
  'evt-audio-default-restored', // ...then the English (default) track selected again
  'evt-audio-tracks-after-replace', // onAudioTrackChange lists both tracks after replaceSourceAsync() was requested (#5291)
  'evt-audio-focus-lost', // onAudioFocusChange(false): a ringing call took the audio focus (smoke-audio-focus)
  'evt-audio-focus-regained', // ...then onAudioFocusChange(true) once the call has ended
  // An unassisted loop restart: see LOOP_VERIFIED_END_COUNT and the wrap-around rule in
  // handle('onProgress') — AVPlayer reports each loop as onEnd, ExoPlayer wraps silently,
  // so both are covered (see smoke-loop.yaml).
  'evt-loop-verified',
  // Player lifecycle (smoke-mp4-happy-path, smoke-preload, smoke-replace-source,
  // smoke-release-source; cases ported from #4743):
  'evt-initial-idle', // player.status read as 'idle' right after creation
  'evt-ready-after-loading', // the FIRST readyToPlay came after a loading status
  'evt-duration-fixture', // onLoad duration within FIXTURE_DURATION_SECONDS +- tolerance
  'evt-replace-resolved', // replaceSourceAsync() resolved
  'evt-replace-rejected', // replaceSourceAsync() rejected
  'evt-replacement-load-started', // onLoadStart after replaceSourceAsync(source) was requested
  'evt-replacement-start-before-load', // ...and it came before the replacement's first onLoad
  'evt-replacement-load-start-repeated', // a second onLoadStart for the one replacement
  'evt-replacement-loaded', // onLoad after replaceSourceAsync(source) was requested
  'evt-reloaded-from-start', // first onProgress after that onLoad is < RELOAD_START_SECONDS
  'evt-ended-after-replace', // onEnd after replaceSourceAsync(source) was requested
  'evt-idle-after-release', // player.status read as 'idle' once replaceSourceAsync(null) resolved
  // player.status read STATUS_SETTLE_MS after onEnd / onError (#5285): Android went to idle
  // a few milliseconds after both, iOS keeps readyToPlay and error.
  'evt-ready-after-end', // status after the end of the clip is readyToPlay
  'evt-error-status-held', // status after a failed load is error
  // VideoView ref calls made from JS (smoke-fullscreen-rotate): onFullscreenChange(true/false).
  'evt-fullscreen-entered',
  'evt-fullscreen-exited',
  'evt-fullscreen-reentered', // onFullscreenChange(true) again, after an exit was reported
  'evt-fullscreen-exited-again', // ...and onFullscreenChange(false) after that second entry
  'evt-fullscreen-call-failed', // enterFullscreen()/exitFullscreen() threw (#5152)
  // fullscreenOrientation="landscape" with fullscreenAutorotate={false} (#5286), from the
  // window size while fullscreen is shown and after it closed:
  'evt-fullscreen-landscape', // the window was landscape while in fullscreen
  'evt-fullscreen-turned-portrait', // ...and later portrait while still in fullscreen (lock lost)
  'evt-portrait-after-exit', // portrait again once fullscreen closed (the app's own setting back)
  // External subtitles (smoke-external-subtitles.yaml). The list is read once after onLoad.
  'evt-text-tracks-listed', // getAvailableTextTracks() has as many tracks as the scenario expects
  'evt-text-track-languages-ok', // ...and their languages are exactly the expected ones
  // Every expected language is in the list, whatever else is. For HLS, where a player may
  // list tracks of its own next to the external one (smoke-external-subtitles-hls.yaml).
  'evt-text-track-languages-present',
  // What is selected before any request. Informational: the platforms differ here (Android
  // starts with none; iOS selects the first side-loaded track of a non-HLS source).
  'evt-text-track-default-none',
  'evt-text-track-default-selected',
  'evt-track-change-selected', // onTrackChange with a track, after a select request
  // ...whose id is the requested one, is in the list, and is what player.selectedTrack reports
  'evt-selected-id-matches-list',
  'evt-track-cleared', // onTrackChange(null) after a clear request that followed a selection
  'evt-track-change-repeated', // a second onTrackChange for one request: must report once
  // onProgress.bufferDuration is the time buffered AHEAD of currentTime (#5246), so it is
  // never negative and never reaches past the end of the clip (smoke-buffer-ahead.yaml).
  'evt-buffer-ahead-positive', // some onProgress reported bufferDuration > 0
  'evt-buffer-ahead-negative', // some onProgress reported bufferDuration < 0
  // currentTime + bufferDuration went past duration + BUFFER_AHEAD_TOLERANCE_SECONDS: the
  // value was a position in the clip, not an amount ahead of the playhead
  'evt-buffer-ahead-beyond-duration',
  // A load superseded by replaceSourceAsync() (smoke-replace-while-loading.yaml): its
  // promise rejects, it is not a failure (no onError), and it must not resolve.
  'evt-superseded-load-rejected',
  'evt-superseded-load-resolved',
  // Recovery from a failed source by replaceSourceAsync() (smoke-error-then-recover.yaml).
  'evt-loading-after-error', // onStatusChange('loading') after the failure was reported
  // The error status again once the replacement had loaded: the old failure must not
  // leak into the new source (a second onError is evt-onError-repeated).
  'evt-error-after-recovery',
  // seekBy() (smoke-seek-by.yaml): where each relative seek landed, judged like the seek
  // markers above from the progress that follows its onSeek, against the position the
  // scenario asked for (SEEK_BY_TOLERANCE_SECONDS).
  'evt-seek-by-forward-landed',
  'evt-seek-by-back-landed',
  'evt-seek-by-clamped-to-start', // a seekBy() past the start lands at 0, not on an error
  'evt-seek-by-missed', // a relative seek landed somewhere else
  // resizeMode changed while playing (smoke-resize-mode-runtime.yaml): a view prop, so the
  // player must neither reload nor stall. How the picture looks is the visual suite's job.
  'evt-resize-modes-cycled', // cover, stretch, none and contain were each applied
  'evt-progress-after-resize', // playback moved on after the last of them
  'evt-reload-after-resize', // onLoad or the loading status after the first change
  // `loop` switched during playback (smoke-loop-toggle.yaml; smoke-loop.yaml enables it on
  // an ended player and never switches it off).
  'evt-loop-wrapped', // loop on: progress fell back by more than LOOP_TOGGLE_DROP_SECONDS
  'evt-ended-after-loop-off', // loop off again: the next end is an onEnd
  'evt-wrapped-after-loop-off', // ...and playback must not start over after that
  'evt-loop-off-settled', // the scenario waited LOOP_OFF_SETTLE_MS after that onEnd
  // release() and what comes after it (smoke-release-reuse.yaml; smoke-release-source.yaml
  // covers replaceSourceAsync(null) and that the released player stops).
  'evt-second-player-loaded', // a new VideoPlayer on the same screen reported onLoad
  'evt-second-player-progress', // ...and played past PROGRESS_MARKER_SECONDS
  'evt-second-player-error', // ...or reported onError
  // play() on the released player, called after the library's grace period: it must throw
  // RELEASED_PLAYER_ERROR_CODE, not be accepted and not fail with something else.
  'evt-released-call-rejected',
  'evt-released-call-accepted',
] as const;

export type MarkerId = (typeof MARKER_IDS)[number];

export type LogEntry = { readonly id: number; readonly text: string };

export type PlayerEvent =
  | { type: 'onLoadStart' }
  | { type: 'onLoad'; duration: number }
  // bufferDuration is optional so tests of the other markers need not pass it.
  | { type: 'onProgress'; currentTime: number; bufferDuration?: number }
  | { type: 'onEnd' }
  | { type: 'onReadyToDisplay' }
  | { type: 'onError'; code: string }
  // How many requests the fixture server saw for the scenario's source (error-503-retry*).
  | { type: 'requestCount'; count: number }
  | { type: 'onStatusChange'; status: VideoPlayerStatus }
  | { type: 'onPlaybackStateChange'; isPlaying: boolean }
  | { type: 'onBuffer'; buffering: boolean }
  | { type: 'onSeek'; seekTime: number }
  | { type: 'onVolumeChange'; muted: boolean; volume: number }
  | { type: 'onPlaybackRateChange'; rate: number }
  | { type: 'onAudioFocusChange'; hasAudioFocus: boolean }
  // VideoView's onFullscreenChange (a view event, not a player event).
  | { type: 'onFullscreenChange'; fullscreen: boolean }
  // The renderLoader element mounted (shown) or unmounted (hidden) inside VideoView. `at`
  // is a millisecond clock reading, so the time it stayed up is part of the event sequence
  // and handle() stays a pure function of it.
  | { type: 'loader'; shown: boolean; at: number }
  // The window's shape, reported whenever its size or the fullscreen state changes.
  | { type: 'windowOrientation'; landscape: boolean; fullscreen: boolean }
  // A VideoView ref call that threw. Caught in the scenario, so the screen stays up and
  // the flow can assert on it instead of on a red screen.
  | {
      type: 'fullscreenCallFailed';
      call: 'enterFullscreen' | 'exitFullscreen';
      message: string;
    }
  // player.status read synchronously in the setup callback, before any load starts.
  | { type: 'initialStatus'; status: VideoPlayerStatus }
  // player.status read after replaceSourceAsync(null) resolved and native teardown ran.
  // Read, not listened for: both native players detach every emitter listener during
  // release, so no onStatusChange can report the idle status (see ScenarioScreen).
  | { type: 'statusAfterRelease'; status: VideoPlayerStatus }
  // player.status read STATUS_SETTLE_MS after onEnd or onError, once the native side has
  // settled (a status change that follows the event within a few ms is caught too).
  | { type: 'statusSettled'; after: 'end' | 'error'; status: VideoPlayerStatus }
  // The three moments of a replaceSourceAsync() issued by a control.
  | {
      type: 'replaceSource';
      phase: 'requested' | 'resolved' | 'rejected';
      // 'cache': the mp4-cache source again, with the fixture server cut off.
      source: 'hls' | 'mp4' | 'null' | 'audio-tracks' | 'cache';
    }
  // An event of the second player the release scenario creates.
  | { type: 'secondPlayer'; event: 'onLoad' | 'onError' }
  | { type: 'secondPlayer'; event: 'onProgress'; currentTime: number }
  // play() called on the released player: the code of what it threw, null if nothing.
  | { type: 'releasedCall'; code: string | null }
  // The scenario set player.loop.
  | { type: 'loopSet'; enabled: boolean }
  // The scenario's timer after the onEnd that followed loop = false.
  | { type: 'loopOffSettled' }
  // The scenario set VideoView's resizeMode prop; `at` is the position it last saw.
  | {
      type: 'resizeMode';
      mode: 'contain' | 'cover' | 'stretch' | 'none';
      at: number;
    }
  // The scenario is about to call seekBy(by); `from` is the position it last saw.
  | { type: 'seekByRequest'; from: number; by: number }
  // How the promise of a load settled after a newer load replaced it.
  | { type: 'supersededLoad'; outcome: 'rejected' | 'resolved' }
  | {
      type: 'onVideoTrackChange';
      tracks: readonly { id: string; height?: number }[];
      selectedTrackId?: string;
    }
  | {
      type: 'onAudioTrackChange';
      tracks: readonly { language?: string; selected: boolean }[];
    }
  // getAvailableTextTracks() read once after onLoad, with what the scenario expects.
  | {
      type: 'textTracks';
      tracks: readonly { id: string; language?: string; selected: boolean }[];
      expectedLanguages: readonly string[];
    }
  // A control asked for a text track (id from the list; null when the list had no match)...
  | { type: 'textTrackSelect'; id: string | null }
  // ...or for none: selectTextTrack(null).
  | { type: 'textTrackClear' }
  // onTrackChange, with player.selectedTrack?.id read inside the listener.
  | { type: 'onTrackChange'; id: string | null; selectedId: string | null };

// Renditions in the hls-quality fixture (e2e/fixtures/generate.sh).
export const VIDEO_TRACK_COUNT = 3;
export const PROGRESS_MARKER_SECONDS = 2;
export const PROGRESS_SPARSE_MIN_GAP_SECONDS = 0.8;
export const PROGRESS_SPARSE_MAX_GAP_SECONDS = 2;
export const PROGRESS_SPARSE_GAPS = 3;
export const RETRIED_ONCE_REQUESTS = 2;
export const SEEK_FORWARD_LANDED_SECONDS = 4;
export const SEEK_BACK_LANDED_SECONDS = 2;
// The mp4-start-position source starts at 5 s; natural playback starts near 0.
export const START_POSITION_LANDED_SECONDS = 4;
// mp4-crop plays 2 s to 5 s of the 8 s clip.
export const CROP_DURATION_SECONDS = 3;
export const CROP_DURATION_TOLERANCE_SECONDS = 0.5;
// Progress may run a little past the reported duration before onEnd; more is a bug.
export const PAST_DURATION_TOLERANCE_SECONDS = 0.5;
export const VOLUME_LOW_THRESHOLD = 0.35;
export const LOOP_VERIFIED_END_COUNT = 3;
// A loop wrap-around: progress was near the end of the 8 s clip and is now near its
// start, with loop enabled and no seek pending. A manual seek to 1 s (btn-seek-1) never
// lands below LOOP_WRAP_TO_SECONDS, so it cannot be mistaken for a wrap.
export const LOOP_WRAP_FROM_SECONDS = 6;
export const LOOP_WRAP_TO_SECONDS = 0.75;
// Both fixture clips (short.mp4, hls/index.m3u8) are 8 s; HLS reports the sum of its
// segment durations, which may differ from the mp4 by a fraction of a second.
export const FIXTURE_DURATION_SECONDS = 8;
export const FIXTURE_DURATION_TOLERANCE_SECONDS = 1;
// A replacement source must start near 0; its own rule, independent of the seek rules.
export const RELOAD_START_SECONDS = 2;
// How long after onEnd / onError player.status is read (statusSettled).
export const STATUS_SETTLE_MS = 750;
// mp4-loader's clip is held by the fixture server for LOADER_SOURCE_HOLD_MS (fixtures.ts).
// A loader that covered the load stayed up for most of that time; one taken off right
// after it mounted did not.
export const LOADER_SOURCE_HOLD_MS = 4000;
export const LOADER_HELD_MIN_MS = 2500;
// How far currentTime + bufferDuration may exceed the duration before it counts as a
// position instead of an amount ahead. The two values of one onProgress are sampled a
// moment apart, the buffered range ends on a segment or sample boundary rather than at
// the reported duration, and HLS reports the sum of its segment durations; all of that
// stays well under a second on the 8 s fixtures. A buffer END position reported as
// bufferDuration (iOS before #5246) is off by currentTime itself, so it trips the rule
// as soon as playback is more than this far in.
export const BUFFER_AHEAD_TOLERANCE_SECONDS = 1;
// How far from `from + by` a seekBy() may land. `from` is the last onProgress the scenario
// saw, so it is up to one progress interval old (250 ms on Android, 500 ms on iOS) when the
// seek runs, and the landing is read from the next onProgress, up to one more interval
// later; a second sample is allowed (below), which adds another. That is 1.5 s at most on
// iOS, and every step of the scenario moves by 2 s or more, so a seek that did nothing can
// never pass.
export const SEEK_BY_TOLERANCE_SECONDS = 1.5;
// A progress tick already queued when the seek started can still carry the old position,
// so the landing is judged on up to this many onProgress events after the onSeek.
export const SEEK_BY_LANDING_SAMPLES = 2;
// What a method of a released player throws once the library has dropped the native
// object (VideoPlayer.ts, the `player` getter).
export const RELEASED_PLAYER_ERROR_CODE = 'player/released';
// A loop pass seen from progress alone: the position fell back by more than this. The
// clip is 8 s and the loop scenario never seeks, so only a restart can do that. Unlike
// LOOP_WRAP_TO_SECONDS it does not depend on how soon after the restart the first
// onProgress comes (up to 500 ms on iOS).
export const LOOP_TOGGLE_DROP_SECONDS = 4;
// How long the loop scenario waits after the final onEnd before it reports "settled": long
// enough for a restart to show up as progress (two iOS progress intervals and a margin).
export const LOOP_OFF_SETTLE_MS = 2000;
// Every value of the ResizeMode type; evt-resize-modes-cycled needs each applied once.
export const RESIZE_MODES = ['contain', 'cover', 'stretch', 'none'] as const;
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
  errorCount: number;
  endCount: number;
  loopEnabled: boolean;
  seekPending: boolean;
  lastProgress: number | null;
  loadCount: number;
  // When the loader element mounted, or null while it is not up.
  loaderShownAt: number | null;
  // Duration from the latest onLoad; the buffer-ahead rule needs it.
  duration: number | null;
  // Status order: only the first readyToPlay is judged against an earlier loading.
  loadingSeen: boolean;
  readySeen: boolean;
  // replaceSourceAsync(source) was requested: only an onLoad/onEnd after it counts as the
  // replacement loading/ending (before #5268, Android re-emitted onLoad on every re-buffer,
  // seek and replay).
  replaceRequested: boolean;
  // onLoadStart events since that request.
  replacementLoadStarts: number;
  // The next onProgress tells where the replacement source started (see onLoad).
  reloadPending: boolean;
  // The value of the last onBuffer, null before the first one.
  lastBuffering: boolean | null;
  // onReadyToDisplay events since the current source started loading; a replacement source
  // (replaceSourceAsync) starts its own count.
  readyToDisplayOfSource: number;
  // Consecutive onProgress gaps of at least PROGRESS_SPARSE_MIN_GAP_SECONDS.
  sparseGaps: number;
  // onLoad events since the current source started loading. replaceSourceAsync(source)
  // starts a new source, so its onLoad is not a repeat.
  loadsOfSource: number;
  // The duration the last onLoad reported, NaN before it.
  loadedDuration: number;
  // Text tracks: ids from the reported list, and the request a control made last. Only an
  // onTrackChange after a request is judged; one before it is the platform's default.
  listedTextTrackIds: ReadonlySet<string>;
  textTrackRequest: 'none' | 'select' | 'clear';
  requestedTextTrackId: string | null;
  trackChangesSinceRequest: number;
  // seekBy(): the request waiting for its onSeek, then the landing waiting for progress.
  seekByRequested: SeekByTarget | null;
  seekByLanding: (SeekByTarget & { samplesLeft: number }) | null;
  // resizeMode changes: which modes were applied, and the position at the latest one.
  resizeModesApplied: ReadonlySet<string>;
  lastResizeAt: number | null;
  // loop switched by the loop-toggle scenario; 'unset' everywhere else.
  loopToggle: 'unset' | 'on' | 'off';
};

type SeekByTarget = {
  expected: number;
  marker:
    | 'evt-seek-by-forward-landed'
    | 'evt-seek-by-back-landed'
    | 'evt-seek-by-clamped-to-start';
};

const initialState = (): State => ({
  markers: new Set(),
  entries: [],
  presses: new Map(),
  errorCode: '',
  errorCount: 0,
  endCount: 0,
  loopEnabled: false,
  seekPending: false,
  lastProgress: null,
  loadCount: 0,
  loaderShownAt: null,
  duration: null,
  loadingSeen: false,
  readySeen: false,
  replaceRequested: false,
  replacementLoadStarts: 0,
  reloadPending: false,
  lastBuffering: null,
  readyToDisplayOfSource: 0,
  sparseGaps: 0,
  loadsOfSource: 0,
  loadedDuration: NaN,
  listedTextTrackIds: new Set(),
  textTrackRequest: 'none',
  requestedTextTrackId: null,
  trackChangesSinceRequest: 0,
  seekByRequested: null,
  seekByLanding: null,
  resizeModesApplied: new Set(),
  lastResizeAt: null,
  loopToggle: 'unset',
});

let state = initialState();
// Bumped by every reset(), i.e. once per scenario. A player keeps emitting for a moment
// after its screen is gone (its release is asynchronous); bound to an old session, its
// events are dropped instead of landing in the next scenario's log (see forSession).
let session = 0;
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

// 'en-US', 'en_US' and 'EN' are all 'en': the platforms report language tags differently.
const baseLanguage = (language: string | undefined): string =>
  (language ?? '').toLowerCase().split(/[-_]/)[0] ?? '';

function apply(event: PlayerEvent) {
  switch (event.type) {
    case 'onLoadStart':
      if (state.replaceRequested) {
        mark('evt-replacement-load-started');
        state.replacementLoadStarts += 1;
        // One replacement is one load: a second start means it was reported twice.
        if (state.replacementLoadStarts > 1) {
          mark('evt-replacement-load-start-repeated');
        }
      }
      append('onLoadStart');
      return;
    case 'onLoad':
      mark('evt-onLoad');
      state.loadCount += 1;
      state.loadsOfSource += 1;
      if (state.loadsOfSource > 1) mark('evt-onLoad-repeated');
      state.loadedDuration = event.duration;
      if (
        Math.abs(event.duration - CROP_DURATION_SECONDS) <=
        CROP_DURATION_TOLERANCE_SECONDS
      ) {
        mark('evt-duration-crop');
      }
      state.duration = event.duration;
      if (state.lastResizeAt !== null) mark('evt-reload-after-resize');
      if (state.replaceRequested) {
        // Order, judged once, on the replacement's first onLoad (Android re-emits onLoad
        // on a re-buffer): a start reported only after it is too late for an app that
        // shows a loader on onLoadStart and hides it on onLoad.
        if (
          !state.markers.has('evt-replacement-loaded') &&
          state.replacementLoadStarts > 0
        ) {
          mark('evt-replacement-start-before-load');
        }
        mark('evt-replacement-loaded');
        state.reloadPending = true;
      }
      if (
        Math.abs(event.duration - FIXTURE_DURATION_SECONDS) <=
        FIXTURE_DURATION_TOLERANCE_SECONDS
      ) {
        mark('evt-duration-fixture');
      }
      append(`onLoad duration=${event.duration} (#${state.loadCount})`);
      return;

    case 'onProgress': {
      mark('evt-onProgress');
      const t = event.currentTime;
      // derived markers: assert text, not numbers
      if (t > PROGRESS_MARKER_SECONDS) mark('evt-progress-gt-2s');
      // How far apart progress events are, in playback time. A seek or a jump (a loop
      // restart, a gap of more than two intervals) is not a gap: it restarts the count.
      const gap =
        state.lastProgress === null || state.seekPending
          ? null
          : t - state.lastProgress;
      if (
        gap !== null &&
        gap >= PROGRESS_SPARSE_MIN_GAP_SECONDS &&
        gap <= PROGRESS_SPARSE_MAX_GAP_SECONDS
      ) {
        state.sparseGaps += 1;
        if (state.sparseGaps >= PROGRESS_SPARSE_GAPS)
          mark('evt-progress-sparse');
      } else {
        state.sparseGaps = 0;
      }
      if (
        Number.isFinite(state.loadedDuration) &&
        t > state.loadedDuration + PAST_DURATION_TOLERANCE_SECONDS
      ) {
        mark('evt-progress-past-duration');
      }
      // Where playback started: only the first progress of the scenario can tell, so
      // natural playback can never satisfy it (smoke-start-position.yaml).
      if (state.lastProgress === null && t > START_POSITION_LANDED_SECONDS) {
        mark('evt-started-at-position');
      }
      const ahead = event.bufferDuration;
      if (ahead !== undefined) {
        if (ahead > 0) mark('evt-buffer-ahead-positive');
        if (ahead < 0) mark('evt-buffer-ahead-negative');
        if (
          state.duration !== null &&
          Number.isFinite(state.duration) &&
          state.duration > 0 &&
          t + ahead > state.duration + BUFFER_AHEAD_TOLERANCE_SECONDS
        ) {
          mark('evt-buffer-ahead-beyond-duration');
        }
      }
      // A replaced source must start from its beginning: the first progress after its
      // onLoad proves it, the way the seek markers prove where a seek landed.
      if (state.reloadPending) {
        state.reloadPending = false;
        if (t < RELOAD_START_SECONDS) mark('evt-reloaded-from-start');
      }
      if (
        state.loopToggle !== 'unset' &&
        state.lastProgress !== null &&
        state.lastProgress - t > LOOP_TOGGLE_DROP_SECONDS
      ) {
        mark(
          state.loopToggle === 'on'
            ? 'evt-loop-wrapped'
            : 'evt-wrapped-after-loop-off'
        );
      }
      if (
        state.markers.has('evt-resize-modes-cycled') &&
        state.lastResizeAt !== null &&
        t > state.lastResizeAt
      ) {
        mark('evt-progress-after-resize');
      }
      if (state.seekByLanding !== null) {
        const { expected, marker, samplesLeft } = state.seekByLanding;
        if (Math.abs(t - expected) <= SEEK_BY_TOLERANCE_SECONDS) {
          state.seekByLanding = null;
          mark(marker);
        } else if (samplesLeft > 1) {
          state.seekByLanding = {
            expected,
            marker,
            samplesLeft: samplesLeft - 1,
          };
        } else {
          state.seekByLanding = null;
          mark('evt-seek-by-missed');
          append(`seekBy landed at ${t}, expected ${expected}`);
        }
      }
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

    case 'onReadyToDisplay':
      mark('evt-onReadyToDisplay');
      state.readyToDisplayOfSource += 1;
      if (state.readyToDisplayOfSource > 1)
        mark('evt-onReadyToDisplay-repeated');
      append(`onReadyToDisplay (#${state.readyToDisplayOfSource})`);
      return;

    case 'onEnd':
      mark('evt-onEnded');
      state.endCount += 1;
      // A marker is a one-shot boolean, so proving `loop` restarted playback needs a
      // real counter: smoke-loop.yaml taps play once to get from end #1 to end #2, then
      // makes no further taps — only `loop` itself can produce a #3.
      if (state.replaceRequested) mark('evt-ended-after-replace');
      if (state.loopToggle === 'off') mark('evt-ended-after-loop-off');
      if (state.endCount >= LOOP_VERIFIED_END_COUNT) mark('evt-loop-verified');
      append(`onEnded (#${state.endCount})`);
      return;

    case 'onFullscreenChange':
      // A second round is only counted in order: entered, exited, entered, exited. A view
      // that never reports the first exit can therefore never report a re-entry.
      if (event.fullscreen && state.markers.has('evt-fullscreen-exited')) {
        mark('evt-fullscreen-reentered');
      }
      if (!event.fullscreen && state.markers.has('evt-fullscreen-reentered')) {
        mark('evt-fullscreen-exited-again');
      }
      mark(
        event.fullscreen ? 'evt-fullscreen-entered' : 'evt-fullscreen-exited'
      );
      append(`fullscreen:${event.fullscreen}`);
      return;

    case 'loader': {
      if (event.shown) {
        mark('evt-loader-shown');
        state.loaderShownAt = event.at;
        // Android reports progress at 0 s while the source is still loading, so only
        // progress past the start says that playback began before the loader appeared.
        const playbackMoved =
          state.lastProgress !== null && state.lastProgress > 0;
        if (state.loadCount === 0 && !playbackMoved) {
          mark('evt-loader-before-load');
        }
        append('loader shown');
        return;
      }
      // A removal with no mount before it says nothing about the loader.
      if (state.loaderShownAt === null) {
        append('loader hidden');
        return;
      }
      const shownMs = event.at - state.loaderShownAt;
      state.loaderShownAt = null;
      mark('evt-loader-hidden');
      if (shownMs >= LOADER_HELD_MIN_MS) mark('evt-loader-held');
      append(`loader hidden after ${shownMs} ms`);
      return;
    }

    case 'windowOrientation':
      if (event.fullscreen && event.landscape) mark('evt-fullscreen-landscape');
      if (
        event.fullscreen &&
        !event.landscape &&
        state.markers.has('evt-fullscreen-landscape')
      ) {
        mark('evt-fullscreen-turned-portrait');
      }
      if (
        !event.fullscreen &&
        !event.landscape &&
        state.markers.has('evt-fullscreen-exited')
      ) {
        mark('evt-portrait-after-exit');
      }
      append(
        `window:${event.landscape ? 'landscape' : 'portrait'}${event.fullscreen ? ' (fullscreen)' : ''}`
      );
      return;

    case 'fullscreenCallFailed':
      mark('evt-fullscreen-call-failed');
      append(`${event.call}() threw: ${event.message}`);
      return;

    case 'onError':
      mark('evt-onError');
      state.errorCount += 1;
      if (state.errorCount > 1) mark('evt-onError-repeated');
      state.errorCode = event.code;
      append(`onError code=${event.code}`);
      return;

    case 'requestCount':
      if (event.count === RETRIED_ONCE_REQUESTS) mark('evt-retried-once');
      append(`requests: ${event.count}`);
      return;

    case 'onStatusChange':
      // A separate marker, so a flow can assert onError and the error status apart. The
      // status has no code, so it must not replace one onError already reported.
      if (event.status === 'error') {
        mark('evt-status-error');
        if (state.errorCode === '') state.errorCode = STATUS_ERROR_CODE;
        if (state.markers.has('evt-replacement-loaded')) {
          mark('evt-error-after-recovery');
        }
      }
      if (event.status === 'loading') {
        state.loadingSeen = true;
        if (state.lastResizeAt !== null) mark('evt-reload-after-resize');
        if (
          state.markers.has('evt-onError') ||
          state.markers.has('evt-status-error')
        ) {
          mark('evt-loading-after-error');
        }
      }
      if (event.status === 'readyToPlay' && !state.readySeen) {
        state.readySeen = true;
        // Order, judged once: the first readyToPlay must follow a loading. A later
        // readyToPlay after a re-buffer must not satisfy it retroactively.
        if (state.loadingSeen) mark('evt-ready-after-loading');
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

    case 'onBuffer':
      if (event.buffering) {
        mark('evt-onBuffer');
        if (state.lastBuffering === true) mark('evt-onBuffer-true-repeated');
      } else if (state.lastBuffering === false) {
        mark('evt-onBuffer-false-repeated');
      }
      state.lastBuffering = event.buffering;
      append(`onBuffer ${event.buffering}`);
      return;

    case 'onSeek':
      mark('evt-onSeek');
      // The next progress event is where this seek landed (and not a loop wrap).
      state.seekPending = true;
      if (state.seekByRequested !== null) {
        state.seekByLanding = {
          ...state.seekByRequested,
          samplesLeft: SEEK_BY_LANDING_SAMPLES,
        };
        state.seekByRequested = null;
      }
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

    case 'onAudioFocusChange':
      // Regained only counts after a loss: the focus a player takes on play sends no event.
      if (!event.hasAudioFocus) {
        mark('evt-audio-focus-lost');
      } else if (state.markers.has('evt-audio-focus-lost')) {
        mark('evt-audio-focus-regained');
      }
      append(`onAudioFocusChange ${event.hasAudioFocus}`);
      return;

    case 'initialStatus':
      if (event.status === 'idle') mark('evt-initial-idle');
      append(`initialStatus:${event.status}`);
      return;

    case 'replaceSource':
      if (event.phase === 'requested' && event.source !== 'null') {
        state.readyToDisplayOfSource = 0;
        state.replaceRequested = true;
        state.loadsOfSource = 0;
      }
      if (event.phase === 'resolved') mark('evt-replace-resolved');
      if (event.phase === 'rejected') mark('evt-replace-rejected');
      append(`replaceSource(${event.source}) ${event.phase}`);
      return;

    case 'secondPlayer':
      if (event.event === 'onLoad') mark('evt-second-player-loaded');
      if (event.event === 'onError') mark('evt-second-player-error');
      if (
        event.event === 'onProgress' &&
        event.currentTime > PROGRESS_MARKER_SECONDS
      ) {
        mark('evt-second-player-progress');
      }
      // Progress would flood the log; the two one-off events are worth a line.
      if (event.event !== 'onProgress') append(`second player ${event.event}`);
      return;

    case 'releasedCall':
      mark(
        event.code === RELEASED_PLAYER_ERROR_CODE
          ? 'evt-released-call-rejected'
          : 'evt-released-call-accepted'
      );
      append(`play() on the released player: ${event.code ?? 'did not throw'}`);
      return;

    case 'loopSet':
      state.loopToggle = event.enabled ? 'on' : 'off';
      append(`loop=${event.enabled}`);
      return;

    case 'loopOffSettled':
      mark('evt-loop-off-settled');
      append('loop off: settled');
      return;

    case 'resizeMode':
      state.resizeModesApplied = new Set(state.resizeModesApplied).add(
        event.mode
      );
      state.lastResizeAt = event.at;
      if (RESIZE_MODES.every((mode) => state.resizeModesApplied.has(mode))) {
        mark('evt-resize-modes-cycled');
      }
      append(`resizeMode=${event.mode} at ${event.at}`);
      return;

    case 'seekByRequest': {
      const target = event.from + event.by;
      const end =
        state.duration !== null && Number.isFinite(state.duration)
          ? state.duration
          : Infinity;
      state.seekByRequested = {
        expected: Math.min(Math.max(target, 0), end),
        marker:
          target < 0
            ? 'evt-seek-by-clamped-to-start'
            : event.by > 0
              ? 'evt-seek-by-forward-landed'
              : 'evt-seek-by-back-landed',
      };
      append(`seekBy(${event.by}) from ${event.from}`);
      return;
    }

    case 'supersededLoad':
      mark(
        event.outcome === 'rejected'
          ? 'evt-superseded-load-rejected'
          : 'evt-superseded-load-resolved'
      );
      append(`superseded load ${event.outcome}`);
      return;

    case 'statusAfterRelease':
      if (event.status === 'idle') mark('evt-idle-after-release');
      append(`statusAfterRelease:${event.status}`);
      return;

    case 'statusSettled':
      if (event.after === 'end' && event.status === 'readyToPlay') {
        mark('evt-ready-after-end');
      }
      if (event.after === 'error' && event.status === 'error') {
        mark('evt-error-status-held');
      }
      append(`status after ${event.after}:${event.status}`);
      return;

    case 'onVideoTrackChange': {
      // The fixture has three renditions; "lowest" is the one with the smallest height.
      if (event.tracks.length === VIDEO_TRACK_COUNT)
        mark('evt-video-tracks-listed');
      const lowest = event.tracks.reduce<
        { id: string; height?: number } | undefined
      >(
        (min, track) =>
          min === undefined ||
          (track.height ?? Infinity) < (min.height ?? Infinity)
            ? track
            : min,
        undefined
      );
      if (
        event.selectedTrackId !== undefined &&
        event.tracks.length === VIDEO_TRACK_COUNT &&
        event.selectedTrackId === lowest?.id
      ) {
        mark('evt-video-track-pinned');
      } else if (
        event.selectedTrackId === undefined &&
        state.markers.has('evt-video-track-pinned')
      ) {
        mark('evt-video-track-auto');
      }
      append(`onVideoTrackChange selected=${event.selectedTrackId ?? 'auto'}`);
      return;
    }

    case 'onAudioTrackChange': {
      // The fixture's two renditions are told apart by language (en default, es alternate).
      const selected = event.tracks.find((track) => track.selected)?.language;
      // A source with the same tracks still owes its own list: iOS skipped it while the
      // ids were unchanged (#5291). Android goes through an empty list first.
      if (state.replaceRequested && event.tracks.length === 2) {
        mark('evt-audio-tracks-after-replace');
      }
      if (event.tracks.length === 2 && selected === 'es') {
        mark('evt-audio-alt-selected');
      } else if (
        state.markers.has('evt-audio-alt-selected') &&
        selected === 'en'
      ) {
        mark('evt-audio-default-restored');
      }
      append(`onAudioTrackChange selected=${selected ?? 'none'}`);
      return;
    }

    case 'textTracks': {
      state.listedTextTrackIds = new Set(event.tracks.map(({ id }) => id));
      if (event.tracks.length === event.expectedLanguages.length) {
        mark('evt-text-tracks-listed');
      }
      const listed = event.tracks.map((t) => baseLanguage(t.language)).sort();
      const expected = event.expectedLanguages.map(baseLanguage).sort();
      if (
        expected.length > 0 &&
        expected.every((language) => listed.includes(language))
      ) {
        mark('evt-text-track-languages-present');
      }
      if (
        listed.length === expected.length &&
        listed.every((language, i) => language === expected[i])
      ) {
        mark('evt-text-track-languages-ok');
      }
      mark(
        event.tracks.some((t) => t.selected)
          ? 'evt-text-track-default-selected'
          : 'evt-text-track-default-none'
      );
      append(
        `textTracks ${event.tracks
          .map((t) => `${t.id}:${t.language ?? '?'}${t.selected ? '*' : ''}`)
          .join(' ')}`
      );
      return;
    }

    case 'textTrackSelect':
      // No match in the list: nothing was requested, so no later change may count.
      if (event.id !== null) {
        state.textTrackRequest = 'select';
        state.requestedTextTrackId = event.id;
        state.trackChangesSinceRequest = 0;
      }
      append(`selectTextTrack ${event.id ?? 'no match in the list'}`);
      return;

    case 'textTrackClear':
      state.textTrackRequest = 'clear';
      state.requestedTextTrackId = null;
      state.trackChangesSinceRequest = 0;
      append('selectTextTrack null');
      return;

    case 'onTrackChange':
      append(
        `onTrackChange ${event.id ?? 'none'} (selectedTrack=${event.selectedId ?? 'none'})`
      );
      // Before any request this is the platform's own default selection.
      if (state.textTrackRequest === 'none') return;
      state.trackChangesSinceRequest += 1;
      if (state.trackChangesSinceRequest > 1) mark('evt-track-change-repeated');
      if (state.textTrackRequest === 'select' && event.id !== null) {
        mark('evt-track-change-selected');
        if (
          event.id === state.requestedTextTrackId &&
          state.listedTextTrackIds.has(event.id) &&
          event.selectedId === event.id
        ) {
          mark('evt-selected-id-matches-list');
        }
      }
      if (
        state.textTrackRequest === 'clear' &&
        event.id === null &&
        state.markers.has('evt-track-change-selected')
      ) {
        mark('evt-track-cleared');
      }
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
  // True from a seekByRequest until its landing was judged: the seekBy scenario issues its
  // next step only when this is false, so one landing is never judged against another.
  isSeekByBusy: (): boolean =>
    state.seekByRequested !== null || state.seekByLanding !== null,
  // Called by btn-loop-on: the wrap-around rule in handle only applies while loop is on.
  setLoopEnabled(enabled: boolean) {
    state.loopEnabled = enabled;
  },
  reset() {
    state = initialState();
    session += 1;
    emit();
  },
  /**
   * A handle() bound to the current scenario. ScenarioScreen attaches the player's listeners
   * through it, so a player whose scenario has been left can no longer change the log that
   * the next scenario's screen renders.
   */
  forSession(): (event: PlayerEvent) => void {
    const own = session;
    return (event) => {
      if (own !== session) return;
      apply(event);
      emit();
    };
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
