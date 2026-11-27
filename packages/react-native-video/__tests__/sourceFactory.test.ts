import { test, expect, beforeEach } from 'bun:test';
import { VideoRuntimeError } from '../src/core/types/VideoError';
import {
  assets,
  platform,
  resetNativeMocks,
  sourceFactory as native,
} from './helpers/nativeMocks';

const { createSource, createSourceFromUri, createSourceFromVideoConfig } =
  await import('../src/core/utils/sourceFactory');

beforeEach(resetNativeMocks);

const calls = native.calls;
const lastConfig = () => calls.fromVideoConfig.at(-1)!;

test('a string source goes straight to fromUri', () => {
  createSource('https://x/y.mp4');
  expect(calls.fromUri).toEqual(['https://x/y.mp4']);
  expect(calls.fromVideoConfig).toEqual([]);
});

test('an empty or non-string uri is rejected before reaching native', () => {
  expect(() => createSourceFromUri('')).toThrow(/non-empty string/);
  // @ts-expect-error runtime guard
  expect(() => createSourceFromUri(undefined)).toThrow(/non-empty string/);
  expect(calls.fromUri).toEqual([]);
});

test('a numeric asset is resolved through Image.resolveAssetSource', () => {
  createSource(42);
  expect(calls.fromUri).toEqual(['file:///asset.mp4']);
});

test('an asset that does not resolve is a source/invalid-uri error', () => {
  assets.resolved = null;
  expect(() => createSource(42)).toThrow(VideoRuntimeError);
  try {
    createSource(42);
  } catch (e) {
    expect((e as VideoRuntimeError).code).toBe('source/invalid-uri');
  }
});

test('an existing VideoPlayerSource is returned as-is', () => {
  const existing = { name: 'VideoPlayerSource', uri: 'x' };
  expect(createSource(existing)).toBe(existing);
  expect(calls.fromUri).toEqual([]);
  expect(calls.fromVideoConfig).toEqual([]);
});

test('initializeOnCreation defaults to true and an explicit false is kept', () => {
  createSource({ uri: 'https://x/a.mp4' });
  expect(lastConfig().initializeOnCreation).toBe(true);
  createSource({ uri: 'https://x/a.mp4', initializeOnCreation: false });
  expect(lastConfig().initializeOnCreation).toBe(false);
});

test('a config with a numeric uri resolves the asset and keeps the other fields', () => {
  createSource({ uri: 7, headers: { a: 'b' } });
  expect(lastConfig().uri).toBe('file:///asset.mp4');
  expect(lastConfig().headers).toEqual({ a: 'b' });
});

test('drm without a type gets the platform default, an explicit type is kept', () => {
  platform.OS = 'android';
  createSource({ uri: 'https://x/a.mpd', drm: { licenseUrl: 'https://l' } });
  expect(lastConfig().drm).toEqual({
    licenseUrl: 'https://l',
    type: 'widevine',
  });

  platform.OS = 'ios';
  createSource({
    uri: 'https://x/a.m3u8',
    drm: { licenseUrl: 'https://l' },
  });
  expect(lastConfig().drm).toEqual({
    licenseUrl: 'https://l',
    type: 'fairplay',
  });

  createSource({
    uri: 'https://x/a.mpd',
    drm: { licenseUrl: 'https://l', type: 'clearkey' },
  });
  expect(lastConfig().drm).toEqual({
    licenseUrl: 'https://l',
    type: 'clearkey',
  });

  platform.OS = 'web';
  createSource({ uri: 'https://x/a.mpd', drm: { licenseUrl: 'https://l' } });
  expect(lastConfig().drm).toEqual({ licenseUrl: 'https://l' });
});

test('external subtitles get default type and language', () => {
  createSource({
    uri: 'https://x/a.mp4',
    externalSubtitles: [
      { uri: 'https://x/en.vtt', label: 'English' },
      { uri: 'https://x/pl.srt', label: 'Polski', type: 'srt', language: 'pl' },
    ],
  });
  expect(lastConfig().externalSubtitles).toEqual([
    {
      uri: 'https://x/en.vtt',
      label: 'English',
      type: 'auto',
      language: 'und',
    },
    { uri: 'https://x/pl.srt', label: 'Polski', type: 'srt', language: 'pl' },
  ]);
});

test('loading options reach native unchanged and are left out when not set', () => {
  createSource({
    uri: 'https://x/live',
    type: 'm3u8',
    minLoadRetryCount: 5,
    disableDisconnectError: true,
    textTracksAllowChunklessPreparation: false,
    bufferConfig: { automaticallyWaitsToMinimizeStalling: false },
  });
  const config = lastConfig();
  expect(config.type).toBe('m3u8');
  expect(config.minLoadRetryCount).toBe(5);
  expect(config.disableDisconnectError).toBe(true);
  expect(config.textTracksAllowChunklessPreparation).toBe(false);
  expect(config.bufferConfig).toEqual({
    automaticallyWaitsToMinimizeStalling: false,
  });

  createSource({ uri: 'https://x/a.mp4' });
  const plain = lastConfig();
  for (const key of [
    'type',
    'minLoadRetryCount',
    'disableDisconnectError',
    'textTracksAllowChunklessPreparation',
    'bufferConfig',
  ]) {
    expect(key in plain).toBe(false);
  }
});

test('cmcd: true means query mode, false and undefined send nothing', () => {
  createSource({ uri: 'https://x/a.m3u8', cmcd: true });
  expect(lastConfig().cmcd).toEqual({ mode: 'query' });
  createSource({ uri: 'https://x/a.m3u8', cmcd: false });
  expect('cmcd' in lastConfig()).toBe(false);
  createSource({ uri: 'https://x/a.m3u8' });
  expect('cmcd' in lastConfig()).toBe(false);
});

test('cmcd custom keys are formatted as CMCD pairs: strings quoted, numbers bare', () => {
  createSource({
    uri: 'https://x/a.m3u8',
    cmcd: {
      mode: 'header',
      session: { 'com.example-tenant': 'acme', 'com.example-tier': 2 },
      request: { 'com.example-note': 'say "hi"' },
      object: {},
    },
  });
  expect(lastConfig().cmcd).toEqual({
    mode: 'header',
    sessionData: ['com.example-tenant="acme"', 'com.example-tier=2'],
    requestData: ['com.example-note="say \\"hi\\""'],
  });
});

test('the buffering strategy and its memory limits reach native inside bufferConfig', () => {
  createSource({
    uri: 'https://x/a.mp4',
    bufferConfig: {
      bufferingStrategy: 'dependingOnMemory',
      maxHeapAllocationPercent: 0.5,
      minBufferMemoryReservePercent: 0.1,
    },
  });
  expect(lastConfig().bufferConfig).toEqual({
    bufferingStrategy: 'dependingOnMemory',
    maxHeapAllocationPercent: 0.5,
    minBufferMemoryReservePercent: 0.1,
  });
});

test('each loading option travels on its own and does not bring the others along', () => {
  const options = {
    type: 'mpd',
    minLoadRetryCount: 0,
    disableDisconnectError: false,
    textTracksAllowChunklessPreparation: true,
  } as const;
  for (const [key, value] of Object.entries(options)) {
    createSource({ uri: 'https://x/stream', [key]: value });
    const config = lastConfig();
    // Falsy values (0, false) are real settings and must not be dropped.
    expect(config[key]).toBe(value);
    for (const other of Object.keys(options)) {
      if (other !== key) expect(other in config).toBe(false);
    }
    expect('cmcd' in config).toBe(false);
    expect('bufferConfig' in config).toBe(false);
  }
});

test('loading options are not validated in JS: native gets what the app passed', () => {
  // Pinned on purpose. Native clamps or ignores these; if validation moves to JS,
  // this test is the place to change.
  for (const count of [-1, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    createSource({ uri: 'https://x/a.m3u8', minLoadRetryCount: count });
    expect(Object.is(lastConfig().minLoadRetryCount, count)).toBe(true);
  }
  for (const type of ['', 'M3U8', 'mp4', 'something-else']) {
    createSource({ uri: 'https://x/a', type });
    expect(lastConfig().type).toBe(type);
  }
  createSource({
    uri: 'https://x/a.mp4',
    // @ts-expect-error not a BufferingStrategy
    bufferConfig: { bufferingStrategy: 'aggressive' },
  });
  expect(lastConfig().bufferConfig).toEqual({
    bufferingStrategy: 'aggressive',
  });
});

test('an option set to undefined reaches native as undefined, never as null', () => {
  createSource({
    uri: 'https://x/a.m3u8',
    type: undefined,
    minLoadRetryCount: undefined,
    disableDisconnectError: undefined,
    textTracksAllowChunklessPreparation: undefined,
    cmcd: undefined,
    bufferConfig: undefined,
  });
  const config = lastConfig();
  for (const key of [
    'type',
    'minLoadRetryCount',
    'disableDisconnectError',
    'textTracksAllowChunklessPreparation',
    'cmcd',
    'bufferConfig',
  ]) {
    expect(config[key]).toBeUndefined();
  }
  // cmcd is rebuilt, so unlike the spread options its key is not there at all.
  expect('cmcd' in config).toBe(false);
});

test('every buffering strategy is passed through next to the existing buffer options', () => {
  for (const bufferingStrategy of [
    'default',
    'disableBuffering',
    'dependingOnMemory',
  ] as const) {
    const bufferConfig = {
      minBufferMs: 5000,
      maxBufferMs: 30000,
      backBufferDurationMs: 0,
      preferredForwardBufferDurationMs: 4000,
      bufferingStrategy,
      automaticallyWaitsToMinimizeStalling: true,
    };
    createSource({ uri: 'https://x/a.mp4', bufferConfig });
    expect(lastConfig().bufferConfig).toEqual(bufferConfig);
  }
});

test('memory limits are sent without a strategy and at their edges', () => {
  createSource({
    uri: 'https://x/a.mp4',
    bufferConfig: {
      maxHeapAllocationPercent: 0,
      minBufferMemoryReservePercent: 1,
    },
  });
  expect(lastConfig().bufferConfig).toEqual({
    maxHeapAllocationPercent: 0,
    minBufferMemoryReservePercent: 1,
  });
});

test('cmcd: an empty object means query mode with no custom keys', () => {
  createSource({ uri: 'https://x/a.m3u8', cmcd: {} });
  expect(lastConfig().cmcd).toEqual({ mode: 'query' });
  createSource({
    uri: 'https://x/a.m3u8',
    cmcd: { request: {}, session: {}, object: {}, status: {} },
  });
  expect(lastConfig().cmcd).toEqual({ mode: 'query' });
  createSource({ uri: 'https://x/a.m3u8', cmcd: { mode: 'header' } });
  expect(lastConfig().cmcd).toEqual({ mode: 'header' });
});

test('cmcd: all four groups are formatted, in the order the app wrote the keys', () => {
  createSource({
    uri: 'https://x/a.mpd',
    cmcd: {
      request: { 'com.example-b': 1, 'com.example-a': 'x' },
      session: { 'com.example-sid': 'abc' },
      object: { 'com.example-kind': 'video' },
      status: { 'com.example-level': 3 },
    },
  });
  expect(lastConfig().cmcd).toEqual({
    mode: 'query',
    requestData: ['com.example-b=1', 'com.example-a="x"'],
    sessionData: ['com.example-sid="abc"'],
    objectData: ['com.example-kind="video"'],
    statusData: ['com.example-level=3'],
  });
});

test('cmcd: string values are quoted and escaped, numbers are written as they are', () => {
  createSource({
    uri: 'https://x/a.m3u8',
    cmcd: {
      session: {
        'com.example-empty': '',
        'com.example-path': 'a\\b',
        'com.example-both': '\\"',
        'com.example-digits': '42',
        'com.example-zero': 0,
        'com.example-negative': -3,
        'com.example-float': 1.5,
      },
    },
  });
  expect(lastConfig().cmcd).toEqual({
    mode: 'query',
    sessionData: [
      'com.example-empty=""',
      'com.example-path="a\\\\b"',
      'com.example-both="\\\\\\""',
      // A numeric string stays a string: quoted.
      'com.example-digits="42"',
      'com.example-zero=0',
      'com.example-negative=-3',
      'com.example-float=1.5',
    ],
  });
});

test('cmcd: the public object never reaches native, also next to drm and subtitles', () => {
  platform.OS = 'android';
  const session = { 'com.example-tenant': 'acme' } as const;
  const cmcd = { mode: 'header', session } as const;
  const config = {
    uri: 'https://x/a.mpd',
    cmcd,
    drm: { licenseUrl: 'https://x/license' },
    externalSubtitles: [
      {
        uri: 'https://x/en.vtt',
        label: 'English',
        language: 'en',
        type: 'vtt' as const,
      },
    ],
    minLoadRetryCount: 7,
  };
  createSource(config);
  const sent = lastConfig();
  expect(sent.cmcd).toEqual({
    mode: 'header',
    sessionData: ['com.example-tenant="acme"'],
  });
  expect(sent.cmcd).not.toBe(cmcd);
  expect((sent.drm as { type?: string }).type).toBe('widevine');
  expect(sent.externalSubtitles).toHaveLength(1);
  expect(sent.minLoadRetryCount).toBe(7);
  // The caller's objects are untouched, so useVideoPlayer's source key stays stable.
  expect(config.cmcd).toBe(cmcd);
  expect(cmcd.session).toBe(session);
  expect(Object.keys(cmcd)).toEqual(['mode', 'session']);
});

test('does not mutate the caller config', () => {
  // useVideoPlayer keys the player on JSON.stringify(source): if the factory wrote
  // defaults back into a config the caller keeps around (a module constant, a
  // useMemo/useState value), the next render would see a different key and destroy
  // and recreate the player.
  const config = {
    uri: 'https://x/a.mpd',
    drm: { licenseUrl: 'https://l' },
    externalSubtitles: [{ uri: 'https://x/en.vtt' as const, label: 'English' }],
  };
  const before = JSON.stringify(config);
  createSource(config);
  expect(JSON.stringify(config)).toBe(before);
});

test('invalid config uris and non-source values are typed errors', () => {
  const code = (fn: () => unknown) => {
    try {
      fn();
    } catch (e) {
      return (e as VideoRuntimeError).code;
    }
    return 'no-throw';
  };
  // @ts-expect-error runtime guard
  expect(code(() => createSource({ uri: null }))).toBe('source/invalid-uri');
  // @ts-expect-error runtime guard
  expect(code(() => createSource({ uri: {} }))).toBe('source/invalid-uri');
  expect(code(() => createSourceFromVideoConfig({ uri: '' }))).toBe(
    'source/invalid-uri'
  );
  // @ts-expect-error runtime guard
  expect(code(() => createSource(null))).toBe('player/invalid-source');
  // @ts-expect-error runtime guard
  expect(code(() => createSource(true))).toBe('player/invalid-source');
  // @ts-expect-error runtime guard
  expect(code(() => createSource({ notUri: 1 }))).toBe('player/invalid-source');
});

test('native factory errors are parsed into VideoRuntimeError', () => {
  native.throws = new Error('{%@source/unsupported-content-type::nope@%}');
  try {
    createSource('https://x/a.bin');
    throw new Error('expected throw');
  } catch (e) {
    expect(e).toBeInstanceOf(VideoRuntimeError);
    expect((e as VideoRuntimeError).code).toBe(
      'source/unsupported-content-type'
    );
  }
  native.throws = new Error('plain native failure');
  expect(() => createSource({ uri: 'https://x/a.mp4' })).toThrow(
    'plain native failure'
  );
});
