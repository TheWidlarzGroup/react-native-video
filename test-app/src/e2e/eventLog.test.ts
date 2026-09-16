import { beforeEach, describe, expect, test } from 'bun:test';
import {
  eventLog,
  LOOP_WRAP_FROM_SECONDS,
  LOOP_WRAP_TO_SECONDS,
  MARKER_IDS,
  PROGRESS_MARKER_SECONDS,
  SEEK_BACK_LANDED_SECONDS,
  SEEK_FORWARD_LANDED_SECONDS,
  STATUS_ERROR_CODE,
  VOLUME_LOW_THRESHOLD,
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
    feed({ type: 'onEnd' }); // evt-onEnded is already set
    expect(eventLog.getMarkers()).toBe(markers1);
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

describe('handle', () => {
  test('onLoad marks and logs the duration', () => {
    feed({ type: 'onLoad', duration: 8 }, { type: 'onLoad', duration: NaN });
    expect(markers()).toEqual(['evt-onLoad']);
    expect(lines()).toEqual(['onLoad duration=8', 'onLoad duration=NaN']);
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
      expect(markers()).toEqual(['evt-onError']);
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
