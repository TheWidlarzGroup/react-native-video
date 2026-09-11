// Builds the nightly matrix: every (RN version x device) row for both platforms, plus one
// quarantine leg per platform when at least one flow is tagged `flaky`, and the artifact
// name each row uploads under. The nightly workflow passes those names to the reusable
// legs and reads the expected-row list from the same objects, so the two cannot drift.
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMain } from './is-main.mjs';

export const ANDROID_RN = ['0.77', '0.82', '0.87'];
export const ANDROID_API = ['36', '35', '34'];
export const IOS_RN = ['0.77', '0.82', '0.87'];
export const IOS_DEVICES = [
  { runner: 'macos-26', runtime: '26', sim: 'iPhone 17' },
  { runner: 'macos-15', runtime: '18', sim: 'iPhone 16' },
];
export const QUARANTINE_ANDROID = { rn: '0.77', api: '36' };
export const QUARANTINE_IOS = { rn: '0.77', runner: 'macos-26', runtime: '26' };

export const COVERAGE_TAGS = '--exclude-tags=flaky';
export const QUARANTINE_TAGS = '--include-tags=flaky';

// Must match the "Resolve artifact name" step in _e2e-android.yml / _e2e-ios.yml:
//   sed -E 's/[^A-Za-z0-9]+/-/g; s/^-+|-+$//g'
export function slug(tags) {
  return tags.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function androidArtifactName(rn, api, tags) {
  return `e2e-android-rn${rn}-api${api}-${slug(tags)}`;
}

export function iosArtifactName(rn, runtime, tags) {
  return `e2e-ios-rn${rn}-ios${runtime}-${slug(tags)}`;
}

// A flow is quarantined when `flaky` appears in its Maestro `tags`, either inline
// (`tags: [smoke, flaky]`) or as a block list item (`- flaky`).
const FLAKY_TAG = /^\s*tags:.*\bflaky\b|^\s*-\s*flaky\s*$/m;

export function detectFlakyFlows(flowsDir) {
  return readdirSync(flowsDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .filter((name) => FLAKY_TAG.test(readFileSync(join(flowsDir, name), 'utf8')))
    .sort();
}

export function buildPlan({ hasQuarantine }) {
  const androidRows = ANDROID_RN.flatMap((rn) =>
    ANDROID_API.map((api) => ({
      rn,
      'api-level': api,
      'artifact-name': androidArtifactName(rn, api, COVERAGE_TAGS),
    }))
  );
  const iosRows = IOS_RN.flatMap((rn) =>
    IOS_DEVICES.map((d) => ({
      rn,
      runner: d.runner,
      'ios-runtime': d.runtime,
      'sim-device': d.sim,
      'artifact-name': iosArtifactName(rn, d.runtime, COVERAGE_TAGS),
    }))
  );
  const quarantineAndroid = {
    'rn-version': QUARANTINE_ANDROID.rn,
    'api-level': QUARANTINE_ANDROID.api,
    'artifact-name': androidArtifactName(QUARANTINE_ANDROID.rn, QUARANTINE_ANDROID.api, QUARANTINE_TAGS),
  };
  const quarantineIos = {
    'rn-version': QUARANTINE_IOS.rn,
    runner: QUARANTINE_IOS.runner,
    'ios-runtime': QUARANTINE_IOS.runtime,
    'artifact-name': iosArtifactName(QUARANTINE_IOS.rn, QUARANTINE_IOS.runtime, QUARANTINE_TAGS),
  };
  const quarantineLabels = hasQuarantine
    ? [quarantineAndroid['artifact-name'], quarantineIos['artifact-name']]
    : [];
  const expectedLabels = [
    ...androidRows.map((r) => r['artifact-name']),
    ...iosRows.map((r) => r['artifact-name']),
    ...quarantineLabels,
  ];

  return {
    'android-matrix': { include: androidRows },
    'ios-matrix': { include: iosRows },
    'has-quarantine': hasQuarantine,
    'quarantine-android': quarantineAndroid,
    'quarantine-ios': quarantineIos,
    'expected-labels': expectedLabels,
    'quarantine-labels': quarantineLabels,
  };
}

// Fails on any shape that would silently change what a night means: a family that
// changed size without this file being updated, a row with no artifact name, or two
// rows that would collide on the same artifact name (upload-artifact@v4 hard-errors).
export function validatePlan(plan) {
  const android = plan['android-matrix'].include;
  const ios = plan['ios-matrix'].include;
  const quarantine = plan['quarantine-labels'];
  const wantQuarantine = plan['has-quarantine'] ? 2 : 0;
  if (android.length !== 9 || ios.length !== 6 || quarantine.length !== wantQuarantine) {
    throw new Error(
      `matrix shape wrong — android ${android.length} (want 9), ios ${ios.length} (want 6), quarantine ${quarantine.length} (want ${wantQuarantine})`
    );
  }
  const expected = plan['expected-labels'];
  if (expected.length !== 15 + wantQuarantine) {
    throw new Error(`expected ${15 + wantQuarantine} rows, computed ${expected.length}`);
  }
  for (const row of [...android, ...ios, plan['quarantine-android'], plan['quarantine-ios']]) {
    if (!row['artifact-name']) throw new Error(`a matrix row is missing artifact-name: ${JSON.stringify(row)}`);
  }
  if (new Set(expected).size !== expected.length) {
    throw new Error(`duplicate artifact names: ${expected.filter((l, i) => expected.indexOf(l) !== i).join(', ')}`);
  }
}

export function renderOutputs(plan) {
  return Object.entries(plan)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('\n') + '\n';
}

export function main({ argv, env, stdout, stderr }) {
  const flowsDir = argv[2] ?? 'e2e/flows';
  const flaky = detectFlakyFlows(flowsDir);
  const plan = buildPlan({ hasQuarantine: flaky.length > 0 });
  try {
    validatePlan(plan);
  } catch (err) {
    stderr.write(`::error::${err.message}\n`);
    return 1;
  }
  stderr.write(
    flaky.length > 0
      ? `[matrix-plan] quarantine legs scheduled for flaky flows: ${flaky.join(', ')}\n`
      : '[matrix-plan] no flow tagged flaky — quarantine legs skipped\n'
  );
  const out = renderOutputs(plan);
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, out);
  else stdout.write(out);
  return 0;
}

if (isMain(import.meta.url)) {
  process.exit(main({ argv: process.argv, env: process.env, stdout: process.stdout, stderr: process.stderr }));
}
