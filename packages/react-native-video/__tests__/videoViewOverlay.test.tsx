import { beforeEach, expect, test } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import './helpers/nativeMocks';
import type { AllPlayerEvents } from '../src/core/types/Events';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as any).__DEV__ = false;

const { VideoViewOverlay, hasVideoViewOverlay } =
  await import('../src/core/video-view/VideoViewOverlay');

function fakePlayer() {
  const listeners = new Map<string, Set<(...a: any[]) => void>>();
  return {
    addEventListener<T extends keyof AllPlayerEvents>(
      event: T,
      cb: AllPlayerEvents[T]
    ) {
      const set = listeners.get(event) ?? new Set();
      listeners.set(event, set);
      set.add(cb as any);
      return { remove: () => set.delete(cb as any) };
    },
    emit(event: string, ...args: any[]) {
      listeners.get(event)?.forEach((cb) => cb(...args));
    },
  };
}

let ready = false;
const isReadyToDisplay = () => ready;

function render(props: Record<string, unknown>) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(VideoViewOverlay, {
        isReadyToDisplay,
        ...props,
      } as any)
    );
  });
  return renderer;
}

const images = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll((node) => (node.type as unknown) === 'Image');

beforeEach(() => {
  ready = false;
});

test('hasVideoViewOverlay is true only when something would be drawn', () => {
  expect(hasVideoViewOverlay({})).toBe(false);
  expect(hasVideoViewOverlay({ poster: '' })).toBe(false);
  expect(hasVideoViewOverlay({ poster: {} })).toBe(false);
  expect(hasVideoViewOverlay({ posterResizeMode: 'cover' })).toBe(false);
  expect(hasVideoViewOverlay({ hideShutterView: true })).toBe(false);
  expect(
    hasVideoViewOverlay({ shutterColor: 'red', hideShutterView: true })
  ).toBe(false);
  expect(hasVideoViewOverlay({ poster: 'https://x/p.png' })).toBe(true);
  expect(hasVideoViewOverlay({ poster: { source: 1 } })).toBe(true);
  expect(hasVideoViewOverlay({ shutterColor: 'red' })).toBe(true);
  expect(hasVideoViewOverlay({ renderLoader: null })).toBe(false);
  expect(hasVideoViewOverlay({ renderLoader: () => null })).toBe(true);
});

test('poster shows until the video is ready to display and returns on a new load', () => {
  const player = fakePlayer();
  const r = render({ player, poster: 'https://x/p.png' });

  expect(images(r)).toHaveLength(1);
  expect(images(r)[0]!.props.source).toEqual({ uri: 'https://x/p.png' });

  act(() => player.emit('onReadyToDisplay'));
  expect(r.toJSON()).toBeNull();

  act(() => player.emit('onLoadStart', { sourceType: 'network' }));
  expect(images(r)).toHaveLength(1);
});

test('nothing is drawn when the player already shows a frame', () => {
  ready = true;
  const r = render({ player: fakePlayer(), poster: 'https://x/p.png' });
  expect(r.toJSON()).toBeNull();
});

test('a different player is covered again', () => {
  const first = fakePlayer();
  const r = render({ player: first, poster: 'https://x/p.png' });
  act(() => first.emit('onReadyToDisplay'));
  expect(r.toJSON()).toBeNull();

  const second = fakePlayer();
  act(() => {
    r.update(
      React.createElement(VideoViewOverlay, {
        isReadyToDisplay,
        player: second,
        poster: 'https://x/p.png',
      } as any)
    );
  });
  expect(images(r)).toHaveLength(1);

  // The first player no longer drives this view.
  act(() => first.emit('onLoadStart', { sourceType: 'network' }));
  act(() => second.emit('onReadyToDisplay'));
  expect(r.toJSON()).toBeNull();
});

test('resize mode: poster.resizeMode, then posterResizeMode, then contain', () => {
  const mode = (props: Record<string, unknown>) => {
    const r = render({ player: fakePlayer(), ...props });
    return Object.assign({}, ...images(r)[0]!.props.style.flat()).resizeMode;
  };

  expect(mode({ poster: 'https://x/p.png' })).toBe('contain');
  expect(mode({ poster: 'https://x/p.png', posterResizeMode: 'cover' })).toBe(
    'cover'
  );
  expect(mode({ poster: 'https://x/p.png', posterResizeMode: 'none' })).toBe(
    'contain'
  );
  expect(
    mode({
      poster: { source: { uri: 'https://x/p.png' }, resizeMode: 'stretch' },
      posterResizeMode: 'cover',
    })
  ).toBe('stretch');
});

test('renderLoader replaces the poster and gets the fill style', () => {
  const seen: any[] = [];
  const r = render({
    player: fakePlayer(),
    poster: 'https://x/p.png',
    posterResizeMode: 'cover',
    renderLoader: (props: any) => {
      seen.push(props);
      return React.createElement('Loader');
    },
  });

  expect(images(r)).toHaveLength(0);
  expect(r.root.findAll((n) => (n.type as unknown) === 'Loader')).toHaveLength(
    1
  );
  expect(seen[0].resizeMode).toBe('cover');
  expect(seen[0].style).toBeDefined();

  const element = render({
    player: fakePlayer(),
    renderLoader: React.createElement('Spinner'),
  });
  expect(
    element.root.findAll((n) => (n.type as unknown) === 'Spinner')
  ).toHaveLength(1);
});

test('shutterColor paints the cover, hideShutterView turns it off', () => {
  const background = (props: Record<string, unknown>) => {
    const r = render({ player: fakePlayer(), ...props });
    const cover = r.toJSON() as TestRenderer.ReactTestRendererJSON;
    return Object.assign({}, ...cover.props.style.filter(Boolean))
      .backgroundColor;
  };

  expect(background({ shutterColor: 'black' })).toBe('black');
  expect(background({ poster: 'https://x/p.png' })).toBeUndefined();
  expect(
    background({
      poster: 'https://x/p.png',
      shutterColor: 'black',
      hideShutterView: true,
    })
  ).toBeUndefined();
});
