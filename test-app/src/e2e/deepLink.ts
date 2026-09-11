import type { ScenarioName } from './fixtures';

export const SCENARIO_SCHEME = 'rnvtest';

/**
 * rnvtest://scenario/<name> -> <name>. Query strings and fragments are ignored; any
 * other host, path or scheme yields null so the app stays on its default screen.
 */
export function parseScenario(
  url: string | null | undefined
): ScenarioName | null {
  if (!url) return null;
  const match = url.match(/^rnvtest:\/\/scenario\/([^/?#]+)(?:[/?#]|$)/);
  return (match?.[1] as ScenarioName) ?? null;
}
