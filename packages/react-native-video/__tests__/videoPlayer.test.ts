import { test, expect, beforeEach } from 'bun:test';
import { VideoRuntimeError } from '../src/core/types/VideoError';
import { player as native, resetNativeMocks } from './helpers/nativeMocks';

const encoded = (code: string, message: string) => `{%@${code}::${message}@%}`;

const { VideoPlayer } = await import('../src/core/VideoPlayer');

beforeEach(resetNativeMocks);

test('a sync method throws the parsed error when nobody listens to onError', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  native.playThrows = new Error(encoded('player/not-initialized', 'init first'));
  try {
    player.play();
    throw new Error('expected throw');
  } catch (e) {
    expect(e).toBeInstanceOf(VideoRuntimeError);
    expect((e as VideoRuntimeError).code).toBe('player/not-initialized');
  }
});

test('a sync method delivers to onError instead of throwing when a listener exists', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  const seen: string[] = [];
  player.addEventListener('onError', (e) => seen.push(e.code));
  native.playThrows = new Error(encoded('player/not-initialized', 'init first'));
  expect(() => player.play()).not.toThrow();
  expect(seen).toEqual(['player/not-initialized']);
});

test('an unparsable native error is rethrown as-is, even with an onError listener', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  let calls = 0;
  player.addEventListener('onError', () => void calls++);
  native.playThrows = new Error('plain');
  expect(() => player.play()).toThrow('plain');
  expect(calls).toBe(0);
});

test('a resolved native promise resolves', async () => {
  const player = new VideoPlayer('https://x/a.mp4');
  await expect(player.initialize()).resolves.toBeUndefined();
});

