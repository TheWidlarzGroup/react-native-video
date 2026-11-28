import { beforeEach, expect, test } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  platform,
  resetNativeMocks,
  viewManagers,
} from './helpers/nativeMocks';
import type { AllPlayerEvents } from '../src/core/types/Events';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as any).__DEV__ = false;

const { default: VideoView } = await import('../src/core/video-view/VideoView');

beforeEach(resetNativeMocks);

// A new player per test: the first-frame memory is kept per player object.
function fakePlayer() {
  const listeners = new Map<string, Set<(...a: any[]) => void>>();
  return {
    __getNativePlayer: () => ({}),
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
    count(event: string) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

const POSTER = 'https://x/poster.png';
const view = (props: Record<string, unknown>) =>
  React.createElement(VideoView as any, props);

function mount(props: Record<string, unknown>) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(view(props));
  });
  return renderer;
}

const all = (r: TestRenderer.ReactTestRenderer, type: string) =>
  r.root.findAll((node) => (node.type as unknown) === type);
const nativeView = (r: TestRenderer.ReactTestRenderer) =>
  all(r, 'RNCVideoView')[0]!;
const posters = (r: TestRenderer.ReactTestRenderer) => all(r, 'Image');
const layout = (x: number, y: number, width: number, height: number) => ({
  nativeEvent: { layout: { x, y, width, height } },
});

test('a view without the new props renders the native view alone, as before', () => {
  const style = { width: 320, height: 180 };
  const r = mount({ player: fakePlayer(), style });

  const tree = r.toJSON() as TestRenderer.ReactTestRendererJSON;
  expect(tree.type).toBe('RNCVideoView');
  expect(tree.props.style).toBe(style);
  expect(all(r, 'View')).toHaveLength(0);
  expect(posters(r)).toHaveLength(0);
});

test('the poster props stay in JS: none of them reaches the native view', () => {
  const r = mount({
    player: fakePlayer(),
    poster: POSTER,
    posterResizeMode: 'cover',
    renderLoader: undefined,
    shutterColor: 'black',
    hideShutterView: false,
    testID: 'video',
  });

  const props = nativeView(r).props;
  expect(props.testID).toBe('video');
  for (const key of [
    'poster',
    'posterResizeMode',
    'renderLoader',
    'shutterColor',
    'hideShutterView',
  ]) {
    expect(key in props).toBe(false);
  }
  expect(posters(r)).toHaveLength(1);
  expect(posters(r)[0]!.props.resizeMode).toBe('cover');
});

test('the poster covers the view until it is ready to display and returns for the next source', () => {
  const player = fakePlayer();
  const r = mount({ player, poster: POSTER });
  expect(posters(r)).toHaveLength(1);

  act(() => player.emit('onReadyToDisplay'));
  expect(posters(r)).toHaveLength(0);
  // The native view is still there, inside the wrapper that took the app's style.
  expect(all(r, 'RNCVideoView')).toHaveLength(1);

  act(() => player.emit('onLoadStart', { sourceType: 'network' }));
  expect(posters(r)).toHaveLength(1);
});

test('android: a second view of a player that already drew a frame is not covered', () => {
  platform.OS = 'android';
  const player = fakePlayer();
  // The first view starts the first-frame memory and sees the frame.
  mount({ player });
  act(() => player.emit('onLoadStart', { sourceType: 'network' }));
  act(() => player.emit('onReadyToDisplay'));

  const second = mount({ player, poster: POSTER });
  expect(posters(second)).toHaveLength(0);

  // A new source covers it again, and the next frame uncovers it.
  act(() => player.emit('onLoadStart', { sourceType: 'network' }));
  expect(posters(second)).toHaveLength(1);
  act(() => player.emit('onReadyToDisplay'));
  expect(posters(second)).toHaveLength(0);
});

test('ios: a second view is covered until its own ready-to-display event', () => {
  platform.OS = 'ios';
  const player = fakePlayer();
  mount({ player });
  act(() => player.emit('onReadyToDisplay'));

  // iOS reports the event for every view, so a view mounted later waits for it.
  const second = mount({ player, poster: POSTER });
  expect(posters(second)).toHaveLength(1);
  act(() => player.emit('onReadyToDisplay'));
  expect(posters(second)).toHaveLength(0);
});

test('a poster set after mount covers a view that has not drawn a frame, without recreating it', () => {
  const player = fakePlayer();
  const style = { width: 320, height: 180 };
  const r = mount({ player, style });
  const before = nativeView(r);
  act(() =>
    before.props.onNitroIdChange({
      nativeEvent: { nitroId: before.props.nitroId },
    })
  );
  act(() => before.props.onLayout(layout(10, 20, 320, 180)));

  act(() => r.update(view({ player, style, poster: POSTER })));

  expect(posters(r)).toHaveLength(1);
  // Same native view and the same view manager: nothing was torn down.
  expect(nativeView(r).props.nitroId).toBe(before.props.nitroId);
  expect(viewManagers.created).toHaveLength(1);
  expect(nativeView(r).props.style).toBe(style);

  act(() => player.emit('onReadyToDisplay'));
  expect(posters(r)).toHaveLength(0);
});

test('a poster set after the first frame does not cover the playing video, on either platform', () => {
  for (const os of ['ios', 'android']) {
    platform.OS = os;
    const player = fakePlayer();
    const r = mount({ player });
    act(() => nativeView(r).props.onLayout(layout(0, 0, 320, 180)));
    act(() => player.emit('onLoadStart', { sourceType: 'network' }));
    act(() => player.emit('onReadyToDisplay'));

    act(() => r.update(view({ player, poster: POSTER })));
    expect(posters(r)).toHaveLength(0);

    // The next source is covered.
    act(() => player.emit('onLoadStart', { sourceType: 'network' }));
    expect(posters(r)).toHaveLength(1);
  }
});

test("the app's onLayout still fires for a view that gets its poster later", () => {
  const seen: unknown[] = [];
  const player = fakePlayer();
  const onLayout = (event: any) => seen.push(event.nativeEvent.layout);
  const r = mount({ player, onLayout });
  act(() => nativeView(r).props.onLayout(layout(1, 2, 3, 4)));
  act(() => r.update(view({ player, onLayout, poster: POSTER })));
  act(() => nativeView(r).props.onLayout(layout(5, 6, 7, 8)));

  expect(seen).toEqual([
    { x: 1, y: 2, width: 3, height: 4 },
    { x: 5, y: 6, width: 7, height: 8 },
  ]);
});

test('unmounting removes the overlay listeners from the player', () => {
  const player = fakePlayer();
  const r = mount({ player, poster: POSTER });
  // One listener per event remembers the first frame for the player's lifetime,
  // one more belongs to the overlay of this view.
  expect(player.count('onLoadStart')).toBe(2);
  expect(player.count('onReadyToDisplay')).toBe(2);

  act(() => r.unmount());
  expect(player.count('onLoadStart')).toBe(1);
  expect(player.count('onReadyToDisplay')).toBe(1);
});

test('a second mount of the same player adds no first-frame listeners', () => {
  const player = fakePlayer();
  const first = mount({ player });
  const second = mount({ player });
  expect(player.count('onLoadStart')).toBe(1);
  expect(player.count('onReadyToDisplay')).toBe(1);
  act(() => first.unmount());
  act(() => second.unmount());
  expect(player.count('onReadyToDisplay')).toBe(1);
});

test('shutterColor alone covers the view and hideShutterView removes that cover', () => {
  const player = fakePlayer();
  const r = mount({ player, shutterColor: '#000000' });
  const cover = () =>
    all(r, 'View').filter((v) =>
      []
        .concat(v.props.style ?? [])
        .some((s: any) => s?.backgroundColor === '#000000')
    );
  expect(cover()).toHaveLength(1);
  expect(posters(r)).toHaveLength(0);

  act(() =>
    r.update(view({ player, shutterColor: '#000000', hideShutterView: true }))
  );
  expect(cover()).toHaveLength(0);
});
