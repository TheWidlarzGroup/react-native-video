// Opens a scenario deep link on the iOS simulator on behalf of a Maestro flow
// (POST /__open-link on the fixture server, called from e2e/shared/open-link-ios.js).
//
// Why not Maestro's own `openLink`: on a slow hosted macOS runner `xcrun simctl openurl`
// gives up after ~13 s with NSPOSIXErrorDomain code 60 ("Operation timed out"), and
// Maestro surfaces that as an IllegalStateException. Its `retry` command and `optional`
// flag only catch MaestroException, so nothing in a flow can recover from it: one such
// timeout fails the flow, even though the link often still arrives a few seconds later.
// Retrying here is safe for the same reason: the test app keys its screen on the
// scenario, so the same link delivered twice changes nothing.
//
// This retries the transport only. What the app shows afterwards is asserted by the flow
// and never retried (D11).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Deliberately narrower than the app's parser: this value becomes a process argument.
const SCENARIO_LINK = /^rnvtest:\/\/scenario\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SIMULATOR_UDID = /^[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}$/i;

// The link from `/__open-link?url=<link>`, or null unless it is exactly one scenario link.
export function scenarioLink(requestUrl) {
  const values = new URL(requestUrl, 'http://x').searchParams.getAll('url');
  return values.length === 1 && SCENARIO_LINK.test(values[0]) ? values[0] : null;
}

// The simulator from `&device=<udid>`: undefined when absent (the caller falls back to
// `booted`), null when present but not a UDID.
export function simulatorDevice(requestUrl) {
  const values = new URL(requestUrl, 'http://x').searchParams.getAll('device');
  if (values.length === 0 || (values.length === 1 && values[0] === '')) return undefined;
  return values.length === 1 && SIMULATOR_UDID.test(values[0]) ? values[0] : null;
}

export async function openLink({
  link,
  device = 'booted',
  xcrun = 'xcrun',
  attempts = 3,
  pauseMs = 2000,
  // simctl's own timeout is ~13 s; this only bounds a hung process.
  run = (file, args) => execFileAsync(file, args, { timeout: 60_000 }),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  let error = '';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await run(xcrun, ['simctl', 'openurl', device, link]);
      return { ok: true, attempts: attempt };
    } catch (err) {
      error = err.message;
      if (attempt < attempts) await sleep(pauseMs);
    }
  }
  return { ok: false, attempts, error };
}
