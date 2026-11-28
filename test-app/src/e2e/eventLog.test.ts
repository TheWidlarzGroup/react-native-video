import { beforeEach, describe, expect, test } from 'bun:test';
import {
  eventLog,
  LOOP_WRAP_FROM_SECONDS,
  LOOP_WRAP_TO_SECONDS,
  MARKER_IDS,
  PROGRESS_MARKER_SECONDS,
  PROGRESS_SPARSE_GAPS,
  PROGRESS_SPARSE_MIN_GAP_SECONDS,
  RETRIED_ONCE_REQUESTS,
  SEEK_BACK_LANDED_SECONDS,
  SEEK_FORWARD_LANDED_SECONDS,
  START_POSITION_LANDED_SECONDS,
  CROP_DURATION_SECONDS,
  PAST_DURATION_TOLERANCE_SECONDS,
  STATUS_ERROR_CODE,
  VOLUME_LOW_THRESHOLD,
  FIXTURE_DURATION_SECONDS,
  FIXTURE_DURATION_TOLERANCE_SECONDS,
  RELOAD_START_SECONDS,
  LOADER_HELD_MIN_MS,
  LOADER_SOURCE_HOLD_MS,
  type MarkerId,
  type PlayerEvent,
} from './eventLog';

const markers = (): MarkerId[] => [...eventLog.getMarkers()].sort();
const feed = (...events: PlayerEvent[]) =>
  events.forEach((e) => eventLog.handle(e));
// Log lines without their timestamp prefix.
const lines = (): string[] =>
  eventLog.getEntries().map(({ text }) => text.replace(/^\S+ /, ''));

beforeEach(() => eventLog.reset());

describe('store', () => {
  test('a change produces new snapshots; an unchanged marker set keeps its reference', () => {
    // useSyncExternalStore compares snapshots with Object.is: an in-place mutation would
    // never re-render the EventLogPanel.
    const markers0 = eventLog.getMarkers();
    const entries0 = eventLog.getEntries();
    feed({ type: 'onEnd' });
    expect(eventLog.getMarkers()).not.toBe(markers0);
    expect(eventLog.getEntries()).not.toBe(entries0);

    const markers1 = eventLog.getMarkers();
    feed({ type: 'onProgress', currentTime: 0.2 }); // evt-onProgress, a new marker
    const markers2 = eventLog.getMarkers();
    expect(markers2).not.toBe(markers1);
    feed({ type: 'onProgress', currentTime: 0.3 }); // evt-onProgress is already set
    expect(eventLog.getMarkers()).toBe(markers2);
  });

  test('subscribers are notified once per call and stop after unsubscribing', () => {
    let calls = 0;
    const unsubscribe = eventLog.subscribe(() => calls++);
    feed({ type: 'onError', code: 'x' }); // a marker, the error code and a log line
    expect(calls).toBe(1);
    eventLog.log('a');
    eventLog.reset();
    expect(calls).toBe(3);
    unsubscribe();
    eventLog.log('b');
    expect(calls).toBe(3);
  });

  test('the log keeps the newest 50 entries, each with a stable id', () => {
    for (let i = 0; i < 60; i++) eventLog.log(`line ${i}`);
    const entries = eventLog.getEntries();
    expect(entries).toHaveLength(50);
    expect(entries[0].text).toMatch(/line 10$/);
    expect(entries[49].text).toMatch(/line 59$/);
    expect(new Set(entries.map(({ id }) => id)).size).toBe(50);
    // EventLogPanel keys lines by id: an entry keeps its object when older ones drop off.
    eventLog.log('line 60');
    expect(eventLog.getEntries()[0]).toBe(entries[1]);
  });

  test('ids stay unique across a reset', () => {
    eventLog.log('before');
    const [before] = eventLog.getEntries();
    eventLog.reset();
    eventLog.log('after');
    expect(eventLog.getEntries()[0].id).not.toBe(before.id);
  });

  test('entries are prefixed with a HH:MM:SS.mmm timestamp', () => {
    eventLog.log('x');
    expect(eventLog.getEntries()[0].text).toMatch(
      /^\d{2}:\d{2}:\d{2}\.\d{3} x$/
    );
  });

  test('reset clears markers, entries, error code and all derived state', () => {
    eventLog.setLoopEnabled(true);
    feed(
      { type: 'onError', code: 'boom' },
      { type: 'onEnd' },
      { type: 'onEnd' },
      { type: 'onPlaybackStateChange', isPlaying: true },
      { type: 'onVolumeChange', muted: true, volume: 1 },
      { type: 'onProgress', currentTime: 7.5 },
      { type: 'onSeek', seekTime: 1 }
    );
    eventLog.reset();
    expect(markers()).toEqual([]);
    expect(eventLog.getEntries()).toEqual([]);
    expect(eventLog.getErrorCode()).toBe('');
    feed({ type: 'onError', code: 'boom' }); // the error count restarted too
    expect(markers()).toEqual(['evt-onError']);
    eventLog.reset();

    feed(
      { type: 'onEnd' }, // endCount restarted: no loop verification
      { type: 'onProgress', currentTime: 0.1 }, // no pending seek, loop off, no last progress
      { type: 'onPlaybackStateChange', isPlaying: false }, // never seen playing
      { type: 'onVolumeChange', muted: false, volume: 1 } // never seen muted
    );
    expect(markers()).toEqual([
      'evt-onEnded',
      'evt-onPlaybackStateChanged',
      'evt-onProgress',
    ]);
  });

  test('MARKER_IDS has no duplicates (EventLogPanel keys markers by id)', () => {
    expect(new Set(MARKER_IDS).size).toBe(MARKER_IDS.length);
  });
});

describe('press', () => {
  test('counts presses per control and logs the title', () => {
    eventLog.press('btn-play', 'play');
    eventLog.press('btn-mute', 'mute');
    eventLog.press('btn-play', 'play');
    expect([...eventLog.getPresses()]).toEqual([
      ['btn-play', 2],
      ['btn-mute', 1],
    ]);
    expect(lines()).toEqual(['press:play', 'press:mute', 'press:play']);
  });

  test('a press produces a new snapshot and notifies subscribers', () => {
    const presses0 = eventLog.getPresses();
    let calls = 0;
    const unsubscribe = eventLog.subscribe(() => calls++);
    eventLog.press('btn-play', 'play');
    unsubscribe();
    expect(eventLog.getPresses()).not.toBe(presses0);
    expect(calls).toBe(1);
  });

  test('reset clears the counts', () => {
    eventLog.press('btn-play', 'play');
    eventLog.reset();
    expect(eventLog.getPresses().size).toBe(0);
  });
});

describe('handle', () => {
  test('onLoad marks and logs the duration', () => {
    feed({ type: 'onLoad', duration: 42 });
    expect(markers()).toEqual(['evt-onLoad']);
    feed({ type: 'onLoad', duration: NaN });
    expect(lines()).toEqual([
      'onLoad duration=42 (#1)',
      'onLoad duration=NaN (#2)',
    ]);
  });

  test('onBuffer(true) twice in a row marks evt-onBuffer-true-repeated', () => {
    feed({ type: 'onBuffer', buffering: true });
    expect(markers()).toEqual(['evt-onBuffer']);
    feed({ type: 'onBuffer', buffering: true });
    expect(markers()).toContain('evt-onBuffer-true-repeated');
    expect(lines()).toEqual(['onBuffer true', 'onBuffer true']);
  });

  test('alternating onBuffer and a repeated false are not a repeat', () => {
    feed(
      { type: 'onBuffer', buffering: true },
      { type: 'onBuffer', buffering: false },
      { type: 'onBuffer', buffering: true },
      { type: 'onBuffer', buffering: false },
      { type: 'onBuffer', buffering: false }
    );
    expect(markers()).not.toContain('evt-onBuffer-true-repeated');
  });

  test('onReadyToDisplay marks; a second one for the same source is a repeat', () => {
    feed({ type: 'onReadyToDisplay' });
    expect(markers()).toEqual(['evt-onReadyToDisplay']);
    feed({ type: 'onReadyToDisplay' });
    expect(markers()).toContain('evt-onReadyToDisplay-repeated');
    expect(lines()).toEqual(['onReadyToDisplay (#1)', 'onReadyToDisplay (#2)']);
  });

  test('the onReadyToDisplay of a replacement source is not a repeat', () => {
    feed(
      { type: 'onReadyToDisplay' },
      { type: 'replaceSource', phase: 'requested', source: 'hls' },
      { type: 'onReadyToDisplay' }
    );
    expect(markers()).not.toContain('evt-onReadyToDisplay-repeated');
  });

  test('a second onLoad for the same source marks evt-onLoad-repeated', () => {
    feed({ type: 'onLoad', duration: 8 });
    expect(markers()).not.toContain('evt-onLoad-repeated');
    feed({ type: 'onLoad', duration: 8 });
    expect(markers()).toContain('evt-onLoad-repeated');
  });

  test('the onLoad of a replacement source is not a repeat', () => {
    feed(
      { type: 'onLoad', duration: 8 },
      { type: 'replaceSource', phase: 'requested', source: 'hls' },
      { type: 'onLoad', duration: 8 }
    );
    expect(markers()).not.toContain('evt-onLoad-repeated');
    feed({ type: 'onLoad', duration: 8 }); // a repeat of the replacement
    expect(markers()).toContain('evt-onLoad-repeated');
  });

  test('onProgress marks progress past the threshold, exclusive', () => {
    feed({ type: 'onProgress', currentTime: PROGRESS_MARKER_SECONDS });
    expect(markers()).toEqual(['evt-onProgress']);
    feed({ type: 'onProgress', currentTime: PROGRESS_MARKER_SECONDS + 0.1 });
    expect(markers()).toContain('evt-progress-gt-2s');
    expect(lines()).toEqual([]); // progress is too frequent to log
  });

  describe('seek', () => {
    test('onSeek marks and logs', () => {
      feed({ type: 'onSeek', seekTime: 5 });
      expect(markers()).toEqual(['evt-onSeek']);
      expect(lines()).toEqual(['onSeek 5']);
    });

    test('natural playback never produces the seek markers', () => {
      feed(
        { type: 'onProgress', currentTime: 0.5 },
        { type: 'onProgress', currentTime: 5 },
        { type: 'onProgress', currentTime: 7.9 },
        { type: 'onProgress', currentTime: 1 }
      );
      expect(markers()).not.toContain('evt-seek-fwd-landed');
      expect(markers()).not.toContain('evt-seek-back-landed');
    });

    test('seek markers come only from the first progress after onSeek', () => {
      feed(
        { type: 'onSeek', seekTime: 5 },
        { type: 'onProgress', currentTime: SEEK_FORWARD_LANDED_SECONDS + 0.1 },
        { type: 'onProgress', currentTime: 1 } // seek consumed: ignored
      );
      expect(markers()).toContain('evt-seek-fwd-landed');
      expect(markers()).not.toContain('evt-seek-back-landed');

      feed(
        { type: 'onSeek', seekTime: 1 },
        { type: 'onProgress', currentTime: SEEK_BACK_LANDED_SECONDS - 0.1 }
      );
      expect(markers()).toContain('evt-seek-back-landed');
    });

    test('a seek landing between the thresholds raises neither marker', () => {
      feed(
        { type: 'onSeek', seekTime: 3 },
        { type: 'onProgress', currentTime: SEEK_BACK_LANDED_SECONDS },
        { type: 'onSeek', seekTime: 4 },
        { type: 'onProgress', currentTime: SEEK_FORWARD_LANDED_SECONDS }
      );
      expect(markers()).not.toContain('evt-seek-fwd-landed');
      expect(markers()).not.toContain('evt-seek-back-landed');
    });
  });

  describe('playback state', () => {
    test('paused and resumed are only derived after real playback', () => {
      feed({ type: 'onPlaybackStateChange', isPlaying: false }); // initial state
      expect(markers()).toEqual(['evt-onPlaybackStateChanged']);
      feed({ type: 'onPlaybackStateChange', isPlaying: true });
      expect(markers()).toContain('evt-playing');
      expect(markers()).not.toContain('evt-resumed');
      feed({ type: 'onPlaybackStateChange', isPlaying: false });
      expect(markers()).toContain('evt-paused');
      feed({ type: 'onPlaybackStateChange', isPlaying: true });
      expect(markers()).toContain('evt-resumed');
      expect(lines()).toEqual([
        'playbackState isPlaying=false',
        'playbackState isPlaying=true',
        'playbackState isPlaying=false',
        'playbackState isPlaying=true',
      ]);
    });
  });

  describe('errors', () => {
    test('onError marks, stores the code and logs it', () => {
      feed({ type: 'onError', code: 'source/invalid-uri' });
      expect(markers()).toEqual(['evt-onError']);
      expect(eventLog.getErrorCode()).toBe('source/invalid-uri');
      expect(lines()).toEqual(['onError code=source/invalid-uri']);
    });

    test('an error status marks and stores a placeholder code; other statuses only log', () => {
      feed({ type: 'onStatusChange', status: 'loading' });
      expect(markers()).toEqual([]);
      expect(eventLog.getErrorCode()).toBe('');
      feed({ type: 'onStatusChange', status: 'error' });
      expect(markers()).toEqual(['evt-status-error']);
      expect(eventLog.getErrorCode()).toBe(STATUS_ERROR_CODE);
      expect(lines()).toEqual(['status:loading', 'status:error']);
    });

    test('a later onError replaces the placeholder code', () => {
      feed(
        { type: 'onStatusChange', status: 'error' },
        { type: 'onError', code: 'E404' }
      );
      expect(eventLog.getErrorCode()).toBe('E404');
    });

    test('a later error status keeps the code onError reported', () => {
      feed(
        { type: 'onError', code: 'E404' },
        { type: 'onStatusChange', status: 'error' }
      );
      expect(eventLog.getErrorCode()).toBe('E404');
    });

    test('an error status plus one onError is not a repeated onError', () => {
      feed(
        { type: 'onStatusChange', status: 'error' },
        { type: 'onError', code: 'E404' }
      );
      expect(markers()).toEqual(['evt-onError', 'evt-status-error']);
    });

    test('a second onError in one scenario is marked as repeated', () => {
      feed({ type: 'onError', code: 'E404' });
      expect(markers()).toEqual(['evt-onError']);
      feed({ type: 'onError', code: 'E404' });
      expect(markers()).toEqual(['evt-onError', 'evt-onError-repeated']);
    });
  });

  describe('volume', () => {
    test('unmuted is only derived after a real mute', () => {
      feed({ type: 'onVolumeChange', muted: false, volume: 1 }); // initial default
      expect(markers()).toEqual([]);
      feed({ type: 'onVolumeChange', muted: true, volume: 1 });
      expect(markers()).toEqual(['evt-muted']);
      feed({ type: 'onVolumeChange', muted: false, volume: 1 });
      expect(markers()).toEqual(['evt-muted', 'evt-unmuted']);
      expect(lines()).toEqual([
        'onVolumeChange muted=false volume=1',
        'onVolumeChange muted=true volume=1',
        'onVolumeChange muted=false volume=1',
      ]);
    });

    test('low volume is marked at or below the threshold, and only while unmuted', () => {
      feed({
        type: 'onVolumeChange',
        muted: false,
        volume: VOLUME_LOW_THRESHOLD + 0.01,
      });
      feed({ type: 'onVolumeChange', muted: true, volume: 0.1 });
      expect(markers()).not.toContain('evt-volume-low');
      feed({
        type: 'onVolumeChange',
        muted: false,
        volume: VOLUME_LOW_THRESHOLD,
      });
      expect(markers()).toContain('evt-volume-low');
    });
  });

  test('rate markers match exactly the rates the controls set', () => {
    feed(
      { type: 'onPlaybackRateChange', rate: 1 },
      { type: 'onPlaybackRateChange', rate: 1.5 },
      { type: 'onPlaybackRateChange', rate: 0.25 }
    );
    expect(markers()).toEqual([]);
    feed({ type: 'onPlaybackRateChange', rate: 2 });
    expect(markers()).toEqual(['evt-rate-2x']);
    feed({ type: 'onPlaybackRateChange', rate: 0.5 });
    expect(markers()).toEqual(['evt-rate-0-5x', 'evt-rate-2x']);
    expect(lines()).toEqual([
      'onPlaybackRateChange 1',
      'onPlaybackRateChange 1.5',
      'onPlaybackRateChange 0.25',
      'onPlaybackRateChange 2',
      'onPlaybackRateChange 0.5',
    ]);
  });

  describe('loop', () => {
    test('the third onEnd verifies loop (AVPlayer reports every pass)', () => {
      feed({ type: 'onEnd' }, { type: 'onEnd' });
      expect(markers()).toEqual(['evt-onEnded']);
      feed({ type: 'onEnd' });
      expect(markers()).toContain('evt-loop-verified');
      expect(lines()).toEqual(['onEnded (#1)', 'onEnded (#2)', 'onEnded (#3)']);
    });

    test('a silent wrap-around verifies loop only while loop is enabled (ExoPlayer)', () => {
      const end = LOOP_WRAP_FROM_SECONDS + 1.5;
      const start = LOOP_WRAP_TO_SECONDS - 0.5;
      feed(
        { type: 'onProgress', currentTime: end },
        { type: 'onProgress', currentTime: start }
      );
      expect(markers()).not.toContain('evt-loop-verified');

      eventLog.setLoopEnabled(true);
      eventLog.setLoopEnabled(false);
      feed(
        { type: 'onProgress', currentTime: end },
        { type: 'onProgress', currentTime: start }
      );
      expect(markers()).not.toContain('evt-loop-verified');

      eventLog.setLoopEnabled(true);
      feed(
        { type: 'onProgress', currentTime: end },
        { type: 'onProgress', currentTime: start }
      );
      expect(markers()).toContain('evt-loop-verified');
    });

    test('the wrap-around bounds are exclusive', () => {
      eventLog.setLoopEnabled(true);
      feed(
        { type: 'onProgress', currentTime: LOOP_WRAP_FROM_SECONDS },
        { type: 'onProgress', currentTime: 0 },
        { type: 'onProgress', currentTime: 8 },
        { type: 'onProgress', currentTime: LOOP_WRAP_TO_SECONDS }
      );
      expect(markers()).not.toContain('evt-loop-verified');
    });

    test('a manual seek back to the start is not mistaken for a wrap', () => {
      eventLog.setLoopEnabled(true);
      feed(
        { type: 'onProgress', currentTime: 8 },
        { type: 'onSeek', seekTime: 0 },
        { type: 'onProgress', currentTime: 0 }
      );
      expect(markers()).not.toContain('evt-loop-verified');
      expect(markers()).toContain('evt-seek-back-landed');
      // The seek has been consumed; the next wrap is a real loop restart.
      feed(
        { type: 'onProgress', currentTime: 7.9 },
        { type: 'onProgress', currentTime: 0.3 }
      );
      expect(markers()).toContain('evt-loop-verified');
    });

    test('progress after btn-seek-1 stays above the wrap threshold', () => {
      eventLog.setLoopEnabled(true);
      feed(
        { type: 'onProgress', currentTime: 8 },
        { type: 'onProgress', currentTime: 1 }
      );
      expect(markers()).not.toContain('evt-loop-verified');
    });
  });
});

describe('lifecycle (ported from #4743)', () => {
  const replaceRequested = () =>
    feed({ type: 'replaceSource', phase: 'requested', source: 'hls' });

  test('the initial status marks idle only when it was idle', () => {
    feed({ type: 'initialStatus', status: 'loading' });
    expect(markers()).toEqual([]);
    feed({ type: 'initialStatus', status: 'idle' });
    expect(markers()).toEqual(['evt-initial-idle']);
    expect(lines()).toEqual(['initialStatus:loading', 'initialStatus:idle']);
  });

  test('only the first readyToPlay is judged against an earlier loading', () => {
    feed(
      { type: 'onStatusChange', status: 'readyToPlay' },
      { type: 'onStatusChange', status: 'loading' }, // a re-buffer
      { type: 'onStatusChange', status: 'readyToPlay' }
    );
    expect(markers()).toEqual([]);
    eventLog.reset();
    feed(
      { type: 'onStatusChange', status: 'loading' },
      { type: 'onStatusChange', status: 'readyToPlay' }
    );
    expect(markers()).toEqual(['evt-ready-after-loading']);
  });

  test('the duration marker accepts the fixture length within its tolerance', () => {
    feed({
      type: 'onLoad',
      duration:
        FIXTURE_DURATION_SECONDS + FIXTURE_DURATION_TOLERANCE_SECONDS + 0.01,
    });
    expect(markers()).toEqual(['evt-onLoad']);
    feed({
      type: 'onLoad',
      duration: FIXTURE_DURATION_SECONDS - FIXTURE_DURATION_TOLERANCE_SECONDS,
    });
    expect(markers()).toContain('evt-duration-fixture');
  });

  test('the replacement start is in order when it comes before the replacement onLoad', () => {
    feed({ type: 'onLoadStart' }, { type: 'onLoad', duration: 8 });
    replaceRequested();
    feed({ type: 'onLoadStart' }, { type: 'onLoad', duration: 8 });
    expect(markers()).toContain('evt-replacement-start-before-load');
    expect(markers()).not.toContain('evt-replacement-load-start-repeated');
  });

  test('a replacement start that comes after its onLoad, or never, is not in order', () => {
    replaceRequested();
    feed({ type: 'onLoad', duration: 8 }, { type: 'onLoadStart' });
    expect(markers()).toContain('evt-replacement-load-started');
    expect(markers()).not.toContain('evt-replacement-start-before-load');
    // A later onLoad (Android re-emits it on a re-buffer) must not repair the order.
    feed({ type: 'onLoad', duration: 8 });
    expect(markers()).not.toContain('evt-replacement-start-before-load');

    eventLog.reset();
    replaceRequested();
    feed({ type: 'onLoad', duration: 8 });
    expect(markers()).not.toContain('evt-replacement-start-before-load');
  });

  test('a second onLoadStart for one replacement is reported as repeated', () => {
    feed({ type: 'onLoadStart' });
    replaceRequested();
    feed({ type: 'onLoadStart' });
    expect(markers()).not.toContain('evt-replacement-load-start-repeated');
    feed({ type: 'onLoadStart' });
    expect(markers()).toContain('evt-replacement-load-start-repeated');
  });

  test('an onLoadStart counts as the replacement starting only after a replacement was requested', () => {
    // The first source's own onLoadStart is not a replacement.
    feed({ type: 'onLoadStart' });
    expect(markers()).not.toContain('evt-replacement-load-started');
    replaceRequested();
    feed({ type: 'onLoadStart' });
    expect(markers()).toContain('evt-replacement-load-started');
    expect(lines()).toContain('onLoadStart');
  });

  test('an onLoad counts as the replacement only after a replacement was requested', () => {
    // Android re-emits onLoad after a re-buffer or a replay: not a replacement.
    feed({ type: 'onLoad', duration: 8 }, { type: 'onLoad', duration: 8 });
    expect(markers()).not.toContain('evt-replacement-loaded');
    replaceRequested();
    feed({ type: 'onLoad', duration: 8 });
    expect(markers()).toContain('evt-replacement-loaded');
    expect(lines()[0]).toBe('onLoad duration=8 (#1)');
  });

  test('the first progress after the replacement onLoad must be near 0', () => {
    replaceRequested();
    feed({ type: 'onLoad', duration: 8 });
    // The position the previous clip ended at does not count as a restart.
    feed({ type: 'onProgress', currentTime: RELOAD_START_SECONDS });
    expect(markers()).not.toContain('evt-reloaded-from-start');
    // Only the FIRST progress after that onLoad is judged.
    feed({ type: 'onProgress', currentTime: 0.1 });
    expect(markers()).not.toContain('evt-reloaded-from-start');
    feed(
      { type: 'onLoad', duration: 8 },
      { type: 'onProgress', currentTime: 0.1 }
    );
    expect(markers()).toContain('evt-reloaded-from-start');
  });

  test('a reload does not disturb a pending seek and vice versa', () => {
    replaceRequested();
    feed(
      { type: 'onLoad', duration: 8 },
      { type: 'onSeek', seekTime: 5 },
      { type: 'onProgress', currentTime: 5.2 }
    );
    expect(markers()).toContain('evt-seek-fwd-landed');
    expect(markers()).not.toContain('evt-reloaded-from-start');
  });

  test('an onEnd counts as the replacement ending only after a replacement was requested', () => {
    feed({ type: 'onEnd' }, { type: 'onEnd' });
    expect(markers()).toEqual(['evt-onEnded']);
    replaceRequested();
    feed({ type: 'onEnd' });
    expect(markers()).toContain('evt-ended-after-replace');
  });

  test('replaceSourceAsync phases mark resolved or rejected and are logged', () => {
    replaceRequested();
    expect(markers()).toEqual([]);
    feed({ type: 'replaceSource', phase: 'resolved', source: 'hls' });
    expect(markers()).toEqual(['evt-replace-resolved']);
    feed({ type: 'replaceSource', phase: 'rejected', source: 'hls' });
    expect(markers()).toEqual(['evt-replace-rejected', 'evt-replace-resolved']);
    expect(lines()).toEqual([
      'replaceSource(hls) requested',
      'replaceSource(hls) resolved',
      'replaceSource(hls) rejected',
    ]);
  });

  test('a replaceSourceAsync(null) request is not a replacement', () => {
    feed(
      { type: 'replaceSource', phase: 'requested', source: 'null' },
      { type: 'onLoad', duration: 8 },
      { type: 'onEnd' }
    );
    expect(markers()).toEqual([
      'evt-duration-fixture',
      'evt-onEnded',
      'evt-onLoad',
    ]);
  });

  test('the status read after a release marks idle only when it was idle', () => {
    feed({ type: 'statusAfterRelease', status: 'readyToPlay' });
    expect(markers()).toEqual([]);
    feed({ type: 'statusAfterRelease', status: 'idle' });
    expect(markers()).toEqual(['evt-idle-after-release']);
    expect(lines()).toEqual([
      'statusAfterRelease:readyToPlay',
      'statusAfterRelease:idle',
    ]);
  });

  test('status after the end is readyToPlay, after an error it is error (#5285)', () => {
    feed(
      { type: 'statusSettled', after: 'end', status: 'idle' },
      { type: 'statusSettled', after: 'error', status: 'idle' }
    );
    expect(markers()).toEqual([]);
    feed(
      { type: 'statusSettled', after: 'end', status: 'readyToPlay' },
      { type: 'statusSettled', after: 'error', status: 'error' }
    );
    expect(markers()).toEqual(['evt-error-status-held', 'evt-ready-after-end']);
    expect(lines()).toEqual([
      'status after end:idle',
      'status after error:idle',
      'status after end:readyToPlay',
      'status after error:error',
    ]);
  });

  test('a status that only fits the other event does not mark', () => {
    feed(
      { type: 'statusSettled', after: 'end', status: 'error' },
      { type: 'statusSettled', after: 'error', status: 'readyToPlay' }
    );
    expect(markers()).toEqual([]);
  });

  test('reset clears the lifecycle bookkeeping', () => {
    replaceRequested();
    feed(
      { type: 'onStatusChange', status: 'loading' },
      { type: 'onLoad', duration: 8 }
    );
    eventLog.reset();
    feed(
      { type: 'onLoad', duration: 8 }, // no replacement requested any more
      { type: 'onProgress', currentTime: 0.1 }, // no reload pending
      { type: 'onEnd' },
      { type: 'onStatusChange', status: 'readyToPlay' } // loading not seen any more
    );
    expect(markers()).toEqual([
      'evt-duration-fixture',
      'evt-onEnded',
      'evt-onLoad',
      'evt-onProgress',
    ]);
  });
});

describe('video track markers', () => {
  const tracks = [
    { id: 'hi', height: 360 },
    { id: 'mid', height: 180 },
    { id: 'low', height: 90 },
  ];

  test('listing, pinning the lowest rendition, then clearing the pin sets the markers in order', () => {
    feed({ type: 'onVideoTrackChange', tracks });
    expect(markers()).toEqual(['evt-video-tracks-listed']);

    feed({ type: 'onVideoTrackChange', tracks, selectedTrackId: 'low' });
    expect(markers()).toEqual([
      'evt-video-track-pinned',
      'evt-video-tracks-listed',
    ]);

    feed({ type: 'onVideoTrackChange', tracks });
    expect(markers()).toEqual([
      'evt-video-track-auto',
      'evt-video-track-pinned',
      'evt-video-tracks-listed',
    ]);
  });

  test('pinning a rendition other than the lowest does not count as pinned', () => {
    feed({ type: 'onVideoTrackChange', tracks, selectedTrackId: 'mid' });
    expect(markers()).toEqual(['evt-video-tracks-listed']);
  });

  test('automatic selection alone is not a restore: it needs a pin first', () => {
    feed({ type: 'onVideoTrackChange', tracks });
    feed({ type: 'onVideoTrackChange', tracks });
    expect(markers()).toEqual(['evt-video-tracks-listed']);
  });

  test('a partial rendition list is not the full ladder', () => {
    feed({
      type: 'onVideoTrackChange',
      tracks: tracks.slice(1),
      selectedTrackId: 'low',
    });
    expect(markers()).toEqual([]);
  });
});

describe('fullscreen orientation markers (#5286)', () => {
  test('landscape in fullscreen, held, then portrait after the exit', () => {
    feed(
      { type: 'windowOrientation', landscape: false, fullscreen: false },
      { type: 'onFullscreenChange', fullscreen: true },
      { type: 'windowOrientation', landscape: false, fullscreen: true },
      { type: 'windowOrientation', landscape: true, fullscreen: true }
    );
    expect(markers()).toEqual([
      'evt-fullscreen-entered',
      'evt-fullscreen-landscape',
    ]);
    feed(
      { type: 'onFullscreenChange', fullscreen: false },
      { type: 'windowOrientation', landscape: true, fullscreen: false },
      { type: 'windowOrientation', landscape: false, fullscreen: false }
    );
    expect(markers()).toEqual([
      'evt-fullscreen-entered',
      'evt-fullscreen-exited',
      'evt-fullscreen-landscape',
      'evt-portrait-after-exit',
    ]);
  });

  test('portrait in fullscreen after landscape means the lock was lost', () => {
    feed(
      { type: 'windowOrientation', landscape: true, fullscreen: true },
      { type: 'windowOrientation', landscape: false, fullscreen: true }
    );
    expect(markers()).toContain('evt-fullscreen-turned-portrait');
  });

  test('portrait before fullscreen is not a portrait after the exit', () => {
    feed({ type: 'windowOrientation', landscape: false, fullscreen: false });
    expect(markers()).toEqual([]);
  });
});

describe('audio track markers', () => {
  const en = { language: 'en' };
  const es = { language: 'es' };

  test('the alternate track is marked once it is selected out of two, then the default restore', () => {
    feed({
      type: 'onAudioTrackChange',
      tracks: [
        { ...en, selected: false },
        { ...es, selected: true },
      ],
    });
    expect(markers()).toEqual(['evt-audio-alt-selected']);
    feed({
      type: 'onAudioTrackChange',
      tracks: [
        { ...en, selected: true },
        { ...es, selected: false },
      ],
    });
    expect(markers()).toEqual([
      'evt-audio-alt-selected',
      'evt-audio-default-restored',
    ]);
  });

  test('a replacement source that lists both tracks is marked, the first source is not (#5291)', () => {
    const both = [
      { ...en, selected: true },
      { ...es, selected: false },
    ];
    feed({ type: 'onAudioTrackChange', tracks: both });
    expect(markers()).not.toContain('evt-audio-tracks-after-replace');
    feed(
      { type: 'replaceSource', phase: 'requested', source: 'audio-tracks' },
      { type: 'onAudioTrackChange', tracks: [] } // Android: the list empties first
    );
    expect(markers()).not.toContain('evt-audio-tracks-after-replace');
    feed({ type: 'onAudioTrackChange', tracks: both });
    expect(markers()).toContain('evt-audio-tracks-after-replace');
  });

  test('the default track alone never sets either marker (not a real restore)', () => {
    feed({
      type: 'onAudioTrackChange',
      tracks: [
        { ...en, selected: true },
        { ...es, selected: false },
      ],
    });
    expect(markers()).toEqual([]);
  });

  test('a single listed track does not count as the alternate being selected', () => {
    feed({ type: 'onAudioTrackChange', tracks: [{ ...es, selected: true }] });
    expect(markers()).toEqual([]);
  });
});

describe('fullscreen', () => {
  test('onFullscreenChange marks entered and exited', () => {
    feed(
      { type: 'onFullscreenChange', fullscreen: true },
      { type: 'onFullscreenChange', fullscreen: false }
    );
    expect(markers()).toEqual([
      'evt-fullscreen-entered',
      'evt-fullscreen-exited',
    ]);
  });

  test('a ref call that threw marks evt-fullscreen-call-failed and logs the message', () => {
    feed({
      type: 'fullscreenCallFailed',
      call: 'exitFullscreen',
      message: 'boom',
    });
    expect(markers()).toEqual(['evt-fullscreen-call-failed']);
    expect(lines()).toEqual(['exitFullscreen() threw: boom']);
  });
});

describe('progress interval', () => {
  const progressEvery = (step: number, count: number, from = 0) =>
    Array.from({ length: count }, (_, i) => ({
      type: 'onProgress' as const,
      currentTime: from + i * step,
    }));

  test('progress about once a second marks evt-progress-sparse', () => {
    feed(...progressEvery(1, PROGRESS_SPARSE_GAPS + 1));
    expect(markers()).toContain('evt-progress-sparse');
  });

  test('the default intervals never do', () => {
    feed(...progressEvery(0.25, 30));
    feed(...progressEvery(0.5, 15, 10));
    expect(markers()).not.toContain('evt-progress-sparse');
  });

  test('a short gap restarts the count', () => {
    feed(...progressEvery(1, PROGRESS_SPARSE_GAPS), {
      type: 'onProgress',
      currentTime:
        PROGRESS_SPARSE_GAPS - 1 + PROGRESS_SPARSE_MIN_GAP_SECONDS / 2,
    });
    expect(markers()).not.toContain('evt-progress-sparse');
  });

  test('a seek is not a gap', () => {
    feed(
      { type: 'onProgress', currentTime: 0 },
      { type: 'onSeek', seekTime: 5 },
      { type: 'onProgress', currentTime: 5 },
      { type: 'onProgress', currentTime: 5.25 }
    );
    expect(markers()).not.toContain('evt-progress-sparse');
  });
});

describe('loader', () => {
  test('a loader that covers the held load marks shown, before-load, hidden and held', () => {
    feed({ type: 'loader', shown: true, at: 1000 });
    expect(markers()).toEqual(['evt-loader-before-load', 'evt-loader-shown']);
    feed(
      { type: 'onLoad', duration: 8 },
      { type: 'loader', shown: false, at: 1000 + LOADER_SOURCE_HOLD_MS + 300 }
    );
    expect(markers()).toContain('evt-loader-hidden');
    expect(markers()).toContain('evt-loader-held');
    expect(lines()).toEqual([
      'loader shown',
      'onLoad duration=8 (#1)',
      `loader hidden after ${LOADER_SOURCE_HOLD_MS + 300} ms`,
    ]);
  });

  test('a loader taken off right after it mounted is hidden but not held', () => {
    feed(
      { type: 'loader', shown: true, at: 1000 },
      { type: 'loader', shown: false, at: 1000 + LOADER_HELD_MIN_MS - 1 }
    );
    expect(markers()).toContain('evt-loader-hidden');
    expect(markers()).not.toContain('evt-loader-held');
  });

  test('progress at 0 s while the source loads does not stop before-load (Android)', () => {
    feed(
      { type: 'onProgress', currentTime: 0 },
      { type: 'onProgress', currentTime: 0 },
      { type: 'loader', shown: true, at: 1 }
    );
    expect(markers()).toContain('evt-loader-before-load');
  });

  test('a loader that first mounts after onLoad or progress is not before-load', () => {
    feed(
      { type: 'onLoad', duration: 8 },
      { type: 'loader', shown: true, at: 1 }
    );
    expect(markers()).toContain('evt-loader-shown');
    expect(markers()).not.toContain('evt-loader-before-load');

    eventLog.reset();
    feed(
      { type: 'onProgress', currentTime: 0.2 },
      { type: 'loader', shown: true, at: 1 }
    );
    expect(markers()).not.toContain('evt-loader-before-load');
  });

  test('hidden is only marked after the loader was shown', () => {
    feed({ type: 'loader', shown: false, at: 5000 });
    expect(markers()).not.toContain('evt-loader-hidden');
    expect(markers()).not.toContain('evt-loader-held');
  });
});

describe('session', () => {
  test('a handler bound to the current scenario applies its events', () => {
    const handle = eventLog.forSession();
    handle({ type: 'onEnd' });
    expect(markers()).toEqual(['evt-onEnded']);
  });

  test("after a reset, the previous scenario's handler changes nothing", () => {
    const previous = eventLog.forSession();
    eventLog.reset(); // the next scenario starts
    const current = eventLog.forSession();
    previous({ type: 'onError', code: 'player/playback-failed' });
    expect(markers()).toEqual([]);
    current({ type: 'onEnd' });
    expect(markers()).toEqual(['evt-onEnded']);
  });
});

describe('start position', () => {
  test('only the first progress of the scenario tells where playback started', () => {
    feed({
      type: 'onProgress',
      currentTime: START_POSITION_LANDED_SECONDS + 1,
    });
    expect(markers()).toContain('evt-started-at-position');
  });

  test('playback that started at 0 never satisfies it, however far it gets', () => {
    feed(
      { type: 'onProgress', currentTime: 0.1 },
      { type: 'onProgress', currentTime: START_POSITION_LANDED_SECONDS + 1 }
    );
    expect(markers()).not.toContain('evt-started-at-position');
  });
});

describe('crop', () => {
  test('an onLoad with the length of the cropped part marks evt-duration-crop', () => {
    feed({ type: 'onLoad', duration: CROP_DURATION_SECONDS + 0.2 });
    expect(markers()).toContain('evt-duration-crop');
  });

  test('the whole 8 s clip is not the cropped part', () => {
    feed({ type: 'onLoad', duration: FIXTURE_DURATION_SECONDS });
    expect(markers()).not.toContain('evt-duration-crop');
  });

  test('progress past the reported duration marks evt-progress-past-duration', () => {
    feed(
      { type: 'onLoad', duration: CROP_DURATION_SECONDS },
      { type: 'onProgress', currentTime: CROP_DURATION_SECONDS }
    );
    expect(markers()).not.toContain('evt-progress-past-duration');
    feed({
      type: 'onProgress',
      currentTime:
        CROP_DURATION_SECONDS + PAST_DURATION_TOLERANCE_SECONDS + 0.1,
    });
    expect(markers()).toContain('evt-progress-past-duration');
  });

  test('progress before any onLoad, or with an unknown duration, is not judged', () => {
    feed({ type: 'onProgress', currentTime: 100 });
    feed(
      { type: 'onLoad', duration: NaN },
      { type: 'onProgress', currentTime: 100 }
    );
    expect(markers()).not.toContain('evt-progress-past-duration');
  });
});

describe('audio focus', () => {
  test('a loss marks evt-audio-focus-lost, the focus coming back evt-audio-focus-regained', () => {
    feed({ type: 'onAudioFocusChange', hasAudioFocus: false });
    expect(markers()).toContain('evt-audio-focus-lost');
    expect(markers()).not.toContain('evt-audio-focus-regained');
    feed({ type: 'onAudioFocusChange', hasAudioFocus: true });
    expect(markers()).toContain('evt-audio-focus-regained');
    expect(lines()).toEqual([
      'onAudioFocusChange false',
      'onAudioFocusChange true',
    ]);
  });

  test('focus that was never lost is not regained', () => {
    feed({ type: 'onAudioFocusChange', hasAudioFocus: true });
    expect(markers()).not.toContain('evt-audio-focus-regained');
  });
});

describe('request count', () => {
  test('the first request and one retry mark evt-retried-once', () => {
    feed({ type: 'requestCount', count: RETRIED_ONCE_REQUESTS });
    expect(markers()).toContain('evt-retried-once');
    expect(lines()).toEqual([`requests: ${RETRIED_ONCE_REQUESTS}`]);
  });

  test('the default retry count does not', () => {
    feed({ type: 'requestCount', count: 4 });
    expect(markers()).not.toContain('evt-retried-once');
  });
});
