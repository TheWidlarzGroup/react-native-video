import { test, expect, beforeEach } from 'bun:test';
import { player as native, resetNativeMocks } from './helpers/nativeMocks';

const { VideoPlayer } = await import('../src/core/VideoPlayer');
// The web sources need the DOM lib, which the test tsconfig leaves out, so the
// path is not a literal and the module is not type-checked from here.
const webDOMEvents: string = '../src/core/web/webDOMEvents';
const { attachPlaybackListeners } = await import(webDOMEvents);

beforeEach(resetNativeMocks);

test('progressUpdateInterval is forwarded to the native player', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  player.progressUpdateInterval = 1000;
  expect((native.created[0] as any).progressUpdateInterval).toBe(1000);
  expect(player.progressUpdateInterval).toBe(1000);
});

test('progressUpdateInterval reads the native value before anything is set', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  // The native player reports its platform default: 500 ms on iOS, 250 ms on Android.
  (native.created[0] as any).progressUpdateInterval = 500;
  expect(player.progressUpdateInterval).toBe(500);
});

test('progressUpdateInterval ignores values that are not a positive finite number', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  player.progressUpdateInterval = 500;
  for (const bad of [0, -1, NaN, Infinity]) {
    player.progressUpdateInterval = bad;
  }
  expect((native.created[0] as any).progressUpdateInterval).toBe(500);
});

function webHarness(interval: number) {
  const video = new EventTarget() as any;
  video.currentTime = 0;
  video.readyState = 4;
  video.HAVE_FUTURE_DATA = 3;
  const media = { progressUpdateInterval: interval, bufferAhead: 0 } as any;
  const progress: number[] = [];
  attachPlaybackListeners(video, media, (event: string) => {
    if (event === 'onProgress') progress.push(Date.now());
  });
  return { video, media, progress };
}

test('web: onProgress is thinned out to progressUpdateInterval', () => {
  const realNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    const { video, media, progress } = webHarness(1000);
    // The browser fires timeupdate about every 250 ms: 5 s of playback.
    for (let i = 0; i < 20; i++) {
      video.dispatchEvent(new Event('timeupdate'));
      now += 250;
    }
    expect(progress.length).toBe(5);

    // The default lets every browser event through, also one fired a little early.
    progress.length = 0;
    media.progressUpdateInterval = 250;
    for (let i = 0; i < 20; i++) {
      video.dispatchEvent(new Event('timeupdate'));
      now += 240;
    }
    expect(progress.length).toBe(20);
  } finally {
    Date.now = realNow;
  }
});
