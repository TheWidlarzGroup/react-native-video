import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { applyOverlay, FLOOR, main } from './use-rn-version.mjs';
import { fakeIo, useTmpDirs } from './test-helpers.mjs';

const tmpDir = useTmpDirs();

const base = {
  name: 'RNVideoE2E',
  dependencies: { react: '18.3.1', 'react-native': '0.77.3', 'react-native-video': '*' },
  devDependencies: { '@react-native/babel-preset': '0.77.3', typescript: '5.0.4' },
};

describe('applyOverlay', () => {
  test('replaces only the versions the overlay names', () => {
    const merged = applyOverlay(base, {
      dependencies: { react: '19.2.3', 'react-native': '0.87.1' },
      devDependencies: { '@react-native/babel-preset': '0.87.1' },
    });
    expect(merged).toEqual({
      name: 'RNVideoE2E',
      dependencies: { react: '19.2.3', 'react-native': '0.87.1', 'react-native-video': '*' },
      devDependencies: { '@react-native/babel-preset': '0.87.1', typescript: '5.0.4' },
    });
  });

  test('moves a package the overlay places in the other section', () => {
    expect(applyOverlay(base, { devDependencies: { react: '19.2.3' } })).toMatchObject({
      dependencies: { 'react-native': '0.77.3', 'react-native-video': '*' },
      devDependencies: { react: '19.2.3' },
    });
    const moved = applyOverlay(base, { dependencies: { typescript: '5.4.0' } });
    expect(moved.dependencies.typescript).toBe('5.4.0');
    expect(moved.devDependencies.typescript).toBeUndefined();
  });

  test('does not mutate the base package', () => {
    const snapshot = structuredClone(base);
    applyOverlay(base, { dependencies: { react: '19.2.3' }, devDependencies: { react: '19.2.3' } });
    expect(base).toEqual(snapshot);
  });
});

describe('main', () => {
  const PKG = 'test-app/package.json';
  const NESTED = 'test-app/node_modules/react-native/package.json';
  const OVERLAY = 'e2e/rn-matrix/0.87/overlay.json';
  const VARIANT_LOCK = 'e2e/rn-matrix/0.87/bun.lock';
  // package.json and bun.lock as a contributor leaves them mid-change: uncommitted edits.
  const WORKING_PKG = `${JSON.stringify({ ...base, dependencies: { ...base.dependencies, 'new-dep': '1.0.0' } }, null, 2)}\n`;
  const WORKING_LOCK = 'floor lock, including new-dep';

  function repo({ overlay = true, variantLock = true } = {}) {
    const root = tmpDir();
    const files = {
      [PKG]: WORKING_PKG,
      'bun.lock': WORKING_LOCK,
      [NESTED]: '{}',
      ...(overlay ? { [OVERLAY]: JSON.stringify({ dependencies: { 'react-native': '0.87.1' } }) } : {}),
      ...(variantLock ? { [VARIANT_LOCK]: 'committed 0.87 lock' } : {}),
    };
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    const read = (path) => readFileSync(join(root, path), 'utf8');
    const exists = (path) => existsSync(join(root, path));
    return { root, read, exists };
  }

  function call(root, args, runInstall = () => {
    throw new Error('runInstall must not be called');
  }) {
    const fake = fakeIo();
    const code = main({ argv: ['node', 'use-rn-version.mjs', ...args], ...fake.io, root, runInstall });
    return { code, stdout: fake.stdout(), stderr: fake.stderr() };
  }

  test('switches package.json and bun.lock to the variant and drops the nested node_modules', () => {
    const { root, read, exists } = repo();
    const { code, stdout } = call(root, ['0.87']);
    expect(code).toBe(0);
    expect(JSON.parse(read(PKG)).dependencies).toMatchObject({ 'react-native': '0.87.1', 'new-dep': '1.0.0' });
    expect(read('bun.lock')).toBe('committed 0.87 lock');
    expect(exists(NESTED)).toBe(false);
    expect(stdout).toContain('switched test-app to RN 0.87');
    expect(stdout).toContain('do not commit them');
  });

  test('the floor leaves the files alone and only drops the nested node_modules', () => {
    const { root, read, exists } = repo();
    const { code, stdout } = call(root, [FLOOR]);
    expect(code).toBe(0);
    expect(read(PKG)).toBe(WORKING_PKG);
    expect(read('bun.lock')).toBe(WORKING_LOCK);
    expect(exists(NESTED)).toBe(false);
    expect(stdout).toContain(`${FLOOR} is the floor`);
  });

  test.each([
    ['an unknown version', ['0.99'], { overlay: false }, 'no overlay at e2e/rn-matrix/0.99/overlay.json'],
    ['a version without a lockfile', ['0.87'], { variantLock: false }, 'no lockfile at e2e/rn-matrix/0.87/bun.lock — run with --refresh first'],
    ['a refresh of an unknown version', ['0.99', '--refresh'], { overlay: false }, 'no overlay at e2e/rn-matrix/0.99/overlay.json'],
  ])('%s fails before touching anything', (_, args, layout, message) => {
    const { root, read, exists } = repo(layout);
    const { code, stderr } = call(root, args);
    expect(code).toBe(1);
    expect(stderr).toBe(`[rn-matrix] ${message}\n`);
    expect(read(PKG)).toBe(WORKING_PKG);
    expect(read('bun.lock')).toBe(WORKING_LOCK);
    expect(exists(NESTED)).toBe(true);
  });

  describe('--refresh', () => {
    test('saves the install lockfile as the variant and restores uncommitted package.json and bun.lock', () => {
      const { root, read, exists } = repo({ variantLock: false });
      let installedAgainst;
      const { code, stdout } = call(root, ['--refresh', '0.87'], () => {
        installedAgainst = JSON.parse(read(PKG));
        writeFileSync(join(root, 'bun.lock'), 'resolved 0.87 lock');
        // Like bun, the install nests the variant's react-native under test-app.
        mkdirSync(dirname(join(root, NESTED)), { recursive: true });
        writeFileSync(join(root, NESTED), '{"version":"0.87.1"}');
      });

      expect(code).toBe(0);
      expect(installedAgainst.dependencies).toMatchObject({ 'react-native': '0.87.1', 'new-dep': '1.0.0' });
      expect(read(VARIANT_LOCK)).toBe('resolved 0.87 lock');
      expect(read(PKG)).toBe(WORKING_PKG);
      expect(read('bun.lock')).toBe(WORKING_LOCK);
      expect(exists(NESTED)).toBe(false);
      expect(stdout).toContain('refreshed e2e/rn-matrix/0.87/bun.lock');
    });

    test('restores both files and keeps the old variant lockfile when the install fails', () => {
      const { root, read } = repo();
      const { code, stderr } = call(root, ['0.87', '--refresh'], () => {
        writeFileSync(join(root, 'bun.lock'), 'half-written lock');
        throw new Error('bun install failed: network error');
      });

      expect(code).toBe(1);
      expect(stderr).toBe('[rn-matrix] bun install failed: network error\n');
      expect(read(PKG)).toBe(WORKING_PKG);
      expect(read('bun.lock')).toBe(WORKING_LOCK);
      expect(read(VARIANT_LOCK)).toBe('committed 0.87 lock');
    });
  });

  test.each([
    ['no arguments', []],
    ['only --refresh', ['--refresh']],
    ['two versions', ['0.82', '0.87']],
    ['an unknown flag', ['0.87', '--force']],
    ['a flag instead of a version', ['--force']],
  ])('fails with usage given %s', (_, args) => {
    const { root, read, exists } = repo();
    const { code, stderr } = call(root, args);
    expect(code).toBe(1);
    expect(stderr).toBe('usage: use-rn-version.mjs <version> [--refresh]\n');
    expect(read(PKG)).toBe(WORKING_PKG);
    expect(exists(NESTED)).toBe(true);
  });
});
