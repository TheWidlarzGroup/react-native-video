import { test, expect, beforeEach } from 'bun:test';
import { VideoRuntimeError } from '../src/core/types/VideoError';
import { player as native, resetNativeMocks } from './helpers/nativeMocks';

const encoded = (code: string, message: string) => `{%@${code}::${message}@%}`;

const { VideoPlayer } = await import('../src/core/VideoPlayer');

beforeEach(resetNativeMocks);

test('a sync method throws the parsed error when nobody listens to onError', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  native.playThrows = new Error(
    encoded('player/not-initialized', 'init first')
  );
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
  native.playThrows = new Error(
    encoded('player/not-initialized', 'init first')
  );
  expect(() => player.play()).not.toThrow();
  expect(seen).toEqual(['player/not-initialized']);
});

test('after the last onError listener is removed, errors throw again', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  const sub = player.addEventListener('onError', () => {});
  sub.remove();
  native.playThrows = new Error(encoded('player/released', 'gone'));
  expect(() => player.play()).toThrow(VideoRuntimeError);
});

test('an unparsable native error is rethrown as-is, even with an onError listener', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  let calls = 0;
  player.addEventListener('onError', () => {
    calls++;
  });
  native.playThrows = new Error('plain');
  expect(() => player.play()).toThrow('plain');
  expect(calls).toBe(0);
});

test('a rejected native promise rejects with the parsed error when nobody listens', async () => {
  const player = new VideoPlayer('https://x/a.mp4');
  native.initializeRejects = new Error(
    encoded('source/file-does-not-exist', 'missing')
  );
  const err = await player.initialize().catch((e: unknown) => e);
  expect(err).toBeInstanceOf(VideoRuntimeError);
  expect((err as VideoRuntimeError).code).toBe('source/file-does-not-exist');
});

test('a rejected native promise notifies onError and still rejects with the error', async () => {
  const player = new VideoPlayer('https://x/a.mp4');
  const seen: string[] = [];
  player.addEventListener('onError', (e) => seen.push(e.code));
  native.initializeRejects = new Error(
    encoded('source/file-does-not-exist', 'missing')
  );
  const err = await player.initialize().catch((e: unknown) => e);
  expect(seen).toEqual(['source/file-does-not-exist']);
  expect(err).toBeInstanceOf(VideoRuntimeError);
});

test('a resolved native promise resolves', async () => {
  const player = new VideoPlayer('https://x/a.mp4');
  await expect(player.initialize()).resolves.toBeUndefined();
});

test('a second release() inside the grace window does not release the native player again', () => {
  const player = new VideoPlayer('https://x/a.mp4');
  player.release();
  player.release();
  expect(native.released).toBe(1);
});

test('a load superseded by a newer load rejects with player/cancelled but is not delivered to onError', async () => {
  const player = new VideoPlayer('https://x/a.mp4');
  const seen: string[] = [];
  player.addEventListener('onError', (e) => seen.push(e.code));

  let rejectFirst!: (error: unknown) => void;
  native.initializeImpl = () =>
    new Promise<void>((_, reject) => {
      rejectFirst = reject;
    });
  const first = player.initialize().catch((e: unknown) => e);

  // A newer load from JS supersedes the first one; native then cancels it.
  native.initializeImpl = null;
  await player.replaceSourceAsync('https://x/b.mp4');
  rejectFirst(
    new Error(encoded('player/cancelled', 'Operation was cancelled'))
  );

  expect(((await first) as VideoRuntimeError).code).toBe('player/cancelled');
  expect(seen).toEqual([]);
});

test('a cancellation with no newer load (the player was released) is delivered to onError', async () => {
  // Both platforms reject every load with player/cancelled once the native player has
  // been released, e.g. by replaceSourceAsync(null). Nothing superseded that load, so the
  // app must hear about it.
  const player = new VideoPlayer('https://x/a.mp4');
  const seen: string[] = [];
  player.addEventListener('onError', (e) => seen.push(e.code));
  await player.replaceSourceAsync(null);

  native.initializeRejects = new Error(
    encoded('player/cancelled', 'Operation was cancelled')
  );
  const err = await player.initialize().catch((e: unknown) => e);
  expect((err as VideoRuntimeError).code).toBe('player/cancelled');
  expect(seen).toEqual(['player/cancelled']);
});

test('replaceSourceAsync with an invalid source notifies onError and rejects', async () => {
  // createSource throws synchronously; it must take the same path as a native rejection.
  const player = new VideoPlayer('https://x/a.mp4');
  const seen: string[] = [];
  player.addEventListener('onError', (e) => seen.push(e.code));
  const err = await player
    .replaceSourceAsync({ uri: '' })
    .catch((e: unknown) => e);
  expect((err as VideoRuntimeError).code).toBe('source/invalid-uri');
  expect(seen).toEqual(['source/invalid-uri']);
});

test('a rejected replaceSourceAsync rejects with the parsed error', async () => {
  const player = new VideoPlayer('https://x/a.mp4');
  native.replaceSourceRejects = new Error(encoded('source/invalid-uri', 'bad'));
  const err = await player
    .replaceSourceAsync('https://x/b.mp4')
    .catch((e: unknown) => e);
  expect(err).toBeInstanceOf(VideoRuntimeError);
  expect((err as VideoRuntimeError).code).toBe('source/invalid-uri');
});

test('replaceSourceAsync(null) resolves', async () => {
  const player = new VideoPlayer('https://x/a.mp4');
  await expect(player.replaceSourceAsync(null)).resolves.toBeUndefined();
});
