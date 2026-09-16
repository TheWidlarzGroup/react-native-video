import { test, expect, beforeEach } from 'bun:test';
import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useManagedInstance } from '../src/core/hooks/useManagedInstance';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Obj = { id: number };
let log: string[] = [];
let nextId = 0;

beforeEach(() => {
  log = [];
  nextId = 0;
});

// Renders nothing; reports the managed object it received on every render.
function Harness({
  dep,
  onObject,
  equal,
}: {
  dep: unknown;
  onObject: (o: Obj) => void;
  equal?: (a: unknown, b?: unknown) => boolean;
}) {
  const object = useManagedInstance<Obj, unknown>(
    {
      factory: () => {
        const o = { id: ++nextId };
        log.push(`create ${o.id}`);
        return o;
      },
      cleanup: (o) => log.push(`cleanup ${o.id}`),
      dependenciesEqualFn: equal,
    },
    [dep]
  );
  useEffect(() => {
    onObject(object);
  });
  return null;
}

type MountProps = Omit<Parameters<typeof Harness>[0], 'onObject'>;

function mount(props: MountProps) {
  const seen: Obj[] = [];
  const el = (p: MountProps) =>
    React.createElement(Harness, { ...p, onObject: (o: Obj) => seen.push(o) });
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(el(props));
  });
  return {
    seen,
    current: () => seen.at(-1)!,
    update: (p: MountProps) => act(() => renderer.update(el(p))),
    unmount: () => act(() => renderer.unmount()),
  };
}

test('creates the instance once and keeps it across re-renders with equal deps', () => {
  const h = mount({ dep: 'a' });
  expect(log).toEqual(['create 1']);
  h.update({ dep: 'a' });
  h.update({ dep: 'a' });
  expect(log).toEqual(['create 1']);
  expect(h.current().id).toBe(1);
});

test('recreates the instance when a dependency changes, cleaning up the old one first', () => {
  const h = mount({ dep: 'a' });
  h.update({ dep: 'b' });
  expect(log).toEqual(['create 1', 'cleanup 1', 'create 2']);
  expect(h.current().id).toBe(2);
});

test('uses dependenciesEqualFn instead of reference equality', () => {
  const equal = (a: unknown, b?: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  const h = mount({ dep: { uri: 'x' }, equal });
  h.update({ dep: { uri: 'x' }, equal }); // new object, same content
  expect(log).toEqual(['create 1']);
  h.update({ dep: { uri: 'y' }, equal });
  expect(log).toEqual(['create 1', 'cleanup 1', 'create 2']);
});

test('cleans up on unmount', () => {
  const h = mount({ dep: 'a' });
  h.unmount();
  expect(log).toEqual(['create 1', 'cleanup 1']);
});

// Not covered: React StrictMode's development-only double effects (mount, unmount,
// remount), which drive the hook's `released` re-creation path. react-test-renderer
// 18.3 never double-invokes effects, with or without `unstable_isConcurrent` /
// `unstable_strictMode`, so that path can only be exercised in a real development
// build of an app with StrictMode enabled.
