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

test('onLoad waits for loadedmetadata, not the durationchange w3cmedia sends before it', async () => {
  const { player, native } = await ready();
  const seen = record(player, ['onLoad']);
  native.duration = 52.2;
  native.emit('durationchange'); // w3cmedia: before loadedmetadata, readyState still 0
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
    ['onPlaybackStateChange', { isPlaying: false, isBuffering: false }],
    ['onEnd'],
    ['onStatusChange', 'idle'],
  ]);

  player.play();
  expect(player.isPlaying).toBe(true);
});

test('the remote can start the player again after the end', async () => {
  const { player, native } = await ready();
  native.paused = false;
  native.emit('ended');
  const seen = record(player, ['onPlaybackStateChange']);

  native.emit('play'); // the remote's play/pause goes to w3cmedia, not through play()

  expect(player.isPlaying).toBe(true);
  expect(seen).toEqual([
    ['onPlaybackStateChange', { isPlaying: true, isBuffering: true }],
  ]);
});

test('several seeks in a row send one onSeek, with the last target', async () => {
  const { player, native } = await ready();
  const seen = record(player, ['onSeek']);
  player.seekTo(10);
  native.setTime(2); // w3cmedia: currentTime still reads the old position
  player.seekBy(5); // builds on the seek in flight, not on the stale currentTime
  expect(native.calls).toContain('currentTime=15');

  native.seeking = true; // the first seek is done, the second is still running
  native.emit('seeked');
  native.seeking = false;
  native.emit('seeked');
  expect(seen).toEqual([['onSeek', 15]]);
});

test('a loop back to the start is not reported as a seek', async () => {
  const { player, native } = await ready();
  const seen = record(player, ['onSeek']);
  native.duration = 734.17;
  player.loop = true;
  native.setTime(734.08); // w3cmedia: seeked at the loop point still reads the end
  native.emit('seeked');
  expect(seen).toEqual([]);
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

test('initializeOnCreation false starts w3cmedia and loads the source only at initialize()', async () => {
  const { player, native } = await ready({
    uri: URI,
    initializeOnCreation: false,
  });
  expect(native.calls).toEqual([]);
  expect(player.status).toBe('idle');

  await player.initialize();
  expect(native.calls).toEqual(['initialize', `src=${URI}`]);
  expect(player.status).toBe('loading');
});

test('a player released before it was started never starts w3cmedia', async () => {
  const { player, native } = await ready({
    uri: URI,
    initializeOnCreation: false,
  });
  player.__attachSurface('s1');
  player.release();
  player.play();
  await flush();
  expect(native.calls).toEqual([]);
});

test('initializeOnCreation false: initialize() without a source still resolves', async () => {
  const { player, native } = await ready({
    uri: URI,
    initializeOnCreation: false,
  });
  await player.replaceSourceAsync(null);
  const done = await Promise.race([
    player.initialize().then(() => 'done'),
    flush().then(() => 'waiting'),
  ]);
  expect(done).toBe('done');
  expect(native.calls[0]).toBe('initialize');
});

test('initializeOnCreation false: play() alone starts w3cmedia and plays', async () => {
  const { player, native } = await ready({
    uri: URI,
    initializeOnCreation: false,
  });
  player.play();
  await flush();
  expect(native.calls).toEqual(['initialize', `src=${URI}`, 'play']);
});

test('releasing a player that never started finishes at once', async () => {
  const { KeplerMedia } = await import('../src/core/kepler/KeplerMedia');
  const media = new KeplerMedia();
  const done = await Promise.race([
    media.destroy().then(() => 'done'),
    flush().then(() => 'waiting'),
  ]);
  expect(done).toBe('done');
});

test('a null source unloads the video, and play() waits for a new source', async () => {
  const { player, native } = await ready();
  const seen = record(player, ['onLoadStart']);
  await player.replaceSourceAsync(null);
  expect(native.calls.slice(-3)).toEqual([
    'pause',
    'removeAttribute(src)',
    'load',
  ]);
  native.emit('loadstart'); // w3cmedia answers load() with loadstart
  expect(seen).toEqual([]);
  expect(player.status).toBe('idle');

  player.play();
  player.seekTo(3);
  expect(native.calls.slice(-1)).toEqual(['load']);

  await player.replaceSourceAsync('https://cdn.test/other.mp4');
  player.play();
  expect(native.calls.slice(-2)).toEqual([
    'src=https://cdn.test/other.mp4',
    'play',
  ]);
});

test('a release before w3cmedia is initialized loads nothing and still releases', async () => {
  w3c.holdInit = true;
  const player = new VideoPlayer(URI);
  player.__attachSurface('s1');
  player.play();
  player.release();
  const native = w3c.created[0]!;
  await native.finishInit();
  expect(native.calls).toEqual(['initialize', 'pause', 'deinitialize']);
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

test('after release, loads reject with player/released and the state no longer reads w3cmedia', async () => {
  const { player, native } = await ready();
  native.paused = false;
  native.readyState = 4;
  native.duration = 100;
  player.release();
  await flush();
  // As on iOS and Android; w3cmedia is deinitialized, so it is not asked any more.
  expect(player.status).toBe('idle');
  expect(player.isPlaying).toBe(false);
  expect(Number.isNaN(player.duration)).toBe(true);
  for (const load of [
    () => player.initialize(),
    () => player.preload(),
    () => player.replaceSourceAsync('https://cdn.test/other.mp4'),
    () =>
      player.replaceSourceAsync({
        uri: 'https://cdn.test/other.mp4',
        initializeOnCreation: false,
      }),
  ]) {
    const failure = (await load().catch((e: unknown) => e)) as InstanceType<
      typeof VideoRuntimeError
    >;
    expect(failure).toBeInstanceOf(VideoRuntimeError);
    expect(failure.code).toBe('player/released');
  }
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

test('a player that cannot start reports it through onError, status and initialize()', async () => {
  w3c.initRejects = new Error('no decoder');
  const player = new VideoPlayer(URI);
  const seen = record(player, ['onError']);
  await flush();
  const error = seen[0]![1] as InstanceType<typeof VideoRuntimeError>;
  expect(error.code).toBe('player/not-initialized');
  expect(error.message).toContain('no decoder');
  expect(player.status).toBe('error');

  const failure = await player.initialize().catch((e: unknown) => e);
  expect(failure).toBe(error);
  expect(await player.preload().catch((e: unknown) => e)).toBe(error);
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

async function warningsOf(run: () => Promise<unknown>) {
  const warn = console.warn;
  const warnings: string[] = [];
  console.warn = (message: unknown) => warnings.push(String(message));
  try {
    await run();
  } finally {
    console.warn = warn;
  }
  return warnings;
}

test('source options Vega cannot honour yet are named once in a warning', async () => {
  const warnings = await warningsOf(async () => {
    await ready({ uri: URI, drm: { type: 'widevine' } });
    await ready({ uri: URI, drm: { type: 'widevine' } });
  });
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toContain('`drm`');
});

test('request headers go to w3cmedia with the URL', async () => {
  const warnings = await warningsOf(async () => {
    const { native } = await ready({
      uri: URI,
      headers: { Authorization: 'x' },
    });
    expect(native.calls).toContain(`src=${URI} headers={"Authorization":"x"}`);
  });
  expect(warnings).toEqual([]);
});

test('without setSrcWithCustomHeaders (older w3cmedia) the URL loads and headers are named in a warning', async () => {
  w3c.holdInit = true;
  const warnings = await warningsOf(async () => {
    const player = new VideoPlayer({
      uri: URI,
      headers: { Authorization: 'x' },
    } as never);
    const native = w3c.created[0]!;
    (native as { setSrcWithCustomHeaders?: unknown }).setSrcWithCustomHeaders =
      undefined;
    await native.finishInit();
    expect(native.calls).toEqual(['initialize', `src=${URI}`]);
    expect(player.status).toBe('loading');
  });
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toContain('`headers`');
});

test('the player pauses when the app goes to the background, unless playInBackground', async () => {
  const { player, native } = await ready();
  player.__onAppStateChange('background');
  expect(native.calls.slice(-1)).toEqual(['pause']);

  player.playInBackground = true;
  expect(player.playInBackground).toBe(true);
  const before = native.calls.length;
  player.__onAppStateChange('background');
  player.__onAppStateChange('active');
  expect(native.calls.length).toBe(before);
});
