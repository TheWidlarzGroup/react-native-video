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

// error-503-retry: a token per app launch, so the fixture server can count this source's
// requests (`/__requests?token=`).
export const RETRY_TOKEN = Math.random().toString(36).slice(2);

// Every scenario starts its own load after attaching listeners (see ScenarioScreen).
const fixture = (path: string): VideoConfig => ({
  uri: `${FIXTURE_BASE}/${path}`,
  initializeOnCreation: false,
});

export const SCENARIO_SOURCES: Record<ScenarioName, VideoConfig> = {
  'mp4': fixture('short.mp4'), // 8 s, testsrc + sine audio
  'mp4-preload': fixture('short.mp4'),
  'mp4-release-mid-playback': fixture('short.mp4'),
  'mp4-fullscreen-rotate': fixture('short.mp4'),
  'hls': fixture('hls/index.m3u8'), // ~8 s VOD, 2 s segments
  'hls-type': { ...fixture('hls-noext/stream'), type: 'm3u8' },
  'error-404': fixture('does-not-exist.mp4'),
  'error-503-retry': {
    ...fixture(`__unavailable/short.mp4?token=${RETRY_TOKEN}`), // 503, which is retried
    minLoadRetryCount: 1,
  },
  'broken-manifest': fixture('broken/index.m3u8'),
  'error-mid-playback': fixture('missing-segment/index.m3u8'), // 2 segments, then a 404
  'video-tracks': fixture('hls-quality/index.m3u8'), // HLS, 3 video renditions (360p/180p/90p)
};
