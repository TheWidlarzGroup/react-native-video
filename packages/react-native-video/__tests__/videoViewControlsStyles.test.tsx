import { beforeEach, expect, test } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { resetNativeMocks, viewManagers } from './helpers/nativeMocks';
import {
  DEFAULT_CONTROLS_STYLES,
  type ControlsStyles,
} from '../src/core/types/ControlsStyles';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const { default: VideoView } = await import('../src/core/video-view/VideoView');

beforeEach(resetNativeMocks);

const nativePlayer = { name: 'native-player' };
const player = { __getNativePlayer: () => nativePlayer } as any;

const view = (props: Record<string, unknown> = {}) =>
  React.createElement(VideoView as any, { player, ...props });

// Mounts the view and lets native report its id, which is when the library creates the
// view manager and starts assigning props to it.
function mount(props: Record<string, unknown> = {}) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(view(props));
  });
  const native = renderer.root.findByType('RNCVideoView' as any);
  act(() => {
    native.props.onNitroIdChange({
      nativeEvent: { nitroId: native.props.nitroId },
    });
  });
  return renderer;
}

const manager = () => viewManagers.created.at(-1)!;
const sent = () => manager().controlsStyles as Record<string, boolean>;

test('without the prop native gets the complete defaults', () => {
  mount();
  expect(viewManagers.created).toHaveLength(1);
  expect(sent()).toEqual(DEFAULT_CONTROLS_STYLES);
  expect(manager().player).toBe(nativePlayer);
});

test('an empty object, undefined and null all mean the defaults', () => {
  for (const controlsStyles of [{}, undefined, null]) {
    mount({ controlsStyles });
    expect(sent()).toEqual(DEFAULT_CONTROLS_STYLES);
  }
});

test('each field reaches native on its own and leaves the others at their defaults', () => {
  for (const key of Object.keys(
    DEFAULT_CONTROLS_STYLES
  ) as (keyof ControlsStyles)[]) {
    // Flip the default, so the two fields that default to true are covered as well.
    const value = !DEFAULT_CONTROLS_STYLES[key];
    mount({ controlsStyles: { [key]: value } });
    expect(sent()).toEqual({ ...DEFAULT_CONTROLS_STYLES, [key]: value });
  }
});

test('native always gets all twelve fields as booleans', () => {
  mount({ controlsStyles: { hideSeekBar: true, hideNext: undefined } });
  const styles = sent();
  expect(Object.keys(styles).sort()).toEqual(
    Object.keys(DEFAULT_CONTROLS_STYLES).sort()
  );
  expect(Object.keys(styles)).toHaveLength(12);
  for (const value of Object.values(styles)) {
    expect(typeof value).toBe('boolean');
  }
});

test('a changed prop reaches the same view manager, and removing it restores the defaults', () => {
  const r = mount({ controlsStyles: { hidePlayPause: true } });
  const first = manager();
  expect(sent().hidePlayPause).toBe(true);

  act(() => {
    r.update(
      view({ controlsStyles: { hidePlayPause: false, hideSeekBar: true } })
    );
  });
  expect(viewManagers.created).toHaveLength(1);
  expect(manager()).toBe(first);
  expect(sent()).toEqual({ ...DEFAULT_CONTROLS_STYLES, hideSeekBar: true });

  act(() => {
    r.update(view());
  });
  expect(sent()).toEqual(DEFAULT_CONTROLS_STYLES);
});

test('an unrelated re-render sends equal values again (native drops the repeat)', () => {
  const controlsStyles = { hideFullscreen: true };
  const r = mount({ controlsStyles, controls: false });
  const before = sent();

  act(() => {
    r.update(view({ controlsStyles, controls: true }));
  });
  // The object is rebuilt on every update, so equality by value is what native can rely on.
  expect(sent()).toEqual(before);
  expect(manager().controls).toBe(true);
});

test('the app object is not changed, and the defaults stay intact', () => {
  const controlsStyles = Object.freeze({ hideRewind: true });
  mount({ controlsStyles });
  expect(controlsStyles).toEqual({ hideRewind: true });
  expect(sent()).not.toBe(DEFAULT_CONTROLS_STYLES);
  expect(DEFAULT_CONTROLS_STYLES.hideRewind).toBe(false);
});

test('nothing is assigned before native reports the view id', () => {
  act(() => {
    TestRenderer.create(view({ controlsStyles: { hideSeekBar: true } }));
  });
  expect(viewManagers.created).toHaveLength(0);
});
