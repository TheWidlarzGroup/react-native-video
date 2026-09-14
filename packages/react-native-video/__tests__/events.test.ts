import { test, expect } from 'bun:test';
import { ALL_PLAYER_EVENTS } from '../src/core/types/Events';
import { VideoPlayerEvents } from '../src/core/events/VideoPlayerEvents.native';
import type { VideoPlayerEventEmitterBase } from '../src/core/types/EventEmitter';
import { VideoRuntimeError } from '../src/core/types/VideoError';

// Records every addOn*Listener call so the test can assert that each JS event name is
// routed to the emitter method of the same name, and nothing else.
function fakeEmitter() {
  const calls: { method: string; listener: unknown }[] = [];
  const removed: string[] = [];
  let cleared = 0;
  const emitter = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === 'clearAllListeners') return () => void cleared++;
        if (typeof prop === 'string' && /^addOn[A-Za-z]+Listener$/.test(prop)) {
          return (listener: unknown) => {
            calls.push({ method: prop, listener });
            return { remove: () => void removed.push(prop) };
          };
        }
        return undefined;
      },
    }
  ) as VideoPlayerEventEmitterBase;
  return {
    emitter,
    calls,
    removed,
    get cleared() {
      return cleared;
    },
  };
}

// Exposes the protected trigger so onError delivery can be tested directly.
class Events extends VideoPlayerEvents {
  trigger(error: VideoRuntimeError) {
    return this.triggerJSEvent('onError', error);
  }
}

const nativeEvents = ALL_PLAYER_EVENTS.filter((e) => e !== 'onError');

test('every native event routes to the emitter method of the same name', () => {
  const fake = fakeEmitter();
  const events = new Events(fake.emitter);
  for (const event of nativeEvents) {
    const cb = () => {};
    const sub = events.addEventListener(event, cb as never);
    const expected = `add${event[0]!.toUpperCase()}${event.slice(1)}Listener`;
    expect(fake.calls.at(-1)).toEqual({ method: expected, listener: cb });
    sub.remove();
    expect(fake.removed.at(-1)).toBe(expected);
  }
  expect(fake.calls).toHaveLength(nativeEvents.length);
});

test('ALL_PLAYER_EVENTS is exhaustive for addEventListener', () => {
  // A new event added to the type union but not to the switch would throw here
  // instead of at runtime in an app.
  const events = new Events(fakeEmitter().emitter);
  for (const event of ALL_PLAYER_EVENTS) {
    expect(() => events.addEventListener(event, (() => {}) as never)).not.toThrow();
  }
});

test('an unknown event name throws', () => {
  const events = new Events(fakeEmitter().emitter);
  // @ts-expect-error runtime guard
  expect(() => events.addEventListener('onNope', () => {})).toThrow(/Unsupported event: onNope/);
});

test('onError is JS-only: never forwarded to the emitter, delivered to every listener', () => {
  const fake = fakeEmitter();
  const events = new Events(fake.emitter);
  const seen: string[] = [];
  events.addEventListener('onError', (e) => seen.push(`a:${e.code}`));
  events.addEventListener('onError', (e) => seen.push(`b:${e.code}`));
  expect(fake.calls).toHaveLength(0);

  const err = new VideoRuntimeError('player/not-initialized', 'x');
  expect(events.trigger(err)).toBe(true);
  expect(seen).toEqual(['a:player/not-initialized', 'b:player/not-initialized']);
});

test('trigger reports whether anyone was listening', () => {
  const events = new Events(fakeEmitter().emitter);
  const err = new VideoRuntimeError('unknown/unknown', 'x');
  expect(events.trigger(err)).toBe(false);
  const sub = events.addEventListener('onError', () => {});
  expect(events.trigger(err)).toBe(true);
  sub.remove();
  // The Set still exists but is empty: nothing is delivered, and the caller must not
  // treat this as "handled" — VideoPlayer.throwError relies on the return value to
  // decide whether to throw.
  expect(events.trigger(err)).toBe(false);
});

test('the same onError callback is not registered twice', () => {
  const events = new Events(fakeEmitter().emitter);
  let calls = 0;
  const cb = () => void calls++;
  events.addEventListener('onError', cb);
  events.addEventListener('onError', cb);
  events.trigger(new VideoRuntimeError('unknown/unknown', 'x'));
  expect(calls).toBe(1);
});

test('clearAllEvents drops JS listeners and clears the native emitter', () => {
  const fake = fakeEmitter();
  const events = new Events(fake.emitter);
  let calls = 0;
  events.addEventListener('onError', () => void calls++);
  events.clearAllEvents();
  expect(fake.cleared).toBe(1);
  expect(events.trigger(new VideoRuntimeError('unknown/unknown', 'x'))).toBe(false);
  expect(calls).toBe(0);
});
