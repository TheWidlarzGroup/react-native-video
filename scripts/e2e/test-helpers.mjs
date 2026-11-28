// Shared by the scripts' tests: temporary directories removed after every test (even a
// failing one), and fake stdout/stderr for calling a script's `main` in-process.
import { afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function useTmpDirs() {
  const dirs = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
  return () => {
    const dir = mkdtempSync(join(tmpdir(), 'rnv-e2e-scripts-'));
    dirs.push(dir);
    return dir;
  };
}

export function fakeIo(env = {}) {
  const out = [];
  const err = [];
  return {
    io: {
      env,
      stdout: { write: (chunk) => out.push(chunk) > 0 },
      stderr: { write: (chunk) => err.push(chunk) > 0 },
    },
    stdout: () => out.join(''),
    stderr: () => err.join(''),
  };
}
