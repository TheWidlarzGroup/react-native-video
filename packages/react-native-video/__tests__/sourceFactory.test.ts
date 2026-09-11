import { test, expect, mock, beforeEach } from 'bun:test';
import { VideoRuntimeError } from '../src/core/types/VideoError';

// sourceFactory creates the native factory hybrid object at import time and reads
// Platform / Image from react-native, so both modules are mocked before it is imported.
const platform = { OS: 'ios' as string };
const calls: { fromUri: string[]; fromVideoConfig: Record<string, unknown>[] } = {
  fromUri: [],
  fromVideoConfig: [],
};
let nativeThrows: unknown = null;
let resolvedAsset: { uri?: unknown } | null = { uri: 'file:///asset.mp4' };

mock.module('react-native', () => ({
  Platform: {
    get OS() {
      return platform.OS;
    },
    select: (spec: Record<string, unknown>) =>
      platform.OS in spec ? spec[platform.OS] : spec.default,
  },
  Image: { resolveAssetSource: () => resolvedAsset },
}));

mock.module('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => ({
      fromUri: (uri: string) => {
        if (nativeThrows) throw nativeThrows;
        calls.fromUri.push(uri);
        return { name: 'VideoPlayerSource', uri };
      },
      fromVideoConfig: (config: Record<string, unknown>) => {
        if (nativeThrows) throw nativeThrows;
        calls.fromVideoConfig.push(config);
        return { name: 'VideoPlayerSource', uri: config.uri };
      },
    }),
  },
}));

const { createSource, createSourceFromUri, createSourceFromVideoConfig } = await import(
  '../src/core/utils/sourceFactory'
);

beforeEach(() => {
  platform.OS = 'ios';
  calls.fromUri = [];
  calls.fromVideoConfig = [];
  nativeThrows = null;
  resolvedAsset = { uri: 'file:///asset.mp4' };
});

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
  resolvedAsset = null;
  expect(() => createSource(42)).toThrow(VideoRuntimeError);
  try {
    createSource(42);
  } catch (e) {
    expect((e as VideoRuntimeError).code).toBe('source/invalid-uri');
  }
});

test('an existing VideoPlayerSource is returned as-is', () => {
  const existing = { name: 'VideoPlayerSource', uri: 'x' };
  // @ts-expect-error minimal stand-in for the hybrid object
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
  createSource({ uri: 'https://x/a.mpd', drm: { licenseServer: 'https://l' } });
  expect(lastConfig().drm).toEqual({ licenseServer: 'https://l', type: 'widevine' });

  platform.OS = 'ios';
  createSource({ uri: 'https://x/a.m3u8', drm: { licenseServer: 'https://l' } });
  expect(lastConfig().drm).toEqual({ licenseServer: 'https://l', type: 'fairplay' });

  createSource({ uri: 'https://x/a.mpd', drm: { licenseServer: 'https://l', type: 'clearkey' } });
  expect(lastConfig().drm).toEqual({ licenseServer: 'https://l', type: 'clearkey' });

  platform.OS = 'web';
  createSource({ uri: 'https://x/a.mpd', drm: { licenseServer: 'https://l' } });
  expect(lastConfig().drm).toEqual({ licenseServer: 'https://l' });
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
    { uri: 'https://x/en.vtt', label: 'English', type: 'auto', language: 'und' },
    { uri: 'https://x/pl.srt', label: 'Polski', type: 'srt', language: 'pl' },
  ]);
});

test('does not mutate the caller config', () => {
  // useVideoPlayer keys the player on JSON.stringify(source): if the factory wrote
  // defaults back into a config the caller keeps around (a module constant, a
  // useMemo/useState value), the next render would see a different key and destroy
  // and recreate the player.
  const config = {
    uri: 'https://x/a.mpd',
    drm: { licenseServer: 'https://l' },
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
  // @ts-expect-error runtime guard
  expect(code(() => createSourceFromVideoConfig({ uri: '' }))).toBe('source/invalid-uri');
  // @ts-expect-error runtime guard
  expect(code(() => createSource(null))).toBe('player/invalid-source');
  // @ts-expect-error runtime guard
  expect(code(() => createSource(true))).toBe('player/invalid-source');
  // @ts-expect-error runtime guard
  expect(code(() => createSource({ notUri: 1 }))).toBe('player/invalid-source');
});

test('native factory errors are parsed into VideoRuntimeError', () => {
  nativeThrows = new Error('{%@source/unsupported-content-type::nope@%}');
  try {
    createSource('https://x/a.bin');
    throw new Error('expected throw');
  } catch (e) {
    expect(e).toBeInstanceOf(VideoRuntimeError);
    expect((e as VideoRuntimeError).code).toBe('source/unsupported-content-type');
  }
  nativeThrows = new Error('plain native failure');
  expect(() => createSource({ uri: 'https://x/a.mp4' })).toThrow('plain native failure');
});
