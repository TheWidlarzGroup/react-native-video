import { describe, test, expect } from 'bun:test';
import { scenarioLink, simulatorDevice, openLink } from './open-link.mjs';

const request = (link) => `/__open-link?url=${encodeURIComponent(link)}`;

describe('scenarioLink', () => {
  test('accepts a scenario deep link', () => {
    expect(scenarioLink(request('rnvtest://scenario/mp4'))).toBe('rnvtest://scenario/mp4');
    expect(scenarioLink(request('rnvtest://scenario/broken-manifest'))).toBe('rnvtest://scenario/broken-manifest');
    expect(scenarioLink(request('rnvtest://scenario/error-404'))).toBe('rnvtest://scenario/error-404');
  });

  test('rejects anything that is not exactly a scenario deep link', () => {
    for (const link of [
      'https://example.com',
      'rnvtest://other/mp4',
      'rnvtest://scenario/',
      'rnvtest://scenario/mp4/extra',
      'rnvtest://scenario/mp4?x=1',
      'rnvtest://scenario/MP4',
      'rnvtest://scenario/mp4 --help',
      'rnvtest://scenario/mp4;rm',
      ' rnvtest://scenario/mp4',
    ]) {
      expect(scenarioLink(request(link))).toBeNull();
    }
  });

  test('rejects a missing or repeated url parameter', () => {
    expect(scenarioLink('/__open-link')).toBeNull();
    expect(scenarioLink('/__open-link?url=')).toBeNull();
    expect(
      scenarioLink('/__open-link?url=rnvtest%3A%2F%2Fscenario%2Fmp4&url=rnvtest%3A%2F%2Fscenario%2Fhls')
    ).toBeNull();
  });
});

describe('simulatorDevice', () => {
  const udid = '7D16E67F-1E34-43CB-BD36-B95CCE24981A';

  test('is undefined when the request names no device', () => {
    expect(simulatorDevice('/__open-link?url=x')).toBeUndefined();
    expect(simulatorDevice('/__open-link?url=x&device=')).toBeUndefined();
  });

  test('accepts a simulator UDID', () => {
    expect(simulatorDevice(`/__open-link?url=x&device=${udid}`)).toBe(udid);
    expect(simulatorDevice(`/__open-link?url=x&device=${udid.toLowerCase()}`)).toBe(udid.toLowerCase());
  });

  test('is null for anything else, including simctl keywords and repeats', () => {
    for (const device of ['booted', 'all', '--help', `${udid} x`, 'iPhone%2017']) {
      expect(simulatorDevice(`/__open-link?url=x&device=${device}`)).toBeNull();
    }
    expect(simulatorDevice(`/__open-link?url=x&device=${udid}&device=${udid}`)).toBeNull();
  });
});

describe('openLink', () => {
  const link = 'rnvtest://scenario/mp4';
  const timedOut = Object.assign(new Error('Simulator device failed to open'), { code: 60 });

  // `run` fails `failures` times, then succeeds.
  function harness(failures) {
    const calls = [];
    const pauses = [];
    return {
      calls,
      pauses,
      run: async (file, args) => {
        calls.push([file, ...args]);
        if (calls.length <= failures) throw timedOut;
      },
      sleep: async (ms) => void pauses.push(ms),
    };
  }

  test('runs `simctl openurl` once when it succeeds', async () => {
    const h = harness(0);
    expect(await openLink({ link, run: h.run, sleep: h.sleep })).toEqual({ ok: true, attempts: 1 });
    expect(h.calls).toEqual([['xcrun', 'simctl', 'openurl', 'booted', link]]);
    expect(h.pauses).toEqual([]);
  });

  test('targets the given simulator and xcrun binary', async () => {
    const h = harness(0);
    await openLink({ link, run: h.run, sleep: h.sleep, device: 'ABCD-1234', xcrun: '/tmp/fake-xcrun' });
    expect(h.calls).toEqual([['/tmp/fake-xcrun', 'simctl', 'openurl', 'ABCD-1234', link]]);
  });

  test('tries again after a failure, pausing in between', async () => {
    const h = harness(2);
    expect(await openLink({ link, run: h.run, sleep: h.sleep, pauseMs: 250 })).toEqual({ ok: true, attempts: 3 });
    expect(h.calls).toHaveLength(3);
    expect(h.pauses).toEqual([250, 250]);
  });

  test('gives up after `attempts` failures and reports the last error', async () => {
    const h = harness(Infinity);
    expect(await openLink({ link, run: h.run, sleep: h.sleep, attempts: 3 })).toEqual({
      ok: false,
      attempts: 3,
      error: 'Simulator device failed to open',
    });
    expect(h.calls).toHaveLength(3);
    // No pause after the last attempt: nothing follows it.
    expect(h.pauses).toHaveLength(2);
  });
});
