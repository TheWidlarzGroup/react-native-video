// android-settle.sh talks to the emulator only through `adb` and paces itself with
// `sleep`, so both are replaced by scripts on PATH: `adb` answers from a small state
// directory (how many dumps fail, whether a dialog is showing, which taps arrived) and
// `sleep` returns at once.
import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { useTmpDirs } from './test-helpers.mjs';

const tmpDir = useTmpDirs();
const SCRIPT = process.env.SETTLE_SCRIPT ?? join(import.meta.dir, 'android-settle.sh');

const ANR_DUMP =
  '<hierarchy><node text="Launcher isn\'t responding" bounds="[0,0][100,50]">' +
  '<node text="Wait" bounds="[10,60][50,80]"></node></node></hierarchy>';
const CLEAN_DUMP = '<hierarchy><node text="Home" bounds="[0,0][100,50]"></node></hierarchy>';

// DUMP_FAILS: how many dump attempts produce no file (what a guest that is still busy
// after boot does). DIALOG: "once" shows the ANR dialog until the first tap, "always"
// keeps it up, anything else never shows it. AFTER_TAP=nodump: no dump once Wait was
// tapped.
const FAKE_ADB = `#!/usr/bin/env bash
st="$STATE"
case "$*" in
  "shell cat /proc/loadavg") echo "0.50 0.40 0.30 1/100 123" ;;
  "shell rm -f /sdcard/settle.xml; uiautomator dump"*)
    n=$(( $(cat "$st/dumps" 2>/dev/null || echo 0) + 1 )); echo "$n" > "$st/dumps"
    if [ "$n" -le "$DUMP_FAILS" ]; then exit 0; fi
    if [ -f "$st/tapped" ] && [ "$AFTER_TAP" = nodump ]; then exit 0; fi
    if [ "$DIALOG" = always ] || { [ "$DIALOG" = once ] && [ ! -f "$st/tapped" ]; }; then
      cat "$st/anr.xml"
    else
      cat "$st/clean.xml"
    fi ;;
  shell\\ input\\ tap*) echo "$*" >> "$st/taps"; touch "$st/tapped" ;;
  *) echo "fake adb: unexpected: $*" >&2; exit 99 ;;
esac
`;

function settle({ dumpFails = 0, dialog = 'never', afterTap = 'dump' } = {}) {
  const dir = tmpDir();
  const bin = join(dir, 'bin');
  const state = join(dir, 'state');
  mkdirSync(bin);
  mkdirSync(state);
  writeFileSync(join(bin, 'adb'), FAKE_ADB);
  writeFileSync(join(bin, 'sleep'), '#!/usr/bin/env bash\nexit 0\n');
  chmodSync(join(bin, 'adb'), 0o755);
  chmodSync(join(bin, 'sleep'), 0o755);
  writeFileSync(join(state, 'anr.xml'), ANR_DUMP);
  writeFileSync(join(state, 'clean.xml'), CLEAN_DUMP);
  // Output goes through files, not pipes: under `bun test` 1.4.0 a piped stdio fails
  // with "EBADF ... posix_spawn" for test files inside the project (bare `true` included).
  const stdoutFile = join(dir, 'stdout');
  const stderrFile = join(dir, 'stderr');
  const result = spawnSync(
    'bash',
    ['-c', 'bash "$0" 10 >"$1" 2>"$2"', SCRIPT, stdoutFile, stderrFile],
    {
      stdio: 'ignore',
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        STATE: state,
        DUMP_FAILS: String(dumpFails),
        DIALOG: dialog,
        AFTER_TAP: afterTap,
      },
    }
  );
  if (result.error) throw result.error;
  const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '');
  const tapsFile = join(state, 'taps');
  return {
    status: result.status,
    stdout: read(stdoutFile),
    stderr: read(stderrFile),
    taps: existsSync(tapsFile) ? read(tapsFile).trim().split('\n') : [],
  };
}

describe('android-settle.sh', () => {
  test('exits 0 when the screen is clean', () => {
    const r = settle();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('no system error dialog on screen');
    expect(r.taps).toEqual([]);
  });

  test('a dump that reported success without writing the file is retried, not fatal', () => {
    // Nightly 2026-09-19: `uiautomator dump` returned 0, the file was not there, and the
    // `adb shell cat` that followed killed the script before Maestro started.
    const r = settle({ dumpFails: 2 });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('no UI dump yet (attempt 1/6)');
    expect(r.stdout).toContain('no UI dump yet (attempt 2/6)');
    expect(r.stdout).toContain('no system error dialog on screen');
  });

  test('gives up on the dialog check, without failing, when no dump ever arrives', () => {
    const r = settle({ dumpFails: 99 });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('no UI dump yet (attempt 6/6)');
    expect(r.stderr).toContain('continuing without the dialog check');
  });

  test('taps Wait on a system ANR dialog and exits 0 once it is gone', () => {
    const r = settle({ dialog: 'once' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Launcher isn't responding");
    expect(r.taps).toEqual(['shell input tap 30 70']);
    expect(r.stdout).toContain('no system error dialog on screen');
  });

  test('a dismissed dialog followed by dump-less attempts does not fail the leg', () => {
    const r = settle({ dialog: 'once', afterTap: 'nodump' });
    expect(r.status).toBe(0);
    expect(r.taps).toHaveLength(1);
    expect(r.stderr).toContain('no later dump confirmed the screen');
  });

  test('fails when the dialog keeps coming back', () => {
    const r = settle({ dialog: 'always' });
    expect(r.status).toBe(1);
    expect(r.taps).toHaveLength(6);
    expect(r.stderr).toContain('kept coming back');
  });
});
