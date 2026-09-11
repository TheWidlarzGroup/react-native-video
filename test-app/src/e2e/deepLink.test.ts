import { test, expect } from 'bun:test';
import { parseScenario } from './deepLink';

test('parses the scenario name', () => {
  expect(parseScenario('rnvtest://scenario/mp4')).toBe('mp4');
  expect(parseScenario('rnvtest://scenario/error-404')).toBe('error-404');
  expect(parseScenario('rnvtest://scenario/broken-manifest')).toBe('broken-manifest');
});

test('ignores a trailing slash, query string or fragment', () => {
  expect(parseScenario('rnvtest://scenario/hls/')).toBe('hls');
  expect(parseScenario('rnvtest://scenario/hls?x=1')).toBe('hls');
  expect(parseScenario('rnvtest://scenario/hls#top')).toBe('hls');
});

test('rejects anything that is not a scenario link', () => {
  expect(parseScenario(null)).toBeNull();
  expect(parseScenario(undefined)).toBeNull();
  expect(parseScenario('')).toBeNull();
  expect(parseScenario('rnvtest://scenario/')).toBeNull();
  expect(parseScenario('rnvtest://scenario')).toBeNull();
  expect(parseScenario('rnvtest://other/mp4')).toBeNull();
  expect(parseScenario('https://example.com/scenario/mp4')).toBeNull();
  expect(parseScenario('RNVTEST://scenario/mp4')).toBeNull();
});
