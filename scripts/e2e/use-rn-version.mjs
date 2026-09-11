// scripts/e2e/use-rn-version.mjs
// Switches test-app/ to one of the React Native versions in the CI matrix.
// The floor version needs no directory: the repo's own test-app/package.json and root
// bun.lock ARE the floor variant, so the default state of the repo always works.
import { readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { isMain } from './is-main.mjs';

export const FLOOR = '0.77';
const PKG = 'test-app/package.json';
const ROOT_LOCK = 'bun.lock';
const NESTED_NODE_MODULES = 'test-app/node_modules';

// bun nests a variant's react-native under test-app/node_modules, and a later
// `bun install --frozen-lockfile` for another variant (or the floor) leaves that nested
// copy in place, so test-app keeps resolving the OLD version. Drop it on every switch so
// the next install starts clean.
function clearNestedNodeModules() {
  rmSync(NESTED_NODE_MODULES, { recursive: true, force: true });
}

export function applyOverlay(basePkg, overlay) {
  const overlayDeps = overlay.dependencies ?? {};
  const overlayDevDeps = overlay.devDependencies ?? {};
  const dependencies = { ...basePkg.dependencies, ...overlayDeps };
  const devDependencies = { ...basePkg.devDependencies, ...overlayDevDeps };

  // A dependency the overlay places in one section must not linger in the other —
  // otherwise moving a package between `dependencies` and `devDependencies` produces
  // the key in both instead of relocating it.
  for (const key of Object.keys(overlayDeps)) delete devDependencies[key];
  for (const key of Object.keys(overlayDevDeps)) delete dependencies[key];

  return { ...basePkg, dependencies, devDependencies };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

// Runs `bun install` against the just-overlaid package.json, saves the resulting root
// lockfile as the version's variant, then restores both package.json and the root
// lockfile to their floor state — even if the install throws (resolution failure,
// network error, Ctrl-C). The restore always runs; the original error, if any,
// propagates after it so the caller still sees the failure.
export function performRefresh(pkgPath, rootLockPath, lockPath, original, overrides = {}) {
  const runInstall =
    overrides.runInstall ?? (() => execFileSync('bun', ['install'], { stdio: 'inherit' }));
  const restoreLock =
    overrides.restoreLock ??
    (() => execFileSync('git', ['checkout', '--', rootLockPath], { stdio: 'inherit' }));

  try {
    runInstall();
    copyFileSync(rootLockPath, lockPath);
  } finally {
    writeFileSync(pkgPath, original); // leave the working tree on the floor variant
    restoreLock();
  }
}

// All filesystem effects of switching test-app to a non-floor RN version, with every
// precondition checked BEFORE anything is written. In particular, a plain switch
// (no refresh) against a version whose bun.lock does not exist yet must fail without
// touching package.json — writing the overlay first and discovering the missing
// lockfile afterwards would leave package.json pointed at the new RN version while
// bun.lock still resolves the floor, which is the exact inconsistent state this whole
// mechanism exists to prevent.
export function applyVersionSwitch(pkgPath, overlayPath, lockPath, rootLockPath, refresh, overrides = {}) {
  if (!existsSync(overlayPath)) {
    throw new Error(`no overlay at ${overlayPath}`);
  }
  if (!refresh && !existsSync(lockPath)) {
    throw new Error(`no lockfile at ${lockPath} — run with --refresh first`);
  }

  const original = readFileSync(pkgPath, 'utf8');
  writeJson(pkgPath, applyOverlay(readJson(pkgPath), readJson(overlayPath)));

  if (refresh) {
    performRefresh(pkgPath, rootLockPath, lockPath, original, overrides);
    return;
  }

  copyFileSync(lockPath, rootLockPath);
}

function main() {
  const version = process.argv[2];
  const refresh = process.argv.includes('--refresh');

  if (!version) {
    console.error('usage: use-rn-version.mjs <version> [--refresh]');
    process.exit(1);
  }

  clearNestedNodeModules();

  if (version === FLOOR) {
    console.log(`[rn-matrix] ${FLOOR} is the floor — repo state used as-is; run bun install --frozen-lockfile`);
    return;
  }

  const dir = join('e2e/rn-matrix', version);
  const overlayPath = join(dir, 'overlay.json');
  const lockPath = join(dir, 'bun.lock');

  try {
    applyVersionSwitch(PKG, overlayPath, lockPath, ROOT_LOCK, refresh);
  } catch (err) {
    console.error(`[rn-matrix] ${err.message}`);
    process.exit(1);
  }

  if (refresh) {
    // The refresh install left the variant's tree behind; the repo is back on the floor.
    clearNestedNodeModules();
    console.log(`[rn-matrix] refreshed ${lockPath}; run bun install --frozen-lockfile to reinstall the floor`);
    return;
  }
  console.log(`[rn-matrix] switched test-app to RN ${version}; run bun install --frozen-lockfile`);
  console.log(
    `[rn-matrix] ${PKG} and ${ROOT_LOCK} are now the ${version} variant — do not commit them.\n` +
      `[rn-matrix] back to the floor: git checkout -- ${ROOT_LOCK} ${PKG}`
  );
}

if (isMain(import.meta.url)) main();
