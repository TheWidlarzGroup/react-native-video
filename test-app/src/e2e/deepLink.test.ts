import { test, expect } from 'bun:test';
import { parseScenario, SCENARIO_NAMES } from './deepLink';

test('parses every known scenario from its link', () => {
  for (const name of SCENARIO_NAMES) {
    expect(parseScenario(`rnvtest://scenario/${name}`)).toBe(name);
  }
});

test('ignores a trailing slash, query string or fragment', () => {
  expect(parseScenario('rnvtest://scenario/hls/')).toBe('hls');
  expect(parseScenario('rnvtest://scenario/hls?x=1')).toBe('hls');
  expect(parseScenario('rnvtest://scenario/hls/?x=1')).toBe('hls');
  expect(parseScenario('rnvtest://scenario/hls#top')).toBe('hls');
});

test('rejects anything that is not a scenario link', () => {
  expect(parseScenario(null)).toBeNull();
  expect(parseScenario('')).toBeNull();
  expect(parseScenario('rnvtest://scenario/')).toBeNull();
  expect(parseScenario('rnvtest://scenario')).toBeNull();
  expect(parseScenario('rnvtest://scenario/mp4/extra')).toBeNull();
  expect(parseScenario('rnvtest://other/mp4')).toBeNull();
  expect(parseScenario('https://example.com/scenario/mp4')).toBeNull();
  expect(parseScenario('RNVTEST://scenario/mp4')).toBeNull();
});

test('rejects a scenario name the app does not know', () => {
  expect(parseScenario('rnvtest://scenario/mp5')).toBeNull();
  expect(parseScenario('rnvtest://scenario/MP4')).toBeNull();
  // Names that exist on every object must not slip through a lookup.
  expect(parseScenario('rnvtest://scenario/constructor')).toBeNull();
  expect(parseScenario('rnvtest://scenario/__proto__')).toBeNull();
});
