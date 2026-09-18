// Opens a scenario deep link on the iOS simulator for a Maestro flow (POST /__open-link,
// called from e2e/shared/open-link-ios.js), retrying `simctl openurl` when it times out.
//
// Why not Maestro's own `openLink`: on a hosted macOS runner `simctl openurl` has timed
// out (NSPOSIXErrorDomain 60) while the link still arrived seconds later, and Maestro's
// `retry`/`optional` do not catch that failure (it is not a MaestroException). Only the
// transport is retried; what the app then shows is asserted by the flow, never retried
// (the zero-retries rule in e2e/CONTEXT.md).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Deliberately narrower than the app's parser: this value becomes a process argument.
const SCENARIO_LINK = /^rnvtest:\/\/scenario\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SIMULATOR_UDID = /^[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}$/i;

// The link from `?url=<link>`, or null unless it is exactly one scenario link.
export function scenarioLink(requestUrl) {
  const values = new URL(requestUrl, 'http://x').searchParams.getAll('url');
  return values.length === 1 && SCENARIO_LINK.test(values[0]) ? values[0] : null;
}

// The simulator from `&device=<udid>`: undefined when absent, null when not a UDID.
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
