import { test, expect, beforeEach } from 'bun:test';
import { eventLog, RATE_STEPS, type PlayerEvent } from './eventLog';

const markers = () => [...eventLog.getMarkers()].sort();
const feed = (...events: PlayerEvent[]) => events.forEach((e) => eventLog.handle(e));

beforeEach(() => eventLog.reset());

test('mark and log always produce new snapshot references', () => {
  // useSyncExternalStore compares snapshots with Object.is; an in-place mutation would
  // never re-render the EventLogPanel.
  const m0 = eventLog.getMarkers();
  const e0 = eventLog.getEntries();
  eventLog.mark('evt-onLoad');
  eventLog.log('x');
  expect(eventLog.getMarkers()).not.toBe(m0);
  expect(eventLog.getEntries()).not.toBe(e0);
  const m1 = eventLog.getMarkers();
  eventLog.mark('evt-onLoad'); // already set: no new snapshot, no listener call
  expect(eventLog.getMarkers()).toBe(m1);
});

test('subscribers are notified on every change and can unsubscribe', () => {
  let calls = 0;
  const off = eventLog.subscribe(() => calls++);
  eventLog.mark('evt-onLoad');
  eventLog.log('a');
  eventLog.setErrorCode('x');
  expect(calls).toBe(3);
  off();
  eventLog.log('b');
  expect(calls).toBe(3);
});

test('the log keeps only the newest 50 entries', () => {
  for (let i = 0; i < 60; i++) eventLog.log(`line ${i}`);
  const entries = eventLog.getEntries();
  expect(entries).toHaveLength(50);
  expect(entries[0]).toMatch(/line 10$/);
  expect(entries[49]).toMatch(/line 59$/);
});

test('reset clears markers, entries, error code and derived state', () => {
  feed({ type: 'onEnd' }, { type: 'onEnd' }, { type: 'onProgress', currentTime: 5 });
  eventLog.setErrorCode('boom');
  eventLog.reset();
  expect(markers()).toEqual([]);
  expect(eventLog.getEntries()).toEqual([]);
  expect(eventLog.getErrorCode()).toBe('');
  // endCount was reset: one more end must not reach the loop-verified threshold.
  feed({ type: 'onEnd' });
  expect(markers()).not.toContain('evt-loop-verified');
  // seekedForwardPastFour was reset: a low currentTime is not a "seek back".
  feed({ type: 'onProgress', currentTime: 1 });
  expect(markers()).not.toContain('evt-seek-back-landed');
});

test('onLoad marks and logs the duration', () => {
  feed({ type: 'onLoad', duration: 8 });
  expect(markers()).toEqual(['evt-onLoad']);
  expect(eventLog.getEntries()[0]).toMatch(/onLoad duration=8$/);
  feed({ type: 'onLoad' });
  expect(eventLog.getEntries()[1]).toMatch(/duration=\?$/);
});

test('progress markers are thresholds on currentTime', () => {
  feed({ type: 'onProgress', currentTime: 1.9 });
  expect(markers()).toEqual(['evt-onProgress']);
  feed({ type: 'onProgress', currentTime: 2.1 });
  expect(markers()).toContain('evt-progress-gt-2s');
  expect(markers()).not.toContain('evt-seek-fwd-landed');
  feed({ type: 'onProgress', currentTime: 4.5 });
  expect(markers()).toContain('evt-seek-fwd-landed');
});

test('a backward seek only counts after a forward seek landed', () => {
  feed({ type: 'onProgress', currentTime: 0.5 }); // natural start, not a seek back
  expect(markers()).not.toContain('evt-seek-back-landed');
  feed({ type: 'onProgress', currentTime: 5 }, { type: 'onProgress', currentTime: 1 });
  expect(markers()).toContain('evt-seek-back-landed');
});

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
});

test('loop is only verified on the third onEnd', () => {
  feed({ type: 'onEnd' });
  expect(markers()).toEqual(['evt-onEnded']);
  feed({ type: 'onEnd' });
  expect(markers()).not.toContain('evt-loop-verified');
  feed({ type: 'onEnd' });
  expect(markers()).toContain('evt-loop-verified');
  expect(eventLog.getEntries().map((l) => l.replace(/^\S+ /, ''))).toEqual([
    'onEnded (#1)',
    'onEnded (#2)',
    'onEnded (#3)',
  ]);
});

test('onError and an error status both raise the error marker', () => {
  feed({ type: 'onStatusChange', status: 'loading' });
  expect(markers()).toEqual([]);
  feed({ type: 'onStatusChange', status: 'error' });
  expect(markers()).toEqual(['evt-onError']);
  expect(eventLog.getErrorCode()).toBe('status/error');
  feed({ type: 'onError', code: 'E404' });
  expect(eventLog.getErrorCode()).toBe('E404');
});

test('mute, unmute and low volume markers', () => {
  feed({ type: 'onVolumeChange', muted: false, volume: 1 }); // initial default
  expect(markers()).toEqual([]);
  feed({ type: 'onVolumeChange', muted: true, volume: 1 });
  expect(markers()).toEqual(['evt-muted']);
  feed({ type: 'onVolumeChange', muted: true, volume: 0.3 }); // low but muted: no marker
  expect(markers()).not.toContain('evt-volume-low');
  feed({ type: 'onVolumeChange', muted: false, volume: 0.3 });
  expect(markers()).toContain('evt-unmuted');
  expect(markers()).toContain('evt-volume-low');
});

test('rate markers match the exact cycle steps', () => {
  feed({ type: 'onPlaybackRateChange', rate: 1 });
  expect(markers()).toEqual([]);
  feed({ type: 'onPlaybackRateChange', rate: RATE_STEPS[0] });
  expect(markers()).toEqual(['evt-rate-2x']);
  feed({ type: 'onPlaybackRateChange', rate: RATE_STEPS[1] });
  expect(markers()).toContain('evt-rate-0-5x');
});

test('onSeek marks and logs', () => {
  feed({ type: 'onSeek', seekTime: 5 });
  expect(markers()).toEqual(['evt-onSeek']);
  expect(eventLog.getEntries()[0]).toMatch(/onSeek 5$/);
});
