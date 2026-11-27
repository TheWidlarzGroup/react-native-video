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
  expect(player.adds).toBe(stable ? 1 : 3);
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
      React.createElement(Harness, { player, event: 'onEnd', label: 'a', seen })
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
