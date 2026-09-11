// Shared fakes for `react-native` and `react-native-nitro-modules`.
//
// bun's mock.module is process-wide and module instances are cached, so two test files
// registering their own fakes for the same module would fight over which one the
// library actually sees. Every test that needs native mocked imports this module
// (which registers the mocks once) and drives behaviour through the exported state.
// Import it BEFORE importing anything from ../src that touches native, and load the
// library module under test with a dynamic import so the mocks are in place first.
import { mock } from 'bun:test';

export const platform = { OS: 'ios' as string };

export const assets = {
  resolved: { uri: 'file:///asset.mp4' } as { uri?: unknown } | null,
};

export const sourceFactory = {
  calls: {
    fromUri: [] as string[],
    fromVideoConfig: [] as Record<string, unknown>[],
  },
  throws: null as unknown,
};

export type FakePlayer = {
  source: unknown;
  eventEmitter: FakeEmitter;
  released: number;
  play: () => void;
  initialize: () => Promise<void>;
  release: () => void;
};

export const player = {
  playThrows: null as unknown,
  initializeRejects: null as unknown,
  released: 0,
  // Every native player the fake factory handed out, oldest first.
  created: [] as FakePlayer[],
};

export function resetNativeMocks() {
  platform.OS = 'ios';
  assets.resolved = { uri: 'file:///asset.mp4' };
  sourceFactory.calls.fromUri = [];
  sourceFactory.calls.fromVideoConfig = [];
  sourceFactory.throws = null;
  player.playThrows = null;
  player.initializeRejects = null;
  player.released = 0;
  player.created = [];
}

export type FakeEmitter = {
  // Delivers a native event to everything subscribed through addOn<Event>Listener.
  emit: (event: string, ...args: unknown[]) => void;
  listenerCount: (event: string) => number;
  clearAllListeners: () => void;
};

// Accepts any addOn*Listener call, keeps the listeners so tests can emit to them,
// and returns a removable subscription.
export function fakeEmitter(): FakeEmitter {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const key = (event: string) =>
    `add${event[0]!.toUpperCase()}${event.slice(1)}Listener`;
  const api: FakeEmitter = {
    emit: (event, ...args) =>
      listeners.get(key(event))?.forEach((fn) => fn(...args)),
    listenerCount: (event) => listeners.get(key(event))?.size ?? 0,
    clearAllListeners: () => listeners.clear(),
  };
  return new Proxy(api, {
    get(target, prop: string) {
      if (prop in target) return target[prop as keyof FakeEmitter];
      if (/^addOn[A-Za-z]+Listener$/.test(prop)) {
        return (fn: (...args: unknown[]) => void) => {
          const set = listeners.get(prop) ?? new Set();
          listeners.set(prop, set);
          set.add(fn);
          return { remove: () => set.delete(fn) };
        };
      }
      return undefined;
    },
  });
}

mock.module('react-native', () => ({
  Platform: {
    get OS() {
      return platform.OS;
    },
    select: (spec: Record<string, unknown>) =>
      platform.OS in spec ? spec[platform.OS] : spec.default,
  },
  Image: { resolveAssetSource: () => assets.resolved },
}));

mock.module('react-native-nitro-modules', () => ({
  NitroModules: {
    updateMemorySize: () => {},
    createHybridObject: (name: string) => {
      if (name === 'VideoPlayerSourceFactory') {
        return {
          // Like the native factory, the returned source exposes the resolved config
          // (useVideoPlayer reads `source.config.initializeOnCreation`).
          fromUri: (uri: string) => {
            if (sourceFactory.throws) throw sourceFactory.throws;
            sourceFactory.calls.fromUri.push(uri);
            return {
              name: 'VideoPlayerSource',
              uri,
              config: { uri, initializeOnCreation: true },
            };
          },
          fromVideoConfig: (config: Record<string, unknown>) => {
            if (sourceFactory.throws) throw sourceFactory.throws;
            sourceFactory.calls.fromVideoConfig.push(config);
            return { name: 'VideoPlayerSource', uri: config.uri, config };
          },
        };
      }
      if (name === 'VideoPlayerFactory') {
        return {
          createPlayer: (source: unknown) => {
            const fake: FakePlayer = {
              source,
              eventEmitter: fakeEmitter(),
              released: 0,
              play: () => {
                if (player.playThrows) throw player.playThrows;
              },
              initialize: () =>
                player.initializeRejects
                  ? Promise.reject(player.initializeRejects)
                  : Promise.resolve(),
              release: () => {
                fake.released++;
                player.released++;
              },
            };
            player.created.push(fake);
            return fake;
          },
        };
      }
      throw new Error(`unexpected hybrid object ${name}`);
    },
  },
}));
