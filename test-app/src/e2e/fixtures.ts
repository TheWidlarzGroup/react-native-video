import { Platform } from 'react-native';
import type { VideoConfig } from 'react-native-video';

/**
 * Fixture server runs on the CI host (or dev machine): `npx serve e2e/fixtures/media -l 8090`
 * - Android emulator reaches the host at 10.0.2.2
 * - iOS simulator reaches the host at localhost
 * Android requires cleartext HTTP for this host (debug manifest / network security config).
 */
export const FIXTURE_BASE = Platform.select({
  android: 'http://10.0.2.2:8090',
  default: 'http://localhost:8090',
});

export type ScenarioName = 'mp4' | 'hls' | 'error-404' | 'broken-manifest';

/**
 * initializeOnCreation: false + an explicit player.initialize() call in ScenarioScreen —
 * with the default (true), useVideoPlayer defers its setup callback (where we attach
 * listeners and call play()) until the native side's own auto-triggered load reaches
 * onLoadStart/onStatusChange. A source that fails immediately (error-404, broken-manifest)
 * never reaches that point, so setup() — and every listener — would simply never run.
 */
export const SCENARIO_SOURCES: Record<ScenarioName, VideoConfig> = {
  'mp4': { uri: `${FIXTURE_BASE}/short.mp4`, initializeOnCreation: false }, // 8 s, testsrc + sine audio
  'hls': { uri: `${FIXTURE_BASE}/hls/index.m3u8`, initializeOnCreation: false }, // ~8 s VOD, 2 s segments
  'error-404': {
    uri: `${FIXTURE_BASE}/does-not-exist.mp4`,
    initializeOnCreation: false,
  },
  'broken-manifest': {
    uri: `${FIXTURE_BASE}/broken/index.m3u8`,
    initializeOnCreation: false,
  },
};
