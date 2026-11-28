import { test, expect } from 'bun:test';
import {
  DEFAULT_FIXTURE_PORT,
  parseFixturePort,
  parseScenario,
  rebaseFixtureSources,
  rebaseFixtureUri,
  SCENARIO_NAMES,
} from './deepLink';

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

test('reads the fixture port from the scenario link', () => {
  expect(parseFixturePort('rnvtest://scenario/mp4?fixturePort=8690')).toBe(
    8690
  );
  expect(parseFixturePort('rnvtest://scenario/mp4/?fixturePort=8690')).toBe(
    8690
  );
  expect(
    parseFixturePort('rnvtest://scenario/hls?x=1&fixturePort=9001&y=2')
  ).toBe(9001);
  expect(parseFixturePort('rnvtest://scenario/hls?fixturePort=8690#top')).toBe(
    8690
  );
  // The scenario is still found next to it.
  expect(parseScenario('rnvtest://scenario/hls?fixturePort=8690')).toBe('hls');
});

test('falls back to the default fixture port', () => {
  expect(DEFAULT_FIXTURE_PORT).toBe(8090);
  for (const url of [
    null,
    '',
    'rnvtest://scenario/mp4',
    'rnvtest://scenario/mp4?fixturePort=',
    'rnvtest://scenario/mp4?fixturePort=abc',
    'rnvtest://scenario/mp4?fixturePort=0',
    'rnvtest://scenario/mp4?fixturePort=70000',
    'rnvtest://scenario/mp4?fixturePort=123456',
    'rnvtest://scenario/mp4?fixturePort=80x',
    'rnvtest://scenario/mp4?notfixturePort=8690',
    'rnvtest://scenario/mp4#fixturePort=8690',
    'https://example.com/?fixturePort=8690',
  ]) {
    expect(parseFixturePort(url)).toBe(DEFAULT_FIXTURE_PORT);
  }
});

test('rebases only uris of the fixture server', () => {
  const from = 'http://localhost:8090';
  const to = 'http://localhost:8690';
  expect(rebaseFixtureUri(`${from}/short.mp4`, from, to)).toBe(
    `${to}/short.mp4`
  );
  expect(rebaseFixtureUri(`${from}/hls/index.m3u8?hold=1`, from, to)).toBe(
    `${to}/hls/index.m3u8?hold=1`
  );
  // Another host, or a port that merely starts with the same digits, is left alone.
  expect(rebaseFixtureUri('https://example.com/a.mp4', from, to)).toBe(
    'https://example.com/a.mp4'
  );
  expect(rebaseFixtureUri('http://localhost:80901/a.mp4', from, to)).toBe(
    'http://localhost:80901/a.mp4'
  );
});

test('moves the external subtitles of a source along with it', () => {
  const from = 'http://localhost:8090';
  const to = 'http://localhost:8690';
  const en = { uri: `${from}/subs-en.vtt`, label: 'English', language: 'en' };
  const es = { uri: `${from}/subs-es.vtt`, label: 'Spanish', language: 'es' };
  // A scenario entry is a copy of the plain source with the subtitles added, so the
  // plain source and the copy are both in the list.
  const plain = { uri: `${from}/short.mp4` };
  const withSubs = { ...plain, externalSubtitles: [en, es] };
  const elsewhere = { uri: 'https://example.com/subs.vtt' };
  const other = {
    uri: `${from}/hls/index.m3u8`,
    externalSubtitles: [es, elsewhere],
  };

  rebaseFixtureSources([plain, withSubs, other], from, to);

  expect(withSubs.uri).toBe(`${to}/short.mp4`);
  expect(en.uri).toBe(`${to}/subs-en.vtt`);
  // Listed under two sources.
  expect(es.uri).toBe(`${to}/subs-es.vtt`);
  expect(elsewhere.uri).toBe('https://example.com/subs.vtt');
  expect(other.uri).toBe(`${to}/hls/index.m3u8`);
});

test('moves a list of sources to another fixture server in place', () => {
  const from = 'http://localhost:8090';
  const to = 'http://localhost:8690';
  const plain = { uri: `${from}/short.mp4`, initializeOnCreation: false };
  // What a scenario table holds next to it: a copy with extra options, a source of
  // another host and a bundled asset.
  const copy = { ...plain, shouldCache: true };
  const external = { uri: 'https://example.com/a.mp4' };
  const asset = { uri: 7 };

  rebaseFixtureSources([plain, copy, external, asset, plain], from, to);

  expect(plain.uri).toBe(`${to}/short.mp4`);
  expect(copy.uri).toBe(`${to}/short.mp4`);
  expect(copy.shouldCache).toBe(true);
  expect(external.uri).toBe('https://example.com/a.mp4');
  expect(asset.uri).toBe(7);

  // And back, as a second run on the default port would.
  rebaseFixtureSources([plain, copy], to, from);
  expect(plain.uri).toBe(`${from}/short.mp4`);
  expect(copy.uri).toBe(`${from}/short.mp4`);
});
