// Switches test-app/ to one of the React Native versions in the CI matrix, or (--refresh)
// regenerates that version's lockfile. The floor version needs no directory: the repo's own
// test-app/package.json and root bun.lock ARE the floor variant, so the default state of
// the repo always works.
//
// Usage: use-rn-version.mjs <version> [--refresh]   (run from the repo root)
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { runIfMain } from './is-main.mjs';

export const FLOOR = '0.77';
const PKG = 'test-app/package.json';
const ROOT_LOCK = 'bun.lock';
// bun nests a variant's react-native here, and a later frozen install for another variant
// leaves that copy in place, so test-app keeps resolving the old version.
const NESTED_NODE_MODULES = 'test-app/node_modules';

export function applyOverlay(basePkg, overlay) {
  const overlayDeps = overlay.dependencies ?? {};
  const overlayDevDeps = overlay.devDependencies ?? {};
  const dependencies = { ...basePkg.dependencies, ...overlayDeps };
  const devDependencies = { ...basePkg.devDependencies, ...overlayDevDeps };
  // A package the overlay moves to the other section must not stay in both.
  for (const key of Object.keys(overlayDeps)) delete devDependencies[key];
  for (const key of Object.keys(overlayDevDeps)) delete dependencies[key];
  return { ...basePkg, dependencies, devDependencies };
}

// Installs against the overlaid package.json and saves the resulting root lockfile as the
// variant's. package.json and the root lockfile are then written back byte for byte, even
// when the install fails: they may carry uncommitted edits, typically the dependency change
// this refresh is being run for.
export function refreshVariantLock({ pkgPath, rootLockPath, variantLockPath, overlaidPkg, runInstall }) {
  const originalPkg = readFileSync(pkgPath);
  const originalLock = readFileSync(rootLockPath);
  writeFileSync(pkgPath, overlaidPkg);
  try {
    runInstall();
    copyFileSync(rootLockPath, variantLockPath);
  } finally {
    writeFileSync(pkgPath, originalPkg);
    writeFileSync(rootLockPath, originalLock);
  }
}

// Every precondition is checked before anything is written or deleted: a switch that fails
// halfway would leave package.json on one RN version and bun.lock on another.
export function switchVersion({ root, version, refresh, runInstall }) {
  const clearNestedNodeModules = () =>
    rmSync(join(root, NESTED_NODE_MODULES), { recursive: true, force: true });

  if (version === FLOOR) {
    clearNestedNodeModules();
    return 'floor';
  }

  const variantDir = join('e2e/rn-matrix', version);
  const overlayPath = join(root, variantDir, 'overlay.json');
  const variantLockPath = join(root, variantDir, 'bun.lock');
  if (!existsSync(overlayPath)) {
    throw new Error(`no overlay at ${join(variantDir, 'overlay.json')}`);
  }
  if (!refresh && !existsSync(variantLockPath)) {
    throw new Error(`no lockfile at ${join(variantDir, 'bun.lock')} — run with --refresh first`);
  }
  const pkgPath = join(root, PKG);
  const rootLockPath = join(root, ROOT_LOCK);
  const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
  const overlaidPkg = `${JSON.stringify(applyOverlay(readJson(pkgPath), readJson(overlayPath)), null, 2)}\n`;

  clearNestedNodeModules();
  if (refresh) {
    refreshVariantLock({ pkgPath, rootLockPath, variantLockPath, overlaidPkg, runInstall });
    // The install left the variant's tree behind; the files are back on the floor.
    clearNestedNodeModules();
    return 'refreshed';
  }
  writeFileSync(pkgPath, overlaidPkg);
  copyFileSync(variantLockPath, rootLockPath);
  return 'switched';
}

export function main({ argv, stdout, stderr, root = process.cwd(), runInstall }) {
  const args = argv.slice(2);
  const refresh = args.includes('--refresh');
  const positional = args.filter((arg) => arg !== '--refresh');
  const [version] = positional;
  if (positional.length !== 1 || version.startsWith('-')) {
    stderr.write('usage: use-rn-version.mjs <version> [--refresh]\n');
    return 1;
  }

  let outcome;
  try {
    outcome = switchVersion({
      root,
      version,
      refresh,
      runInstall: runInstall ?? (() => execFileSync('bun', ['install'], { cwd: root, stdio: 'inherit' })),
    });
  } catch (err) {
    stderr.write(`[rn-matrix] ${err.message}\n`);
    return 1;
  }

  const variantLock = join('e2e/rn-matrix', version, 'bun.lock');
  const messages = {
    floor: `[rn-matrix] ${FLOOR} is the floor — repo state used as-is; run bun install --frozen-lockfile\n`,
    refreshed: `[rn-matrix] refreshed ${variantLock}; run bun install --frozen-lockfile to reinstall the floor\n`,
    switched:
      `[rn-matrix] switched test-app to RN ${version}; run bun install --frozen-lockfile\n` +
      `[rn-matrix] ${PKG} and ${ROOT_LOCK} are now the ${version} variant — do not commit them.\n` +
      `[rn-matrix] back to the floor: git checkout -- ${ROOT_LOCK} ${PKG}\n`,
  };
  stdout.write(messages[outcome]);
  return 0;
}

runIfMain(import.meta.url, main);
