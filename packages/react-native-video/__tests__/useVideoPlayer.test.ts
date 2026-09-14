import { test, expect, beforeEach } from 'bun:test';
import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { player as native, resetNativeMocks } from './helpers/nativeMocks';
import type { VideoConfig } from '../src/core/types/VideoConfig';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const { useVideoPlayer } = await import('../src/core/hooks/useVideoPlayer');
const { VideoPlayer } = await import('../src/core/VideoPlayer');

beforeEach(resetNativeMocks);

type Props = {
  source: string | VideoConfig;
  setup?: (p: InstanceType<typeof VideoPlayer>) => void;
  onPlayer: (p: InstanceType<typeof VideoPlayer>) => void;
};

function Harness({ source, setup, onPlayer }: Props) {
  const player = useVideoPlayer(source, setup);
  useEffect(() => {
    onPlayer(player);
  });
  return null;
}

function mount(props: Omit<Props, 'onPlayer'>) {
  const seen: InstanceType<typeof VideoPlayer>[] = [];
  const el = (p: Omit<Props, 'onPlayer'>) =>
    React.createElement(Harness, { ...p, onPlayer: (x) => seen.push(x) });
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(el(props));
  });
  return {
    current: () => seen.at(-1)!,
    update: (p: Omit<Props, 'onPlayer'>) => act(() => renderer.update(el(p))),
    unmount: () => act(() => renderer.unmount()),
  };
}

test('creates one native player and keeps it across re-renders with the same source', () => {
  const h = mount({ source: 'https://x/a.mp4' });
  const first = h.current();
  h.update({ source: 'https://x/a.mp4' });
  expect(native.created).toHaveLength(1);
  expect(h.current()).toBe(first);
});

test('changing the source releases the old player and creates a new one', () => {
  const h = mount({ source: 'https://x/a.mp4' });
  const first = h.current();
  h.update({ source: 'https://x/b.mp4' });
  expect(native.created).toHaveLength(2);
  expect(native.created[0]!.released).toBe(1);
  expect(h.current()).not.toBe(first);
});

test('setup runs synchronously during creation when initializeOnCreation is false', () => {
  const calls: string[] = [];
  mount({
    source: { uri: 'https://x/a.mp4', initializeOnCreation: false },
    setup: () => calls.push('setup'),
  });
  expect(calls).toEqual(['setup']);
  expect(native.created[0]!.eventEmitter.listenerCount('onLoadStart')).toBe(0);
});

test('with the default initializeOnCreation, setup is deferred until the native load starts and runs once', () => {
  const calls: string[] = [];
  mount({ source: 'https://x/a.mp4', setup: () => calls.push('setup') });
  expect(calls).toEqual([]);
  const emitter = native.created[0]!.eventEmitter;
  expect(emitter.listenerCount('onLoadStart')).toBe(1);
  expect(emitter.listenerCount('onStatusChange')).toBe(1);
  act(() => emitter.emit('onLoadStart', {}));
  act(() => emitter.emit('onStatusChange', 'loading'));
  expect(calls).toEqual(['setup']);
});

test('a recreated player gets its own setup call', () => {
  const calls: string[] = [];
  const h = mount({
    source: { uri: 'https://x/a.mp4', initializeOnCreation: false },
    setup: (p) => calls.push(String((p.source as { uri: string }).uri)),
  });
  h.update({
    source: { uri: 'https://x/b.mp4', initializeOnCreation: false },
    setup: (p) => calls.push(String((p.source as { uri: string }).uri)),
  });
  expect(calls).toEqual(['https://x/a.mp4', 'https://x/b.mp4']);
});

test('unmount releases the native player', () => {
  const h = mount({ source: 'https://x/a.mp4' });
  h.unmount();
  expect(native.created[0]!.released).toBe(1);
});
