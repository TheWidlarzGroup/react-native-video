import { test, expect, beforeEach } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import './helpers/nativeMocks';
import { flush, resetW3c, w3c } from './helpers/w3cmediaMock';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const { VideoPlayer } = await import('../src/core/VideoPlayer.kepler');
const { default: VideoView } =
  await import('../src/core/video-view/VideoView.kepler');

type Player = InstanceType<typeof VideoPlayer>;

beforeEach(resetW3c);

async function twoPlayers() {
  const a = new VideoPlayer('https://cdn.test/a.mp4');
  const b = new VideoPlayer('https://cdn.test/b.mp4');
  await flush();
  return { a, b, na: w3c.created[0]!, nb: w3c.created[1]! };
}

function show(player: Player, style?: object) {
  const el = (p: Player, s?: object) =>
    React.createElement(VideoView, { player: p as never, style: s });
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(el(player, style));
  });
  return {
    update: (p: Player, s?: object) => act(() => renderer.update(el(p, s))),
    unmount: () => act(() => renderer.unmount()),
  };
}

test('the surface moves to the new player when the player prop changes', async () => {
  const { a, b, na, nb } = await twoPlayers();
  const view = show(a);
  act(() => w3c.surface!.onSurfaceViewCreated('s1'));
  expect(na.calls).toContain('setSurfaceHandle(s1)');

  view.update(b);
  expect(na.calls).toContain('clearSurfaceHandle(s1)');
  expect(nb.calls).toContain('setSurfaceHandle(s1)');

  act(() => w3c.surface!.onSurfaceViewDestroyed('s1'));
  expect(nb.calls).toContain('clearSurfaceHandle(s1)');
});

test('media controls are given to the player once, not on every render', async () => {
  const { a, na } = await twoPlayers();
  a.showNotificationControls = true;
  const view = show(a);
  view.update(a, { flex: 1 });
  view.update(a, { flex: 2 });
  expect(na.calls.filter((c) => c.startsWith('setMediaControlFocus'))).toEqual([
    'setMediaControlFocus(app)',
  ]);
});

test('the shown player pauses when the app goes to the background', async () => {
  const { a, na } = await twoPlayers();
  const view = show(a);
  act(() => w3c.appState.forEach((listener) => listener('background')));
  expect(na.calls.slice(-1)).toEqual(['pause']);

  view.unmount();
  expect(w3c.appState.size).toBe(0);
});
