// Kept free of react-native imports so bun can unit-test it (deepLink.test.ts).
export const SCENARIO_NAMES = [
  'mp4',
  'mp4-preload', // same clip, started with preload() instead of initialize()+play()
  'mp4-release-mid-playback', // same clip; replaceSourceAsync(null) once progress > 2 s
  'mp4-fullscreen-rotate', // same clip; enterFullscreen() on landscape, exitFullscreen() on portrait
  // Native controls (#5272, Android only), checked once the clip has ended:
  'mp4-controls', // every control shown (the ids the other two flows rely on)
  'mp4-controls-styles', // same clip; native controls with the seek bar, position and duration hidden
  'mp4-controls-no-play-pause', // same clip; native controls without the play/pause button
  'hls',
  'error-404',
  'broken-manifest',
  'error-mid-playback',
  'video-tracks',
] as const;

export type ScenarioName = (typeof SCENARIO_NAMES)[number];

const isScenarioName = (value: string): value is ScenarioName =>
  SCENARIO_NAMES.some((name) => name === value);

/**
 * rnvtest://scenario/<name>[/] -> <name>, ignoring a query string or fragment. Anything
 * else (another scheme, host or path, or an unknown scenario) yields null, so the app
 * stays on its default screen. A regex rather than `new URL()`: React Native's URL does
 * not implement `host` or `pathname`.
 */
export function parseScenario(url: string | null): ScenarioName | null {
  const name = url?.match(/^rnvtest:\/\/scenario\/([^/?#]+)\/?(?:[?#]|$)/)?.[1];
  return name !== undefined && isScenarioName(name) ? name : null;
}
