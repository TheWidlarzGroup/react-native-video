import { beforeEach, expect, test } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import './helpers/nativeMocks';
import type { AllPlayerEvents } from '../src/core/types/Events';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as any).__DEV__ = false;

const { VideoViewOverlay, VideoViewOverlayHost, hasVideoViewOverlay } =
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
    return images(r)[0]!.props.resizeMode;
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

test('renders a loader where the bundler does not define __DEV__ (web)', () => {
  const g = globalThis as any;
  const previous = g.__DEV__;
  delete g.__DEV__;
  try {
    const renderer = render({
      player: fakePlayer(),
      poster: 'https://example.com/poster.png',
      renderLoader: React.createElement('Loader'),
    });
    expect(
      renderer.root.findAll((node) => (node.type as unknown) === 'Loader')
    ).toHaveLength(1);
    expect(images(renderer)).toHaveLength(0);
  } finally {
    g.__DEV__ = previous;
  }
});

// --- VideoViewOverlayHost: the native video view must never be recreated ---

let videoMounts = 0;
let videoUnmounts = 0;

function FakeVideo(props: Record<string, unknown>) {
  React.useEffect(() => {
    videoMounts++;
    return () => {
      videoUnmounts++;
    };
  }, []);
  return React.createElement('NativeVideo', props);
}

function host(props: {
  hasOverlay: boolean;
  style?: unknown;
  onLayout?: (event: any) => void;
}) {
  return React.createElement(VideoViewOverlayHost, {
    ...props,
    renderVideo: (layoutProps: Record<string, unknown>) =>
      React.createElement(FakeVideo, layoutProps),
    renderOverlay: (addedToMountedView: boolean) =>
      React.createElement('Overlay', { addedToMountedView }),
  } as any);
}

const layoutEvent = (x: number, y: number, width: number, height: number) => ({
  nativeEvent: { layout: { x, y, width, height } },
});

const one = (r: TestRenderer.ReactTestRenderer, type: string) =>
  r.root.findAll((node) => (node.type as unknown) === type);

function mountHost(props: Parameters<typeof host>[0]) {
  videoMounts = 0;
  videoUnmounts = 0;
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(host(props));
  });
  return renderer;
}

test('a view without overlay props renders the video alone, with the app style', () => {
  const style = { width: 320, height: 180 };
  const r = mountHost({ hasOverlay: false, style });

  const tree = r.toJSON() as TestRenderer.ReactTestRendererJSON;
  expect(tree.type).toBe('NativeVideo');
  expect(tree.props.style).toBe(style);
  expect(one(r, 'View')).toHaveLength(0);
  expect(one(r, 'Overlay')).toHaveLength(0);
});

test('overlay props that arrive after mount do not recreate the video view', () => {
  const style = { width: 320, height: 180 };
  const r = mountHost({ hasOverlay: false, style });
  const video = one(r, 'NativeVideo')[0]!;

  act(() => video.props.onLayout(layoutEvent(10, 20, 320, 180)));
  act(() => r.update(host({ hasOverlay: true, style })));

  expect(videoMounts).toBe(1);
  expect(videoUnmounts).toBe(0);
  // The video keeps the app style, and the overlay sits over its measured frame.
  expect(one(r, 'NativeVideo')[0]!.props.style).toBe(style);
  expect(one(r, 'Overlay')).toHaveLength(1);
  const cover = one(r, 'View')[0]!;
  expect(cover.props.style[0].position).toBe('absolute');
  expect(cover.props.style[1]).toEqual({
    left: 10,
    top: 20,
    width: 320,
    height: 180,
  });

  // It follows the video when the layout changes, and goes away with the props.
  act(() =>
    one(r, 'NativeVideo')[0]!.props.onLayout(layoutEvent(0, 0, 400, 225))
  );
  expect(one(r, 'View')[0]!.props.style[1]).toEqual({
    left: 0,
    top: 0,
    width: 400,
    height: 225,
  });
  act(() => r.update(host({ hasOverlay: false, style })));
  expect(one(r, 'Overlay')).toHaveLength(0);
  expect(videoMounts).toBe(1);
  expect(videoUnmounts).toBe(0);
});

test('a view mounted with overlay props keeps its wrapper when they go away', () => {
  const style = { flex: 1 };
  const r = mountHost({ hasOverlay: true, style });

  const wrapper = r.toJSON() as TestRenderer.ReactTestRendererJSON;
  expect(wrapper.type).toBe('View');
  expect(wrapper.props.style).toBe(style);
  expect(one(r, 'Overlay')).toHaveLength(1);
  expect(one(r, 'NativeVideo')[0]!.props.onLayout).toBeUndefined();

  act(() => r.update(host({ hasOverlay: false, style })));
  expect((r.toJSON() as TestRenderer.ReactTestRendererJSON).type).toBe('View');
  expect(one(r, 'Overlay')).toHaveLength(0);

  act(() => r.update(host({ hasOverlay: true, style })));
  expect(one(r, 'Overlay')).toHaveLength(1);
  expect(videoMounts).toBe(1);
  expect(videoUnmounts).toBe(0);
});

test("the app's onLayout reports the view's own frame in both trees", () => {
  const seen: unknown[] = [];
  const onLayout = (event: any) => seen.push(event.nativeEvent.layout);

  const alone = mountHost({ hasOverlay: false, onLayout });
  act(() =>
    one(alone, 'NativeVideo')[0]!.props.onLayout(layoutEvent(5, 6, 7, 8))
  );
  expect(seen).toEqual([{ x: 5, y: 6, width: 7, height: 8 }]);

  // With a wrapper the app's handler is on the wrapper, which has the app's position.
  const wrapped = mountHost({ hasOverlay: true, onLayout });
  expect(
    (wrapped.toJSON() as TestRenderer.ReactTestRendererJSON).props.onLayout
  ).toBe(onLayout);
});

test('the overlay is told whether the video view was already on screen', () => {
  const flag = (r: TestRenderer.ReactTestRenderer) =>
    one(r, 'Overlay')[0]!.props.addedToMountedView;

  // Mounted together with the video: the view will still report "ready to display".
  const wrapped = mountHost({ hasOverlay: true });
  expect(flag(wrapped)).toBe(false);
  act(() => wrapped.update(host({ hasOverlay: true })));
  expect(flag(wrapped)).toBe(false);
  // Taken away and set again on the same view: that view reports nothing more.
  act(() => wrapped.update(host({ hasOverlay: false })));
  act(() => wrapped.update(host({ hasOverlay: true })));
  expect(flag(wrapped)).toBe(true);

  const alone = mountHost({ hasOverlay: false });
  act(() =>
    one(alone, 'NativeVideo')[0]!.props.onLayout(layoutEvent(0, 0, 1, 1))
  );
  act(() => alone.update(host({ hasOverlay: true })));
  expect(flag(alone)).toBe(true);
});
