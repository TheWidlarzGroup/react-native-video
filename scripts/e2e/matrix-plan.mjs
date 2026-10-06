// Builds the nightly matrix: every (RN version x device) row for both platforms, plus one
// quarantine leg per platform when at least one flow is tagged `flaky`, with the tag
// selection each row runs and the artifact name it uploads under. The nightly workflow
// passes both to the reusable legs and reads the expected-row list from the same objects,
// so what runs, where it uploads and what the report expects cannot drift apart.
//
// Usage: matrix-plan.mjs [flows-dir]   (writes to $GITHUB_OUTPUT, or stdout)
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runIfMain } from './is-main.mjs';
import { FLOOR } from './use-rn-version.mjs';

export const ANDROID_RN = [FLOOR, '0.82', '0.87'];
export const ANDROID_API = ['36', '35', '34'];
export const IOS_RN = [FLOOR, '0.82', '0.87'];
export const IOS_DEVICES = [
  { runner: 'macos-26', runtime: '26', sim: 'iPhone 17' },
  { runner: 'macos-15', runtime: '18', sim: 'iPhone 16' },
];
export const QUARANTINE_ANDROID = { rn: FLOOR, api: '36' };
export const QUARANTINE_IOS = { rn: FLOOR, runner: 'macos-26', runtime: '26' };

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

// Reads the flow's top-level `tags` key, inline (`tags: [smoke, flaky]`) or as a block list
// (`  - flaky`). Only Maestro's config section has top-level keys (the steps are a list),
// so a step, a nested key or a comment mentioning "flaky" never quarantines a flow.
export function hasFlakyTag(flowSource) {
  const isFlaky = (tag) => tag.trim().replace(/^(['"])(.*)\1$/, '$2') === 'flaky';
  const inline = /^tags:[ \t]*\[([^\]]*)\]/m.exec(flowSource);
  if (inline) return inline[1].split(',').some(isFlaky);
  // The indented lines under `tags:`, comment lines included.
  const block = /^tags:[ \t]*(?:#.*)?\n((?:[ \t]+[-#].*(?:\n|$))+)/m.exec(flowSource);
  if (!block) return false;
  return block[1]
    .split('\n')
    .map((line) => /^[ \t]+-(.*?)(?:\s+#.*)?$/.exec(line)?.[1])
    .some((item) => item !== undefined && isFlaky(item));
}

export function detectFlakyFlows(flowsDir) {
  return readdirSync(flowsDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .filter((name) => hasFlakyTag(readFileSync(join(flowsDir, name), 'utf8')))
    .sort();
}

export function buildPlan({ hasQuarantine }) {
  const androidRows = ANDROID_RN.flatMap((rn) =>
    ANDROID_API.map((api) => ({
      rn,
      'api-level': api,
      tags: COVERAGE_TAGS,
      'artifact-name': androidArtifactName(rn, api, COVERAGE_TAGS),
    }))
  );
  const iosRows = IOS_RN.flatMap((rn) =>
    IOS_DEVICES.map((device) => ({
      rn,
      runner: device.runner,
      'ios-runtime': device.runtime,
      'sim-device': device.sim,
      tags: COVERAGE_TAGS,
      'artifact-name': iosArtifactName(rn, device.runtime, COVERAGE_TAGS),
    }))
  );
  const quarantineAndroid = {
    'rn-version': QUARANTINE_ANDROID.rn,
    'api-level': QUARANTINE_ANDROID.api,
    tags: QUARANTINE_TAGS,
    'artifact-name': androidArtifactName(QUARANTINE_ANDROID.rn, QUARANTINE_ANDROID.api, QUARANTINE_TAGS),
  };
  const quarantineIos = {
    'rn-version': QUARANTINE_IOS.rn,
    runner: QUARANTINE_IOS.runner,
    'ios-runtime': QUARANTINE_IOS.runtime,
    tags: QUARANTINE_TAGS,
    'artifact-name': iosArtifactName(QUARANTINE_IOS.rn, QUARANTINE_IOS.runtime, QUARANTINE_TAGS),
  };
  const quarantineLabels = hasQuarantine
    ? [quarantineAndroid['artifact-name'], quarantineIos['artifact-name']]
    : [];

  return {
    'android-matrix': { include: androidRows },
    'ios-matrix': { include: iosRows },
    'has-quarantine': hasQuarantine,
    'quarantine-android': quarantineAndroid,
    'quarantine-ios': quarantineIos,
    'expected-labels': [
      ...androidRows.map((row) => row['artifact-name']),
      ...iosRows.map((row) => row['artifact-name']),
      ...quarantineLabels,
    ],
    'quarantine-labels': quarantineLabels,
  };
}

// Two rows uploading under the same artifact name make upload-artifact hard-error, and a
// row without one cannot be matched to its results.
export function validatePlan(plan) {
  const rows = [
    ...plan['android-matrix'].include,
    ...plan['ios-matrix'].include,
    plan['quarantine-android'],
    plan['quarantine-ios'],
  ];
  const unnamed = rows.find((row) => !row['artifact-name']);
  if (unnamed) {
    throw new Error(`a matrix row is missing artifact-name: ${JSON.stringify(unnamed)}`);
  }
  const labels = plan['expected-labels'];
  const duplicates = labels.filter((label, i) => labels.indexOf(label) !== i);
  if (duplicates.length > 0) {
    throw new Error(`duplicate artifact names: ${duplicates.join(', ')}`);
  }
}

export function renderOutputs(plan) {
  return `${Object.entries(plan)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('\n')}\n`;
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

runIfMain(import.meta.url, main);
