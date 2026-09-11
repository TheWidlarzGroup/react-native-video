// scripts/e2e/use-rn-version.test.mjs
import { test, expect } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyOverlay, applyVersionSwitch, FLOOR, performRefresh } from './use-rn-version.mjs';

const base = {
  name: 'RNVideoE2E',
  dependencies: { react: '18.3.1', 'react-native': '0.77.3', 'react-native-video': '*' },
  devDependencies: { '@react-native/babel-preset': '0.77.3', typescript: '5.0.4' },
};

function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), 'use-rn-version-test-'));
}

test('overlay replaces only the versions it names', () => {
  const merged = applyOverlay(base, {
    dependencies: { react: '19.2.3', 'react-native': '0.87.1' },
    devDependencies: { '@react-native/babel-preset': '0.87.1' },
  });
  expect(merged.dependencies['react-native']).toBe('0.87.1');
  expect(merged.dependencies.react).toBe('19.2.3');
  expect(merged.devDependencies['@react-native/babel-preset']).toBe('0.87.1');
});

test('overlay leaves untouched entries alone', () => {
  const merged = applyOverlay(base, { dependencies: { react: '19.2.3' } });
  expect(merged.dependencies['react-native-video']).toBe('*');
  expect(merged.devDependencies.typescript).toBe('5.0.4');
});

test('overlay does not mutate the base object', () => {
  applyOverlay(base, { dependencies: { react: '19.2.3' } });
  expect(base.dependencies.react).toBe('18.3.1');
});

test('the floor version is a known constant', () => {
  expect(FLOOR).toBe('0.77');
});

test('overlay relocates a dependency moved from dependencies to devDependencies', () => {
  const merged = applyOverlay(base, {
    devDependencies: { react: '19.2.3' },
  });
  expect(merged.devDependencies.react).toBe('19.2.3');
  expect(merged.dependencies.react).toBeUndefined();
});

test('overlay relocates a dependency moved from devDependencies to dependencies', () => {
  const merged = applyOverlay(base, {
    dependencies: { typescript: '5.4.0' },
  });
  expect(merged.dependencies.typescript).toBe('5.4.0');
  expect(merged.devDependencies.typescript).toBeUndefined();
});

test('switching without --refresh against a missing lockfile leaves package.json untouched', () => {
  const dir = makeTmpDir();
  try {
    const pkgPath = join(dir, 'package.json');
    const overlayPath = join(dir, 'overlay.json');
    const lockPath = join(dir, 'bun.lock'); // deliberately never created
    const rootLockPath = join(dir, 'root.lock');

    const originalPkg = `${JSON.stringify(base, null, 2)}\n`;
    writeFileSync(pkgPath, originalPkg);
    writeFileSync(overlayPath, JSON.stringify({ dependencies: { 'react-native': '9.99.0' } }));

    expect(() => {
      applyVersionSwitch(pkgPath, overlayPath, lockPath, rootLockPath, false);
    }).toThrow(/no lockfile at/);

    // The critical assertion: package.json must be exactly as it was before the call —
    // not overlaid to the new version while bun.lock still points at the floor. This is
    // only guaranteed because the lockfile-existence check runs before any write.
    expect(readFileSync(pkgPath, 'utf8')).toBe(originalPkg);
    expect(existsSync(rootLockPath)).toBe(false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('switching without --refresh against a missing overlay leaves package.json untouched', () => {
  const dir = makeTmpDir();
  try {
    const pkgPath = join(dir, 'package.json');
    const overlayPath = join(dir, 'overlay.json'); // deliberately never created
    const lockPath = join(dir, 'bun.lock');
    const rootLockPath = join(dir, 'root.lock');

    const originalPkg = `${JSON.stringify(base, null, 2)}\n`;
    writeFileSync(pkgPath, originalPkg);

    expect(() => {
      applyVersionSwitch(pkgPath, overlayPath, lockPath, rootLockPath, false);
    }).toThrow(/no overlay at/);

    expect(readFileSync(pkgPath, 'utf8')).toBe(originalPkg);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('switching without --refresh against an existing lockfile overlays package.json and copies the lockfile', () => {
  const dir = makeTmpDir();
  try {
    const pkgPath = join(dir, 'package.json');
    const overlayPath = join(dir, 'overlay.json');
    const lockPath = join(dir, 'bun.lock');
    const rootLockPath = join(dir, 'root.lock');

    writeFileSync(pkgPath, `${JSON.stringify(base, null, 2)}\n`);
    writeFileSync(overlayPath, JSON.stringify({ dependencies: { 'react-native': '9.99.0' } }));
    writeFileSync(lockPath, 'resolved-lock-content');

    applyVersionSwitch(pkgPath, overlayPath, lockPath, rootLockPath, false);

    expect(JSON.parse(readFileSync(pkgPath, 'utf8')).dependencies['react-native']).toBe('9.99.0');
    expect(readFileSync(rootLockPath, 'utf8')).toBe('resolved-lock-content');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('switching with --refresh restores package.json and the root lockfile when install throws', () => {
  const dir = makeTmpDir();
  try {
    const pkgPath = join(dir, 'package.json');
    const overlayPath = join(dir, 'overlay.json');
    const lockPath = join(dir, 'bun.lock'); // does not need to pre-exist when refreshing
    const rootLockPath = join(dir, 'root.lock');

    const originalPkg = `${JSON.stringify(base, null, 2)}\n`;
    writeFileSync(pkgPath, originalPkg);
    writeFileSync(overlayPath, JSON.stringify({ dependencies: { 'react-native': '9.99.0' } }));
    writeFileSync(rootLockPath, 'floor-lock-content');

    let restoreCalled = false;
    expect(() => {
      applyVersionSwitch(pkgPath, overlayPath, lockPath, rootLockPath, true, {
        runInstall: () => {
          throw new Error('bun install failed: network error');
        },
        restoreLock: () => {
          restoreCalled = true;
        },
      });
    }).toThrow('bun install failed: network error');

    expect(readFileSync(pkgPath, 'utf8')).toBe(originalPkg);
    expect(restoreCalled).toBe(true);
    expect(existsSync(lockPath)).toBe(false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('performRefresh restores package.json and the root lockfile after a successful install', () => {
  const dir = makeTmpDir();
  try {
    const pkgPath = join(dir, 'pkg.json');
    const rootLockPath = join(dir, 'root.lock');
    const lockPath = join(dir, 'variant.lock');
    writeFileSync(pkgPath, 'overlaid-pkg');
    writeFileSync(rootLockPath, 'resolved-lock-content');

    let restoreCalled = false;
    performRefresh(pkgPath, rootLockPath, lockPath, 'original-pkg-content', {
      runInstall: () => {},
      restoreLock: () => {
        restoreCalled = true;
        writeFileSync(rootLockPath, 'floor-lock-content');
      },
    });

    expect(readFileSync(lockPath, 'utf8')).toBe('resolved-lock-content');
    expect(readFileSync(pkgPath, 'utf8')).toBe('original-pkg-content');
    expect(restoreCalled).toBe(true);
    expect(readFileSync(rootLockPath, 'utf8')).toBe('floor-lock-content');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('performRefresh restores package.json even when install throws, and rethrows the error', () => {
  const dir = makeTmpDir();
  try {
    const pkgPath = join(dir, 'pkg.json');
    const rootLockPath = join(dir, 'root.lock');
    const lockPath = join(dir, 'variant.lock');
    writeFileSync(pkgPath, 'overlaid-pkg');
    writeFileSync(rootLockPath, 'partial-lock-content');

    let restoreCalled = false;
    expect(() => {
      performRefresh(pkgPath, rootLockPath, lockPath, 'original-pkg-content', {
        runInstall: () => {
          throw new Error('bun install failed: network error');
        },
        restoreLock: () => {
          restoreCalled = true;
        },
      });
    }).toThrow('bun install failed: network error');

    expect(readFileSync(pkgPath, 'utf8')).toBe('original-pkg-content');
    expect(restoreCalled).toBe(true);
    // The install threw before the lockfile was ever copied out.
    expect(existsSync(lockPath)).toBe(false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
