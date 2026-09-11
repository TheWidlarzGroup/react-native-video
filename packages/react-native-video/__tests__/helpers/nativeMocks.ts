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

export const player = {
  playThrows: null as unknown,
  initializeRejects: null as unknown,
  released: 0,
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
}

// Accepts any addOn*Listener call and returns a removable subscription.
export function fakeEmitter() {
  return new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === 'clearAllListeners') return () => {};
        if (/^addOn[A-Za-z]+Listener$/.test(prop))
          return () => ({ remove: () => {} });
        return undefined;
      },
    }
  );
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
          fromUri: (uri: string) => {
            if (sourceFactory.throws) throw sourceFactory.throws;
            sourceFactory.calls.fromUri.push(uri);
            return { name: 'VideoPlayerSource', uri };
          },
          fromVideoConfig: (config: Record<string, unknown>) => {
            if (sourceFactory.throws) throw sourceFactory.throws;
            sourceFactory.calls.fromVideoConfig.push(config);
            return { name: 'VideoPlayerSource', uri: config.uri };
          },
        };
      }
      if (name === 'VideoPlayerFactory') {
        return {
          createPlayer: (source: unknown) => ({
            source,
            eventEmitter: fakeEmitter(),
            play: () => {
              if (player.playThrows) throw player.playThrows;
            },
            initialize: () =>
              player.initializeRejects
                ? Promise.reject(player.initializeRejects)
                : Promise.resolve(),
            release: () => void player.released++,
          }),
        };
      }
      throw new Error(`unexpected hybrid object ${name}`);
    },
  },
}));
