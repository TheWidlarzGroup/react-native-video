import { test, expect } from 'bun:test';
import * as ReactNS from 'react';
import React, { StrictMode } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useEvent } from '../src/core/hooks/useEvent';
import type { AllPlayerEvents } from '../src/core/types/Events';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const stable = typeof (ReactNS as any).useEffectEvent === 'function';

function fakePlayer() {
  const listeners = new Map<string, Set<(...a: any[]) => void>>();
  const p = {
    adds: 0,
    removes: 0,
    addEventListener<T extends keyof AllPlayerEvents>(
      event: T,
      cb: AllPlayerEvents[T]
    ) {
      p.adds++;
      const set = listeners.get(event) ?? new Set();
      listeners.set(event, set);
      set.add(cb as any);
      return {
        remove: () => {
          p.removes++;
          set.delete(cb as any);
        },
      };
    },
    emit(event: string, ...args: any[]) {
      listeners.get(event)?.forEach((cb) => cb(...args));
    },
    count(event: string) {
      return listeners.get(event)?.size ?? 0;
    },
  };
  return p;
}

function Harness({ player, event = 'onProgress', label, seen }: any) {
  useEvent(player, event, (d: any) =>
    seen.push(`${label}:${d?.currentTime ?? 'end'}`)
  );
  return null;
}

test(`inline callback across re-renders (${stable ? 'stable' : 'legacy'})`, () => {
  const player = fakePlayer();
  const seen: string[] = [];
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      React.createElement(Harness, { player, label: 'a', seen })
    );
  });
  act(() => {
    r.update(React.createElement(Harness, { player, label: 'b', seen }));
  });
  act(() => {
    r.update(React.createElement(Harness, { player, label: 'c', seen }));
  });
  // One subscription on every React version: a re-render must not add a listener.
  expect(player.adds).toBe(1);
  expect(player.count('onProgress')).toBe(1);
  player.emit('onProgress', { currentTime: 5 });
  expect(seen).toEqual(['c:5']);
});

test('player change resubscribes, unmount removes', () => {
  const p1 = fakePlayer(),
    p2 = fakePlayer();
  const seen: string[] = [];
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      React.createElement(Harness, { player: p1, label: 'a', seen })
    );
  });
  act(() => {
    r.update(React.createElement(Harness, { player: p2, label: 'a', seen }));
  });
  expect(p1.count('onProgress')).toBe(0);
  expect(p2.count('onProgress')).toBe(1);
  act(() => {
    r.unmount();
  });
  expect(p2.count('onProgress')).toBe(0);
  p2.emit('onProgress', { currentTime: 1 });
  expect(seen).toEqual([]);
});

test('event change resubscribes', () => {
  const player = fakePlayer();
  const seen: string[] = [];
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      React.createElement(Harness, {
        player,
        event: 'onProgress',
        label: 'a',
        seen,
      })
    );
  });
  act(() => {
    r.update(
      React.createElement(Harness, {
        player,
        event: 'onEnd',
        label: 'a',
        seen,
      })
    );
  });
  expect(player.count('onProgress')).toBe(0);
  expect(player.count('onEnd')).toBe(1);
});

test('StrictMode leaves exactly one live subscription', () => {
  const player = fakePlayer();
  const seen: string[] = [];
  act(() => {
    TestRenderer.create(
      React.createElement(
        StrictMode,
        null,
        React.createElement(Harness, { player, label: 'a', seen })
      )
    );
  });
  expect(player.count('onProgress')).toBe(1);
  player.emit('onProgress', { currentTime: 2 });
  expect(seen).toEqual(['a:2']);
});

test('two hooks on the same event both receive it; unmounting one keeps the other', () => {
  const player = fakePlayer();
  const seen: string[] = [];
  function Two({ showB }: { showB: boolean }) {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Harness, { player, label: 'a', seen }),
      showB ? React.createElement(Harness, { player, label: 'b', seen }) : null
    );
  }
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(React.createElement(Two, { showB: true }));
  });
  player.emit('onProgress', { currentTime: 1 });
  act(() => {
    r.update(React.createElement(Two, { showB: false }));
  });
  player.emit('onProgress', { currentTime: 2 });
  expect(seen).toEqual(['a:1', 'b:1', 'a:2']);
});

// --- A player that replays `onLoadStart` to a listener added while a source loads ---
// Native does this for the load in progress (see docs/docs/player/events.md). These tests
// pin what the hook does with it: one subscription, so one replay per mounted hook.

function replayingPlayer() {
  const base = fakePlayer();
  const add = base.addEventListener.bind(base);
  const p = Object.assign(base, {
    loading: true,
    addEventListener(event: string, cb: (...a: any[]) => void) {
      const subscription = add(event as any, cb as any);
      if (event === 'onLoadStart' && p.loading) {
        cb({ sourceType: 'network' });
      }
      return subscription;
    },
  });
  return p;
}

function LoadHarness({ player, label, seen, event = 'onLoadStart' }: any) {
  useEvent(player, event, (d: any) =>
    seen.push(`${label}:${event}:${d?.sourceType ?? d?.currentTime ?? ''}`)
  );
  return null;
}

test('a hook mounted while a source loads gets onLoadStart once, also across re-renders', () => {
  const player = replayingPlayer();
  const seen: string[] = [];
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      React.createElement(LoadHarness, { player, label: 'a', seen })
    );
  });
  expect(seen).toEqual(['a:onLoadStart:network']);
  // Re-renders with a new inline callback must not subscribe again, or the load would
  // be reported once per render.
  act(() => {
    r.update(React.createElement(LoadHarness, { player, label: 'b', seen }));
  });
  act(() => {
    r.update(React.createElement(LoadHarness, { player, label: 'c', seen }));
  });
  expect(seen).toEqual(['a:onLoadStart:network']);
  expect(player.adds).toBe(1);
});

test('a hook mounted after the load finished gets no stale onLoadStart', () => {
  const player = replayingPlayer();
  player.loading = false;
  const seen: string[] = [];
  act(() => {
    TestRenderer.create(
      React.createElement(LoadHarness, { player, label: 'a', seen })
    );
  });
  expect(seen).toEqual([]);
  // The next load still reaches it, through the latest callback.
  player.emit('onLoadStart', { sourceType: 'local' });
  expect(seen).toEqual(['a:onLoadStart:local']);
});

test('the replay goes to the callback of the render that subscribed', () => {
  const player = replayingPlayer();
  player.loading = false;
  const seen: string[] = [];
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      React.createElement(LoadHarness, {
        player,
        label: 'a',
        seen,
        event: 'onProgress',
      })
    );
  });
  // Switching the event while a source loads subscribes to onLoadStart in the same commit
  // that brings the new callback: the replay must reach that one, not the previous one.
  player.loading = true;
  act(() => {
    r.update(
      React.createElement(LoadHarness, {
        player,
        label: 'b',
        seen,
        event: 'onLoadStart',
      })
    );
  });
  expect(seen).toEqual(['b:onLoadStart:network']);
});

test('only onLoadStart is replayed; other events wait for native', () => {
  const player = replayingPlayer();
  const seen: string[] = [];
  act(() => {
    TestRenderer.create(
      React.createElement(LoadHarness, {
        player,
        label: 'a',
        seen,
        event: 'onProgress',
      })
    );
  });
  expect(seen).toEqual([]);
  player.emit('onProgress', { currentTime: 3 });
  expect(seen).toEqual(['a:onProgress:3']);
});

test('two hooks mounted during a load each get it once', () => {
  const player = replayingPlayer();
  const seen: string[] = [];
  act(() => {
    TestRenderer.create(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(LoadHarness, { player, label: 'a', seen }),
        React.createElement(LoadHarness, { player, label: 'b', seen })
      )
    );
  });
  expect(seen.sort()).toEqual([
    'a:onLoadStart:network',
    'b:onLoadStart:network',
  ]);
});

test('a hook unmounted during the load is not called afterwards', () => {
  const player = replayingPlayer();
  const seen: string[] = [];
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      React.createElement(LoadHarness, { player, label: 'a', seen })
    );
  });
  act(() => {
    r.unmount();
  });
  seen.length = 0;
  player.emit('onLoadStart', { sourceType: 'network' });
  player.emit('onLoad', {});
  expect(seen).toEqual([]);
  expect(player.count('onLoadStart')).toBe(0);
});

test('removing and adding the listener again during a load reports that load twice (documented)', () => {
  const player = replayingPlayer();
  const seen: string[] = [];
  function Toggle({ show }: { show: boolean }) {
    return show
      ? React.createElement(LoadHarness, { player, label: 'a', seen })
      : null;
  }
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(React.createElement(Toggle, { show: true }));
  });
  act(() => {
    r.update(React.createElement(Toggle, { show: false }));
  });
  act(() => {
    r.update(React.createElement(Toggle, { show: true }));
  });
  expect(seen).toEqual(['a:onLoadStart:network', 'a:onLoadStart:network']);
});

test('a player swapped in while its source loads replays to the same hook; the old player is dropped', () => {
  const first = replayingPlayer();
  first.loading = false;
  const second = replayingPlayer();
  const seen: string[] = [];
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      React.createElement(LoadHarness, { player: first, label: 'a', seen })
    );
  });
  act(() => {
    r.update(
      React.createElement(LoadHarness, { player: second, label: 'a', seen })
    );
  });
  expect(seen).toEqual(['a:onLoadStart:network']);
  first.emit('onLoadStart', { sourceType: 'local' });
  expect(seen).toEqual(['a:onLoadStart:network']);
  expect(first.count('onLoadStart')).toBe(0);
});

test('StrictMode reports the load in progress once per subscription it makes', () => {
  // React mounts, unmounts and mounts effects again under StrictMode in development.
  // Each mount is a new listener, and native replays to each one. Pinned here so a
  // change in either direction is noticed; production renders report it once.
  const player = replayingPlayer();
  const seen: string[] = [];
  act(() => {
    TestRenderer.create(
      React.createElement(
        StrictMode,
        null,
        React.createElement(LoadHarness, { player, label: 'a', seen })
      )
    );
  });
  expect(player.count('onLoadStart')).toBe(1);
  expect(seen.length).toBe(player.adds);
});
