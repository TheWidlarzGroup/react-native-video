import { Platform } from 'react-native';
import type { VideoConfig } from 'react-native-video';
import type { ScenarioName } from './deepLink';
import { LOADER_SOURCE_HOLD_MS } from './eventLog';

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

// A fixture whose requests the server keeps waiting until `holdMs` after the first one
// (e2e/fixtures/serve.mjs, `?hold=&holdId=`). The id is new on every app launch: the
// server outlives the app, and it holds an id only once.
const heldFixture = (path: string, holdMs: number): VideoConfig =>
  fixture(
    `${path}?hold=${holdMs}&holdId=${Date.now()}-${Math.round(Math.random() * 1e9)}`
  );

export const SCENARIO_SOURCES: Record<ScenarioName, VideoConfig> = {
  'mp4': fixture('short.mp4'), // 8 s, testsrc + sine audio
  'mp4-preload': fixture('short.mp4'),
  'mp4-release-mid-playback': fixture('short.mp4'),
  'mp4-loader': heldFixture('short.mp4', LOADER_SOURCE_HOLD_MS),
  'mp4-fullscreen-rotate': fixture('short.mp4'),
  'mp4-controls': fixture('short.mp4'),
  'mp4-controls-styles': fixture('short.mp4'),
  'mp4-controls-no-play-pause': fixture('short.mp4'),
  'hls': fixture('hls/index.m3u8'), // ~8 s VOD, 2 s segments
  'error-404': fixture('does-not-exist.mp4'),
  'broken-manifest': fixture('broken/index.m3u8'),
  'error-mid-playback': fixture('missing-segment/index.m3u8'), // 2 segments, then a 404
  'video-tracks': fixture('hls-quality/index.m3u8'), // HLS, 3 video renditions (360p/180p/90p)
  'audio-tracks': fixture('hls-audio/index.m3u8'), // HLS, English (default) + Spanish audio
  'audio-tracks-replace': fixture('hls-audio/index.m3u8'),
};

// The next episode of a series: the same audio tracks (and so the same positional ids)
// under another URL. audio-tracks-replace switches to it with replaceSourceAsync() (#5291).
export const AUDIO_REPLACEMENT_SOURCE: VideoConfig = fixture(
  'hls-audio/index.m3u8?episode=2'
);
