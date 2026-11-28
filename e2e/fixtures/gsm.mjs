// Starts or ends an incoming call on the Android emulator for a Maestro flow (POST /__gsm,
// called from e2e/shared/gsm-android.js). A ringing call takes the audio focus (Telecom asks
// for GAIN_TRANSIENT) and ending it gives the focus back, so smoke-audio-focus.yaml can check
// onAudioFocusChange without a second app. The emulator console does the work, through
// `adb emu gsm call|cancel`; a physical device has no such command.
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// The caller's number. Any number works; one constant lets `cancel` end the call `call` made.
export const GSM_NUMBER = '5551234';

// Only these two values ever reach the process arguments.
const ACTIONS = new Set(['call', 'cancel']);

const EMULATOR_SERIAL = /^emulator-\d{4,5}$/;

// The action from `?action=call|cancel`, or null unless it is exactly one of them.
export function gsmAction(requestUrl) {
  const values = new URL(requestUrl, 'http://x').searchParams.getAll('action');
  return values.length === 1 && ACTIONS.has(values[0]) ? values[0] : null;
}

// The emulator from `&device=<serial>`: undefined when absent, null when not an emulator serial.
export function emulatorSerial(requestUrl) {
  const values = new URL(requestUrl, 'http://x').searchParams.getAll('device');
  if (values.length === 0 || (values.length === 1 && values[0] === '')) return undefined;
  return values.length === 1 && EMULATOR_SERIAL.test(values[0]) ? values[0] : null;
}

// adb from the Android SDK when the environment names one, else the one on PATH.
export function defaultAdb(env = process.env) {
  const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT;
  return sdk ? join(sdk, 'platform-tools', 'adb') : 'adb';
}

// `adb emu` answers on stdout: "OK" when the console took the command, "KO: <reason>" when not.
export async function gsm({
  action,
  serial,
  adb = defaultAdb(),
  run = (file, args) => execFileAsync(file, args, { timeout: 30_000 }),
}) {
  const args = [...(serial ? ['-s', serial] : []), 'emu', 'gsm', action, GSM_NUMBER];
  try {
    const { stdout = '' } = (await run(adb, args)) ?? {};
    if (/^KO/m.test(stdout)) return { ok: false, error: stdout.trim() };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
