import { expect, test } from 'bun:test';
import {
  hasShownFirstFrame,
  trackFirstFrame,
} from '../src/core/video-view/firstFrame';

function fakePlayer() {
  const listeners = new Map<string, Set<() => void>>();
  return {
    count: (event: string) => listeners.get(event)?.size ?? 0,
    addEventListener(event: string, cb: () => void) {
      const set = listeners.get(event) ?? new Set();
      listeners.set(event, set);
      set.add(cb);
      return { remove: () => set.delete(cb) };
    },
    emit(event: string) {
      listeners.get(event)?.forEach((cb) => cb());
    },
  };
}

test('a source has shown its first frame from onReadyToDisplay until the next load', () => {
  const player = fakePlayer();
  trackFirstFrame(player as any);
  expect(hasShownFirstFrame(player as any)).toBe(false);

  player.emit('onReadyToDisplay');
  expect(hasShownFirstFrame(player as any)).toBe(true);

  // A stall or the end changes the status, not the fact that a frame was shown.
  player.emit('onBuffer');
  player.emit('onEnd');
  expect(hasShownFirstFrame(player as any)).toBe(true);

  player.emit('onLoadStart');
  expect(hasShownFirstFrame(player as any)).toBe(false);
});

test('tracking the same player again adds no listeners', () => {
  const player = fakePlayer();
  trackFirstFrame(player as any);
  trackFirstFrame(player as any);
  expect(player.count('onReadyToDisplay')).toBe(1);
  expect(player.count('onLoadStart')).toBe(1);
});

test('an untracked or released player has shown no frame', () => {
  expect(hasShownFirstFrame(fakePlayer() as any)).toBe(false);

  const released = {
    addEventListener() {
      throw new Error('released');
    },
  };
  expect(() => trackFirstFrame(released as any)).not.toThrow();
  expect(hasShownFirstFrame(released as any)).toBe(false);
});
