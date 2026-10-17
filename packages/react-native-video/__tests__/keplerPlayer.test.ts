import { test, expect, beforeEach } from 'bun:test';
import { flush, resetW3c, w3c } from './helpers/w3cmediaMock';

const { VideoPlayer } = await import('../src/core/VideoPlayer.kepler');
const { VideoRuntimeError } = await import('../src/core/types/VideoError');

const URI = 'https://cdn.test/movie.mp4';

beforeEach(resetW3c);

async function ready(source: unknown = URI) {
  const player = new VideoPlayer(source as string);
  await flush();
  const native = w3c.created[w3c.created.length - 1]!;
  return { player, native };
}

function record(player: InstanceType<typeof VideoPlayer>, events: string[]) {
  const seen: unknown[][] = [];
  for (const event of events) {
    player.addEventListener(
      event as never,
      ((...args: unknown[]) => seen.push([event, ...args])) as never
    );
  }
  return seen;
}

test('commands given before w3cmedia is initialized run after it, in order', async () => {
  w3c.holdInit = true;
  const player = new VideoPlayer(URI);
  player.__attachSurface('surface-1');
  player.muted = true;
  player.play();
  const native = w3c.created[0]!;
  expect(native.calls).toEqual(['initialize']);
  expect(player.muted).toBe(true);

  await native.finishInit();

  expect(native.calls).toEqual([
    'initialize',
    `src=${URI}`,
    'setSurfaceHandle(surface-1)',
    'play',
  ]);
  expect(native.muted).toBe(true);
  expect(native.autoplay).toBe(false);
});

test('onLoadStart is sent once per source although w3cmedia sends loadstart twice', async () => {
  const { player, native } = await ready();
  const seen = record(player, ['onLoadStart']);
  native.emit('loadstart');
  native.emit('loadstart');
  expect(seen).toHaveLength(1);
  expect((seen[0]![1] as { source: { uri: string } }).source.uri).toBe(URI);

  await player.replaceSourceAsync('https://cdn.test/other.mp4');
  native.emit('loadstart');
  expect(seen).toHaveLength(2);
});

test('onLoad waits for the metadata, so the size is known', async () => {
  const { player, native } = await ready();
  const seen = record(player, ['onLoad']);
  native.duration = 52.2;
  native.emit('durationchange'); // w3cmedia: before loadedmetadata, size still 0x0
  expect(seen).toEqual([]);

  native.readyState = 1;
  native.videoWidth = 1920;
  native.videoHeight = 1080;
  native.emit('loadedmetadata');
  native.emit('durationchange');
  expect(seen).toEqual([
    [
      'onLoad',
      {
        currentTime: 0,
        duration: 52.2,
        width: 1920,
        height: 1080,
        orientation: 'unknown',
      },
    ],
  ]);
});

test('onSeek reports where the seek went, not the stale time w3cmedia gives at seeked', async () => {
  const { player, native } = await ready();
  const seen = record(player, ['onSeek']);
  native.setTime(5.31);
  player.seekTo(40);
  native.setTime(5.31); // w3cmedia: seeked still reads the old position
  native.emit('seeked');
  expect(seen).toEqual([['onSeek', 40]]);
  expect(native.calls).toContain('currentTime=40');
});

test('after the end the player is not playing and idle, though w3cmedia keeps paused false', async () => {
  const { player, native } = await ready();
  const seen = record(player, [
    'onPlaybackStateChange',
    'onEnd',
    'onStatusChange',
  ]);
  native.paused = false;
  native.readyState = 4;
  expect(player.isPlaying).toBe(true);

  native.readyState = 2; // w3cmedia after ended
  native.emit('ended');

  expect(player.isPlaying).toBe(false);
  expect(player.status).toBe('idle');
  expect(seen).toEqual([
    ['onPlaybackStateChange', { isPlaying: false, isBuffering: true }],
    ['onEnd'],
    ['onStatusChange', 'idle'],
  ]);

  player.play();
  expect(player.isPlaying).toBe(true);
});

test('a surface reported twice is set once; a new surface replaces the old one', async () => {
  const { player, native } = await ready();
  player.__attachSurface('s1');
  player.__attachSurface('s1');
  player.__attachSurface('s2');
  expect(native.calls.filter((c) => c.includes('Surface'))).toEqual([
    'setSurfaceHandle(s1)',
    'clearSurfaceHandle(s1)',
    'setSurfaceHandle(s2)',
  ]);
});

test('initializeOnCreation false loads the source only at initialize()', async () => {
  const { player, native } = await ready({
    uri: URI,
    initializeOnCreation: false,
  });
  expect(native.calls).toEqual(['initialize']);
  expect(player.status).toBe('idle');

  await player.initialize();
  expect(native.calls).toEqual(['initialize', `src=${URI}`]);
  expect(player.status).toBe('loading');
});

test('release clears the surface, then deinitializes, and stops the events', async () => {
  const { player, native } = await ready();
  const seen = record(player, ['onProgress']);
  player.__attachSurface('s1');
  player.release();
  await flush();
  expect(native.calls.slice(-3)).toEqual([
    'clearSurfaceHandle(s1)',
    'pause',
    'deinitialize',
  ]);
  expect(native.listenerCount()).toBe(0);
  native.emit('timeupdate');
  player.play();
  expect(seen).toEqual([]);
  expect(native.calls[native.calls.length - 1]).toBe('deinitialize');
});

test('a media error arrives as onError with the w3cmedia code', async () => {
  const { player, native } = await ready();
  const seen = record(player, ['onError', 'onStatusChange']);
  native.error = { code: 2, message: 'HTTP 404' };
  native.emit('error');
  expect(player.status).toBe('error');
  const error = seen[1]![1] as InstanceType<typeof VideoRuntimeError>;
  expect(seen[0]).toEqual(['onStatusChange', 'error']);
  expect(error).toBeInstanceOf(VideoRuntimeError);
  expect(error.code).toBe('player/playback-failed');
  expect(error.message).toBe('MediaError 2 (network): HTTP 404');
});

test('a player that cannot start reports it through onError', async () => {
  w3c.initRejects = new Error('no decoder');
  const player = new VideoPlayer(URI);
  const seen = record(player, ['onError']);
  await flush();
  expect((seen[0]![1] as { code: string }).code).toBe('player/not-initialized');
  let failure: unknown;
  try {
    await player.initialize();
  } catch (error) {
    failure = error;
  }
  expect(String(failure)).toContain('no decoder');
});

test('showNotificationControls gives the remote and Alexa to the player once a view shows it', async () => {
  const { player, native } = await ready();
  player.showNotificationControls = true;
  expect(native.calls.some((c) => c.startsWith('setMediaControlFocus'))).toBe(
    false
  );
  player.__setComponentInstance(() => w3c.componentInstance);
  expect(native.calls).toContain('setMediaControlFocus(app)');
});

test('volume is kept between 0 and 1; rate and loop reach w3cmedia', async () => {
  const { player, native } = await ready();
  player.volume = 3;
  player.rate = 1.5;
  player.loop = true;
  expect(native.volume).toBe(1);
  expect(native.playbackRate).toBe(1.5);
  expect(native.loop).toBe(true);
  player.volume = -1;
  expect(player.volume).toBe(0);
});

test('source options Vega cannot honour yet are named once in a warning', async () => {
  const warn = console.warn;
  const warnings: string[] = [];
  console.warn = (message: unknown) => warnings.push(String(message));
  try {
    await ready({ uri: URI, headers: { Authorization: 'x' } });
    await ready({ uri: URI, headers: { Authorization: 'y' } });
  } finally {
    console.warn = warn;
  }
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toContain('`headers`');
});
