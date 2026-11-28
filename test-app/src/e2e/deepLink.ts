// Kept free of react-native imports so bun can unit-test it (deepLink.test.ts).
export const SCENARIO_NAMES = [
  'mp4',
  'mp4-preload', // same clip, started with preload() instead of initialize()+play()
  'mp4-release-mid-playback', // same clip; replaceSourceAsync(null) once progress > 2 s
  'mp4-progress-1s', // same clip; progressUpdateInterval = 1000 before the load
  'mp4-loader', // same clip; VideoView with renderLoader (covers the video until it is shown)
  'mp4-start-position', // same clip, with startPosition: 5000 on the source
  'mp4-crop', // same clip, cropStart: 2000 and cropEnd: 5000 (plays 3 s of it)
  'mp4-cache', // same clip with shouldCache; btn-cache-replay replays it with the server cut off
  'mp4-fullscreen-rotate', // same clip; enterFullscreen() on landscape, exitFullscreen() on portrait
  // Native controls (#5272, Android only), checked once the clip has ended:
  'mp4-controls', // every control shown (the ids the other two flows rely on)
  'mp4-controls-styles', // same clip; native controls with the seek bar, position and duration hidden
  'mp4-controls-no-play-pause', // same clip; native controls without the play/pause button
  'hls',
  'hls-type', // the same HLS VOD behind a uri without an extension, with type: 'm3u8'
  'error-404',
  'error-503-retry', // a source that answers 503, with minLoadRetryCount: 1 and a request counter
  'error-503-retry-offline', // the same with disableDisconnectError: a 503 is not a lost connection
  'broken-manifest',
  'error-mid-playback',
  'video-tracks',
  'audio-tracks',
  'audio-tracks-replace', // same stream; once loaded, replaceSourceAsync() onto it under another URL (#5291)
  'mp4-fullscreen-landscape', // same clip; fullscreen locked to landscape from JS after onLoad (#5286)
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

/** Where the fixture server listens unless the scenario link says otherwise. */
export const DEFAULT_FIXTURE_PORT = 8090;

/**
 * rnvtest://scenario/<name>?fixturePort=<port> -> <port>. The flows add it from Maestro's
 * `FIXTURE_PORT` (e2e/shared/open-scenario.yaml), so two runs on one machine can each use
 * their own fixture server. A link without it, or with something that is not a port,
 * yields the default.
 */
export function parseFixturePort(url: string | null): number {
  const raw = url?.match(
    /^rnvtest:\/\/scenario\/[^?#]*\?(?:[^#]*&)?fixturePort=(\d{1,5})(?:[&#]|$)/
  )?.[1];
  const port = raw === undefined ? NaN : Number(raw);
  return Number.isInteger(port) && port >= 1 && port <= 65535
    ? port
    : DEFAULT_FIXTURE_PORT;
}

/** Points a fixture uri at another fixture server; any other uri is returned as is. */
export function rebaseFixtureUri(
  uri: string,
  fromBase: string,
  toBase: string
): string {
  return uri.startsWith(`${fromBase}/`)
    ? `${toBase}${uri.slice(fromBase.length)}`
    : uri;
}

/**
 * Points every source in the list at another fixture server, in place. A source listed
 * twice is moved once, and a `uri` that is not a string (a bundled asset) is left alone.
 */
export function rebaseFixtureSources(
  sources: { uri: unknown }[],
  fromBase: string,
  toBase: string
): void {
  for (const source of new Set(sources)) {
    if (typeof source.uri === 'string') {
      source.uri = rebaseFixtureUri(source.uri, fromBase, toBase);
    }
  }
}
