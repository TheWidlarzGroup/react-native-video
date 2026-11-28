import { Platform } from 'react-native';
import type { VideoConfig } from 'react-native-video';
import {
  DEFAULT_FIXTURE_PORT,
  rebaseFixtureSources,
  type ScenarioName,
} from './deepLink';
import { LOADER_SOURCE_HOLD_MS } from './eventLog';

/**
 * Fixture server on the CI host (or dev machine):
 * `node e2e/fixtures/serve.mjs e2e/fixtures/media 8090`. The Android emulator reaches the
 * host at 10.0.2.2, the iOS simulator at localhost. The config plugin
 * (rnv-e2e-plugin.mjs) allows cleartext HTTP on Android.
 */
const fixtureBase = (port: number): string =>
  Platform.select({
    android: `http://10.0.2.2:${port}`,
    default: `http://localhost:${port}`,
  });

// Where the fixture server is for this run. A live binding: `setFixturePort` moves it, so
// read it when the URL is built (inside a function), not into a module-level constant.
export let FIXTURE_BASE = fixtureBase(DEFAULT_FIXTURE_PORT);

// Every source `fixture()` has handed out, so `setFixturePort` can move them too.
const fixtureSources: VideoConfig[] = [];

// mp4-cache: a token per app launch, so the fixture server can cut off exactly this source
// (`/__go-offline?token=`), and a fresh launch (cleared app data, empty cache) starts online.
export const CACHE_TOKEN = Math.random().toString(36).slice(2);

// error-503-retry(-offline): a token per app launch, so the fixture server can count this source's
// requests (`/__requests?token=`).
export const RETRY_TOKEN = Math.random().toString(36).slice(2);

// Every scenario starts its own load after attaching listeners (see ScenarioScreen).
const fixture = (path: string): VideoConfig => {
  const source: VideoConfig = {
    uri: `${FIXTURE_BASE}/${path}`,
    initializeOnCreation: false,
  };
  fixtureSources.push(source);
  return source;
};

// A fixture whose requests the server keeps waiting until `holdMs` after the first one
// (e2e/fixtures/serve.mjs, `?hold=&holdId=`). The id is new on every app launch: the
// server outlives the app, and it holds an id only once.
const heldFixture = (path: string, holdMs: number): VideoConfig =>
  fixture(
    `${path}?hold=${holdMs}&holdId=${Date.now()}-${Math.round(Math.random() * 1e9)}`
  );

// Built for the default port; `setFixturePort` moves every entry when a run uses another
// one, so `SCENARIO_SOURCES[name]` and `scenarioSource(name)` give the same source.
export const SCENARIO_SOURCES: Record<ScenarioName, VideoConfig> = {
  'mp4': fixture('short.mp4'), // 8 s, testsrc + sine audio
  'mp4-preload': fixture('short.mp4'),
  'mp4-release-mid-playback': fixture('short.mp4'),
  'mp4-progress-1s': fixture('short.mp4'),
  'mp4-external-screen': fixture('short.mp4'),
  'mp4-loader': heldFixture('short.mp4', LOADER_SOURCE_HOLD_MS),
  'mp4-start-position': { ...fixture('short.mp4'), startPosition: 5000 },
  'mp4-crop': { ...fixture('short.mp4'), cropStart: 2000, cropEnd: 5000 },
  'mp4-cache': {
    ...fixture(`short.mp4?token=${CACHE_TOKEN}`),
    shouldCache: true,
  },
  'mp4-fullscreen-rotate': fixture('short.mp4'),
  'mp4-controls': fixture('short.mp4'),
  'mp4-controls-styles': fixture('short.mp4'),
  'mp4-controls-no-play-pause': fixture('short.mp4'),
  'hls': fixture('hls/index.m3u8'), // ~8 s VOD, 2 s segments
  'hls-type': { ...fixture('hls-noext/stream'), type: 'm3u8' },
  'error-404': fixture('does-not-exist.mp4'),
  'error-503-retry': {
    ...fixture(`__unavailable/short.mp4?token=${RETRY_TOKEN}`), // 503, which is retried
    minLoadRetryCount: 1,
  },
  // disableDisconnectError retries without end only while there is no connection (Android;
  // other platforms ignore it). A server that answers is not a lost connection.
  'error-503-retry-offline': {
    ...fixture(`__unavailable/short.mp4?token=${RETRY_TOKEN}`),
    minLoadRetryCount: 1,
    disableDisconnectError: true,
  },
  'broken-manifest': fixture('broken/index.m3u8'),
  'error-mid-playback': fixture('missing-segment/index.m3u8'), // 2 segments, then a 404
  'video-tracks': fixture('hls-quality/index.m3u8'), // HLS, 3 video renditions (360p/180p/90p)
  'audio-tracks': fixture('hls-audio/index.m3u8'), // HLS, English (default) + Spanish audio
  'audio-tracks-replace': fixture('hls-audio/index.m3u8'),
  'mp4-fullscreen-landscape': fixture('short.mp4'),
};

// The next episode of a series: the same audio tracks (and so the same positional ids)
// under another URL. audio-tracks-replace switches to it with replaceSourceAsync() (#5291).
export const AUDIO_REPLACEMENT_SOURCE: VideoConfig = fixture(
  'hls-audio/index.m3u8?episode=2'
);

/**
 * The port from the scenario link (`?fixturePort=`). App.tsx calls this before the scenario
 * screen mounts. It points `FIXTURE_BASE`, every source made by `fixture()` and every entry
 * of `SCENARIO_SOURCES` (an entry may be a copy with extra options) at that server, in
 * place, so code that reads them directly follows the port as well.
 */
export function setFixturePort(port: number) {
  const base = fixtureBase(port);
  if (base === FIXTURE_BASE) return;

  rebaseFixtureSources(
    [...fixtureSources, ...Object.values(SCENARIO_SOURCES)],
    FIXTURE_BASE,
    base
  );
  FIXTURE_BASE = base;
}

/** The source of a scenario, on the fixture server this run uses. */
export function scenarioSource(name: ScenarioName): VideoConfig {
  return SCENARIO_SOURCES[name];
}
