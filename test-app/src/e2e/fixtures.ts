import { Platform } from 'react-native';
import type { VideoConfig } from 'react-native-video';
import {
  DEFAULT_FIXTURE_PORT,
  rebaseFixtureUri,
  type ScenarioName,
} from './deepLink';

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

export const FIXTURE_BASE = fixtureBase(DEFAULT_FIXTURE_PORT);

// The port from the scenario link (`?fixturePort=`), set by App.tsx before the scenario
// screen mounts.
let fixturePort = DEFAULT_FIXTURE_PORT;

export function setFixturePort(port: number) {
  fixturePort = port;
}

// Every scenario starts its own load after attaching listeners (see ScenarioScreen).
const fixture = (path: string): VideoConfig => ({
  uri: `${FIXTURE_BASE}/${path}`,
  initializeOnCreation: false,
});

// Written against the default port. Read a scenario through `scenarioSource`, which
// follows the port of the run; a direct read only works with the server on 8090.
export const SCENARIO_SOURCES: Record<ScenarioName, VideoConfig> = {
  'mp4': fixture('short.mp4'), // 8 s, testsrc + sine audio
  'mp4-preload': fixture('short.mp4'),
  'mp4-release-mid-playback': fixture('short.mp4'),
  'mp4-fullscreen-rotate': fixture('short.mp4'),
  'hls': fixture('hls/index.m3u8'), // ~8 s VOD, 2 s segments
  'error-404': fixture('does-not-exist.mp4'),
  'broken-manifest': fixture('broken/index.m3u8'),
  'error-mid-playback': fixture('missing-segment/index.m3u8'), // 2 segments, then a 404
  'video-tracks': fixture('hls-quality/index.m3u8'), // HLS, 3 video renditions (360p/180p/90p)
  'audio-tracks': fixture('hls-audio/index.m3u8'), // HLS, English (default) + Spanish audio
};

/** The source of a scenario, on the fixture server this run uses. */
export function scenarioSource(name: ScenarioName): VideoConfig {
  const source = SCENARIO_SOURCES[name];
  if (fixturePort === DEFAULT_FIXTURE_PORT || typeof source.uri !== 'string') {
    return source;
  }
  return {
    ...source,
    uri: rebaseFixtureUri(source.uri, FIXTURE_BASE, fixtureBase(fixturePort)),
  };
}
