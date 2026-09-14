import { test, expect, beforeEach } from 'bun:test';
import { VideoRuntimeError } from '../src/core/types/VideoError';
import {
  assets,
  platform,
  resetNativeMocks,
  sourceFactory as native,
} from './helpers/nativeMocks';

const { createSource, createSourceFromUri, createSourceFromVideoConfig } = await import(
  '../src/core/utils/sourceFactory'
);

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
  native.throws = new Error('{%@source/unsupported-content-type::nope@%}');
  try {
    createSource('https://x/a.bin');
    throw new Error('expected throw');
  } catch (e) {
    expect(e).toBeInstanceOf(VideoRuntimeError);
    expect((e as VideoRuntimeError).code).toBe('source/unsupported-content-type');
  }
  native.throws = new Error('plain native failure');
  expect(() => createSource({ uri: 'https://x/a.mp4' })).toThrow('plain native failure');
});
