import { test, expect, beforeEach } from 'bun:test';
import { VideoPlayerEvents } from '../src/core/events/VideoPlayerEvents.native';
import type { VideoPlayerEventEmitterBase } from '../src/core/types/EventEmitter';

// Every client-side ad event, with the native emitter method it must be wired to. A new
// ad event added to the player but not wired here (or wired to the wrong listener) fails.
const AD_EVENTS = [
  [
    'onAdsResolved',
    'addOnAdsResolvedListener',
    { hasAds: true, elapsedMs: 120 },
  ],
  [
    'onAdBreakStart',
    'addOnAdBreakStartListener',
    { kind: 'preRoll', totalAds: 2 },
  ],
  ['onAdBreakEnd', 'addOnAdBreakEndListener', { kind: 'midRoll', totalAds: 1 }],
  [
    'onAdProgress',
    'addOnAdProgressListener',
    { currentTime: 1, duration: 5, adPodIndex: 0, totalAdsInPod: 1 },
  ],
  ['onAdStart', 'addOnAdStartListener', { adId: 'a', skippable: false }],
  ['onAdComplete', 'addOnAdCompleteListener', { adId: 'a', skippable: false }],
  ['onAdSkipped', 'addOnAdSkippedListener', { adId: 'a', skippable: true }],
  ['onAdClicked', 'addOnAdClickedListener', undefined],
  [
    'onAdError',
    'addOnAdErrorListener',
    { code: 1009, message: 'x', fatal: true },
  ],
  ['onAllAdsCompleted', 'addOnAllAdsCompletedListener', undefined],
  ['onAdStateChange', 'addOnAdStateChangeListener', 'playing'],
] as const;

const registered = new Map<string, (payload?: unknown) => void>();
const removed = new Set<string>();

// A native emitter stand-in: any `addOn<Event>Listener` call is recorded under its own
// name, and the subscription it returns records its removal.
const fakeEmitter = new Proxy(
  {},
  {
    get: (_, prop: string) => (listener: (payload?: unknown) => void) => {
      registered.set(prop, listener);
      return { remove: () => removed.add(prop) };
    },
  }
) as unknown as VideoPlayerEventEmitterBase;

beforeEach(() => {
  registered.clear();
  removed.clear();
});

for (const [event, nativeMethod, payload] of AD_EVENTS) {
  test(`${event} is wired to ${nativeMethod}, forwards its payload and unsubscribes`, () => {
    const events = new VideoPlayerEvents(fakeEmitter);
    const received: unknown[] = [];
    const subscription = events.addEventListener(event, ((data: unknown) =>
      received.push(data)) as never);

    const nativeListener = registered.get(nativeMethod);
    expect(nativeListener).not.toBeUndefined();

    nativeListener?.(payload);
    expect(received).toEqual([payload]);

    subscription.remove();
    expect(removed.has(nativeMethod)).toBe(true);
  });
}

// The single `onAdEvent` listener: one subscription fans out to every native ad listener
// and delivers `{ type, data }`.
const AD_EVENT_TYPES: Record<string, string> = {
  onAdsResolved: 'adsResolved',
  onAdBreakStart: 'adBreakStart',
  onAdBreakEnd: 'adBreakEnd',
  onAdProgress: 'adProgress',
  onAdStart: 'adStart',
  onAdComplete: 'adComplete',
  onAdSkipped: 'adSkipped',
  onAdClicked: 'adClicked',
  onAdError: 'adError',
  onAllAdsCompleted: 'allAdsCompleted',
  onAdStateChange: 'adStateChange',
};

test('onAdEvent subscribes to every ad event and reports { type, data } for each', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const received: unknown[] = [];
  events.addEventListener('onAdEvent', ((event: unknown) =>
    received.push(event)) as never);

  expect(registered.size).toBe(AD_EVENTS.length);
  for (const [event, nativeMethod, payload] of AD_EVENTS) {
    registered.get(nativeMethod)?.(payload);
    expect(received.at(-1)).toEqual({
      type: AD_EVENT_TYPES[event],
      data: payload,
    });
  }
  expect(received).toHaveLength(AD_EVENTS.length);
});

test('removing the onAdEvent subscription removes every native ad listener', () => {
  const events = new VideoPlayerEvents(fakeEmitter);
  const subscription = events.addEventListener(
    'onAdEvent',
    (() => {}) as never
  );

  subscription.remove();
  for (const [, nativeMethod] of AD_EVENTS) {
    expect(removed.has(nativeMethod)).toBe(true);
  }
});
