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
