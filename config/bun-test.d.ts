// Minimal typings for the parts of `bun:test` the unit tests use, so that the tests are
// part of `tsc` and ESLint without adding bun-types (whose 1.3.x line peers on
// @types/react ^19 while the workspace pins ^18). Extend it when a test needs more.
declare module 'bun:test' {
  type Hook = () => void | Promise<void>;

  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: Hook): void;
  export const it: typeof test;
  export function beforeEach(fn: Hook): void;
  export function afterEach(fn: Hook): void;

  export const mock: {
    module(specifier: string, factory: () => unknown): void;
  };

  export interface Matchers {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeInstanceOf(expected: abstract new (...args: never[]) => unknown): void;
    toHaveLength(expected: number): void;
    toMatch(expected: string | RegExp): void;
    toContain(expected: unknown): void;
    toBeNull(): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeGreaterThan(expected: number): void;
    toBeLessThan(expected: number): void;
    toThrow(
      expected?:
        | string
        | RegExp
        | Error
        | (abstract new (...args: never[]) => Error),
    ): void;
    not: Matchers;
    resolves: AsyncMatchers;
  }

  // `expect(promise).resolves.<matcher>()` awaits the promise, so every matcher is async.
  type AsyncMatchers = {
    [K in Exclude<keyof Matchers, 'not' | 'resolves'>]: Matchers[K] extends (
      ...args: infer A
    ) => void
      ? (...args: A) => Promise<void>
      : never;
  };

  export function expect(actual: unknown): Matchers;
}
