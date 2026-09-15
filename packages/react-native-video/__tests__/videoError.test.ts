import { test, expect } from 'bun:test';
import {
  tryParseNativeVideoError,
  VideoComponentError,
  VideoRuntimeError,
} from '../src/core/types/VideoError';

// Native throws errors whose message carries `{%@<code>::<message>@%}`; the JS side
// turns that into a typed VideoError so callers can switch on `error.code`.
const encoded = (code: string, message: string) => `{%@${code}::${message}@%}`;

test('parses a runtime error code and message out of a native error', () => {
  const err = tryParseNativeVideoError(
    new Error(`Nitro: ${encoded('source/file-does-not-exist', 'No such file')} at foo`)
  );
  expect(err).toBeInstanceOf(VideoRuntimeError);
  expect(err).toBeInstanceOf(Error);
  const video = err as VideoRuntimeError;
  expect(video.code).toBe('source/file-does-not-exist');
  expect(video.message).toBe('No such file');
  expect(video.name).toBe('[ReactNativeVideo] source/file-does-not-exist');
  expect(video.toString()).toBe('[source/file-does-not-exist]: No such file');
});

test('view/* codes become VideoComponentError', () => {
  const err = tryParseNativeVideoError({
    message: encoded('view/picture-in-picture-not-supported', 'PiP unavailable'),
  });
  expect(err).toBeInstanceOf(VideoComponentError);
  expect((err as VideoComponentError).code).toBe('view/picture-in-picture-not-supported');
});

test('rewrites the encoded marker inside the stack and carries the stack over', () => {
  const native = new Error(encoded('player/released', 'gone'));
  native.stack = `Error: ${encoded('player/released', 'gone')}\n    at nativeCall (native)`;
  const err = tryParseNativeVideoError(native) as VideoRuntimeError;
  expect(err.stack).toBe('Error: [player/released]: gone\n    at nativeCall (native)');
  expect(native.stack).toBe(err.stack);
});

test('a native error without a stack yields an undefined stack', () => {
  const err = tryParseNativeVideoError({ message: encoded('unknown/unknown', 'x') });
  expect((err as VideoRuntimeError).stack).toBeUndefined();
});

test('returns anything that is not an encoded native error untouched', () => {
  const plain = new Error('boom');
  expect(tryParseNativeVideoError(plain)).toBe(plain);
  const partial = new Error('{%@only-code@%}');
  expect(tryParseNativeVideoError(partial)).toBe(partial);
  expect(tryParseNativeVideoError('string')).toBe('string');
  expect(tryParseNativeVideoError(null)).toBeNull();
  expect(tryParseNativeVideoError(undefined)).toBeUndefined();
  expect(tryParseNativeVideoError(42)).toBe(42);
  const noMessage = { code: 'source/invalid-uri' };
  expect(tryParseNativeVideoError(noMessage)).toBe(noMessage);
});

test('an already-typed VideoRuntimeError passes through unchanged', () => {
  const typed = new VideoRuntimeError('source/invalid-uri', 'Invalid source URI');
  expect(tryParseNativeVideoError(typed)).toBe(typed);
});

test('VideoError exposes code and message separately from the Error message', () => {
  const err = new VideoRuntimeError('player/not-initialized', 'call initialize() first');
  expect(err.code).toBe('player/not-initialized');
  expect(err.message).toBe('call initialize() first');
  expect(String(err)).toBe('[player/not-initialized]: call initialize() first');
});
