import { Platform } from 'react-native';
import type { VideoConfig } from 'react-native-video';
import type { ScenarioName } from './deepLink';

/**
 * Fixture server on the CI host (or dev machine):
 * `node e2e/fixtures/serve.mjs e2e/fixtures/media 8090`. The Android emulator reaches the
 * host at 10.0.2.2, the iOS simulator at localhost. The config plugin
 * (rnv-e2e-plugin.mjs) allows cleartext HTTP on Android.
 */
export const FIXTURE_BASE = Platform.select({
  android: 'http://10.0.2.2:8090',
  default: 'http://localhost:8090',
});

// Every scenario starts its own load after attaching listeners (see ScenarioScreen).
const fixture = (path: string): VideoConfig => ({
  uri: `${FIXTURE_BASE}/${path}`,
  initializeOnCreation: false,
});

export const SCENARIO_SOURCES: Record<ScenarioName, VideoConfig> = {
  'mp4': fixture('short.mp4'), // 8 s, testsrc + sine audio
  'hls': fixture('hls/index.m3u8'), // ~8 s VOD, 2 s segments
  'error-404': fixture('does-not-exist.mp4'),
  'broken-manifest': fixture('broken/index.m3u8'),
};
