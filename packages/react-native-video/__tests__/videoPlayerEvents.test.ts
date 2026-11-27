import { test, expect, beforeEach } from 'bun:test';
import { VideoPlayerEvents } from '../src/core/events/VideoPlayerEvents.native';
import type { VideoPlayerEventEmitterBase } from '../src/core/types/EventEmitter';
import { VideoRuntimeError } from '../src/core/types/VideoError';

// A native emitter stand-in: keeps the listeners passed to `addOnErrorListener`, like the
// native emitters do, so a test can report an asynchronous native failure (e.g. a 404)
// the way the player does.
const nativeErrorListeners = new Set<(error: string) => void>();
let nativeErrorSubscriptionRemoved = false;

const fakeEmitter = new Proxy(
  {
    addOnErrorListener(listener: (error: string) => void) {
      nativeErrorListeners.add(listener);
      return {
        remove: () => {
          nativeErrorSubscriptionRemoved = true;
          nativeErrorListeners.delete(listener);
        },
      };
    },
    clearAllListeners() {
      nativeErrorListeners.clear();
    },
  },
  {
    get: (target, prop) =>
      prop in target
        ? target[prop as keyof typeof target]
        : () => ({ remove: () => {} }),
  }
) as unknown as VideoPlayerEventEmitterBase;

const reportNativeError = (error: string) =>
  nativeErrorListeners.forEach((listener) => listener(error));

const NOT_FOUND =
  '{%@player/playback-failed::NSURLErrorDomain -1100: not found@%}';

beforeEach(() => {
  nativeErrorListeners.clear();
  nativeErrorSubscriptionRemoved = false;
});

test('onError receives a VideoRuntimeError when the native emitter reports an async error', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const received: unknown[] = [];
  events.addEventListener('onError', (error) => received.push(error));

  reportNativeError(NOT_FOUND);

  expect(received).toHaveLength(1);
  expect(received[0]).toBeInstanceOf(VideoRuntimeError);
  const error = received[0] as VideoRuntimeError;
  expect(error.code).toBe('player/playback-failed');
  expect(error.message).toBe('NSURLErrorDomain -1100: not found');
});

test('one native error reaches each onError listener exactly once', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const first: unknown[] = [];
  const second: unknown[] = [];
  events.addEventListener('onError', (error) => first.push(error));
  events.addEventListener('onError', (error) => second.push(error));

  reportNativeError(NOT_FOUND);

  expect(first).toHaveLength(1);
  expect(second).toHaveLength(1);
});

test('removing the onError subscription removes the native listener too', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const received: unknown[] = [];
  const subscription = events.addEventListener('onError', (error) =>
    received.push(error)
  );

  reportNativeError(NOT_FOUND);
  expect(received).toHaveLength(1);

  subscription.remove();
  reportNativeError(NOT_FOUND);

  expect(received).toHaveLength(1);
  expect(nativeErrorSubscriptionRemoved).toBe(true);
});

test('a callback added twice gets one native error once, and one remove() detaches it', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const received: unknown[] = [];
  const callback = (error: unknown) => received.push(error);
  const subscription = events.addEventListener('onError', callback);
  events.addEventListener('onError', callback);

  reportNativeError(NOT_FOUND);
  expect(received).toHaveLength(1);

  subscription.remove();
  reportNativeError(NOT_FOUND);

  expect(received).toHaveLength(1);
  expect(nativeErrorListeners.size).toBe(0);
});

test('the native listener stays while another onError listener is subscribed', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const first: unknown[] = [];
  const second: unknown[] = [];
  const subscription = events.addEventListener('onError', (error) =>
    first.push(error)
  );
  events.addEventListener('onError', (error) => second.push(error));

  subscription.remove();
  reportNativeError(NOT_FOUND);

  expect(first).toHaveLength(0);
  expect(second).toHaveLength(1);
});

test('onError listeners added after clearAllEvents get native errors again', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  events.addEventListener('onError', () => {});
  events.clearAllEvents();

  const received: unknown[] = [];
  events.addEventListener('onError', (error) => received.push(error));
  reportNativeError(NOT_FOUND);

  expect(received).toHaveLength(1);
});

test('a native message containing "@" still reaches onError with its code', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const received: unknown[] = [];
  events.addEventListener('onError', (error) => received.push(error));

  reportNativeError(
    '{%@player/playback-failed::NSURLErrorDomain -1100: https://user@host/a.m3u8@%}'
  );

  expect(received).toHaveLength(1);
  const error = received[0] as VideoRuntimeError;
  expect(error.code).toBe('player/playback-failed');
  expect(error.message).toBe(
    'NSURLErrorDomain -1100: https://user@host/a.m3u8'
  );
});

test('a native payload that does not parse is reported, not dropped', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const received: unknown[] = [];
  events.addEventListener('onError', (error) => received.push(error));

  reportNativeError('Response code: 404');

  expect(received).toHaveLength(1);
  expect(received[0]).toBeInstanceOf(VideoRuntimeError);
  const error = received[0] as VideoRuntimeError;
  expect(error.code).toBe('player/playback-failed');
  expect(error.message).toBe('Response code: 404');
});

test('a parsed view error keeps its code instead of becoming playback-failed', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const received: unknown[] = [];
  events.addEventListener('onError', (error) => received.push(error));

  reportNativeError('{%@view/not-found::View was not found@%}');

  expect(received).toHaveLength(1);
  const error = received[0] as VideoRuntimeError;
  expect(error.code).toBe('view/not-found');
  expect(error.message).toBe('View was not found');
});
