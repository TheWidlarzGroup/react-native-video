import { describe, test, expect } from 'bun:test';
import { gsmAction, emulatorSerial, defaultAdb, gsm, GSM_NUMBER } from './gsm.mjs';

describe('gsmAction', () => {
  test('accepts call and cancel', () => {
    expect(gsmAction('/__gsm?action=call')).toBe('call');
    expect(gsmAction('/__gsm?action=cancel')).toBe('cancel');
  });

  test('rejects anything else, a missing action and repeats', () => {
    for (const url of [
      '/__gsm',
      '/__gsm?action=',
      '/__gsm?action=accept',
      '/__gsm?action=call%20;rm',
      '/__gsm?action=call&action=cancel',
    ]) {
      expect(gsmAction(url)).toBeNull();
    }
  });
});

describe('emulatorSerial', () => {
  test('is undefined when the request names no device', () => {
    expect(emulatorSerial('/__gsm?action=call')).toBeUndefined();
    expect(emulatorSerial('/__gsm?action=call&device=')).toBeUndefined();
  });

  test('accepts an emulator serial', () => {
    expect(emulatorSerial('/__gsm?action=call&device=emulator-5554')).toBe('emulator-5554');
  });

  test('is null for anything else, including a physical device and repeats', () => {
    for (const url of [
      '/__gsm?device=R58M12345',
      '/__gsm?device=emulator-',
      '/__gsm?device=-s',
      '/__gsm?device=emulator-5554&device=emulator-5556',
    ]) {
      expect(emulatorSerial(url)).toBeNull();
    }
  });
});

describe('defaultAdb', () => {
  test('uses the SDK from the environment, else adb on PATH', () => {
    expect(defaultAdb({ ANDROID_HOME: '/sdk' })).toBe('/sdk/platform-tools/adb');
    expect(defaultAdb({ ANDROID_SDK_ROOT: '/root-sdk' })).toBe('/root-sdk/platform-tools/adb');
    expect(defaultAdb({})).toBe('adb');
  });
});

describe('gsm', () => {
  function harness(result) {
    const calls = [];
    return {
      calls,
      run: async (file, args) => {
        calls.push([file, ...args]);
        if (result instanceof Error) throw result;
        return result;
      },
    };
  }

  test('starts a call on the emulator adb picks', async () => {
    const h = harness({ stdout: 'OK\n' });
    expect(await gsm({ action: 'call', adb: 'adb', run: h.run })).toEqual({ ok: true });
    expect(h.calls).toEqual([['adb', 'emu', 'gsm', 'call', GSM_NUMBER]]);
  });

  test('ends the call on the given emulator', async () => {
    const h = harness({ stdout: 'OK\n' });
    expect(await gsm({ action: 'cancel', serial: 'emulator-5556', adb: '/sdk/adb', run: h.run })).toEqual({ ok: true });
    expect(h.calls).toEqual([['/sdk/adb', '-s', 'emulator-5556', 'emu', 'gsm', 'cancel', GSM_NUMBER]]);
  });

  test('reports a console that refused the command', async () => {
    const h = harness({ stdout: 'KO: bad phone number format\n' });
    expect(await gsm({ action: 'call', run: h.run })).toEqual({ ok: false, error: 'KO: bad phone number format' });
  });

  test('reports adb failing to run', async () => {
    const h = harness(new Error('error: no emulators found'));
    expect(await gsm({ action: 'call', run: h.run })).toEqual({ ok: false, error: 'error: no emulators found' });
  });
});
