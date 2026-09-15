// Kept free of react-native imports so bun can unit-test it (deepLink.test.ts).
export const SCENARIO_NAMES = [
  'mp4',
  'hls',
  'error-404',
  'broken-manifest',
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
