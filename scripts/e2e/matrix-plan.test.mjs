import { describe, expect, test } from 'bun:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ANDROID_API,
  ANDROID_RN,
  buildPlan,
  COVERAGE_TAGS,
  detectFlakyFlows,
  hasFlakyTag,
  IOS_DEVICES,
  IOS_RN,
  main,
  QUARANTINE_TAGS,
  renderOutputs,
  slug,
  validatePlan,
} from './matrix-plan.mjs';
import { fakeIo, useTmpDirs } from './test-helpers.mjs';
import { FLOOR } from './use-rn-version.mjs';

const tmpDir = useTmpDirs();
const FLOWS_DIR = new URL('../../e2e/flows', import.meta.url).pathname;

function flowsDir(files) {
  const dir = tmpDir();
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
}

test('slug matches the reusable workflows sed derivation', () => {
  // _e2e-android.yml / _e2e-ios.yml: sed -E 's/[^A-Za-z0-9]+/-/g; s/^-+|-+$//g'
  expect(slug('--exclude-tags=flaky')).toBe('exclude-tags-flaky');
  expect(slug('--include-tags=flaky')).toBe('include-tags-flaky');
  expect(slug('--include-tags=a,b --exclude-tags=c')).toBe('include-tags-a-b-exclude-tags-c');
  expect(slug('---')).toBe('');
});

describe('buildPlan', () => {
  test('has one coverage row per RN version and device, and no quarantine without flaky flows', () => {
    const plan = buildPlan({ hasQuarantine: false });
    expect(plan['android-matrix'].include).toHaveLength(ANDROID_RN.length * ANDROID_API.length);
    expect(plan['ios-matrix'].include).toHaveLength(IOS_RN.length * IOS_DEVICES.length);
    expect(plan['expected-labels']).toHaveLength(15);
    expect(plan['quarantine-labels']).toEqual([]);
    expect(plan['has-quarantine']).toBe(false);
  });

  test('adds exactly the two quarantine rows, on the floor RN version', () => {
    const plan = buildPlan({ hasQuarantine: true });
    expect(plan['expected-labels']).toHaveLength(17);
    expect(plan['quarantine-labels']).toEqual([
      `e2e-android-rn${FLOOR}-api36-include-tags-flaky`,
      `e2e-ios-rn${FLOOR}-ios26-include-tags-flaky`,
    ]);
    expect(plan['quarantine-android']['artifact-name']).toBe(plan['quarantine-labels'][0]);
    expect(plan['quarantine-ios']['artifact-name']).toBe(plan['quarantine-labels'][1]);
  });

  test('every row runs its tag selection and uploads under the name the legs derive from it', () => {
    const plan = buildPlan({ hasQuarantine: true });
    for (const row of plan['android-matrix'].include) {
      expect(row.tags).toBe(COVERAGE_TAGS);
      expect(row['artifact-name']).toBe(`e2e-android-rn${row.rn}-api${row['api-level']}-${slug(row.tags)}`);
    }
    for (const row of plan['ios-matrix'].include) {
      expect(row.tags).toBe(COVERAGE_TAGS);
      expect(row['artifact-name']).toBe(`e2e-ios-rn${row.rn}-ios${row['ios-runtime']}-${slug(row.tags)}`);
      expect(row.runner).toMatch(/^macos-/);
      expect(row['sim-device']).toMatch(/^iPhone /);
    }
    const android = plan['quarantine-android'];
    const ios = plan['quarantine-ios'];
    expect(android.tags).toBe(QUARANTINE_TAGS);
    expect(android['artifact-name']).toBe(`e2e-android-rn${android['rn-version']}-api${android['api-level']}-${slug(android.tags)}`);
    expect(ios.tags).toBe(QUARANTINE_TAGS);
    expect(ios['artifact-name']).toBe(`e2e-ios-rn${ios['rn-version']}-ios${ios['ios-runtime']}-${slug(ios.tags)}`);
  });

  test('passes validation with and without quarantine', () => {
    expect(() => validatePlan(buildPlan({ hasQuarantine: false }))).not.toThrow();
    expect(() => validatePlan(buildPlan({ hasQuarantine: true }))).not.toThrow();
  });
});

describe('validatePlan', () => {
  test('rejects a row without an artifact name', () => {
    const plan = buildPlan({ hasQuarantine: false });
    plan['ios-matrix'].include[0]['artifact-name'] = '';
    expect(() => validatePlan(plan)).toThrow(/missing artifact-name/);
  });

  test('rejects a quarantine row without an artifact name', () => {
    const plan = buildPlan({ hasQuarantine: true });
    delete plan['quarantine-android']['artifact-name'];
    expect(() => validatePlan(plan)).toThrow(/missing artifact-name/);
  });

  test('rejects duplicate artifact names and names them', () => {
    const plan = buildPlan({ hasQuarantine: false });
    plan['expected-labels'][1] = plan['expected-labels'][0];
    expect(() => validatePlan(plan)).toThrow(`duplicate artifact names: ${plan['expected-labels'][0]}`);
  });
});

describe('flaky tag detection', () => {
  test.each([
    ['inline list', 'appId: x\ntags: [smoke, flaky]\n---\n- launchApp\n', true],
    ['inline list, only tag', 'appId: x\ntags: [flaky]\n---\n', true],
    ['block list', 'appId: x\ntags:\n  - smoke\n  - flaky\n---\n- launchApp\n', true],
    ['block list with comments', 'appId: x\ntags: # quarantine\n  # temporarily\n  - flaky # see #123\n---\n', true],
    ['quoted tags', 'appId: x\ntags: [smoke, "flaky"]\n---\n', true],
    ['quoted block item', "appId: x\ntags:\n  - 'flaky'\n---\n", true],
    ['inline list over several lines', 'appId: x\ntags: [\n  smoke,\n  flaky\n]\n---\n', true],
    ['config without a --- separator', 'appId: x\ntags: [flaky]\n', true],
    ['no flaky tag', 'appId: x\ntags: [smoke]\n---\n- launchApp\n', false],
    ['a tag that only starts with flaky', 'appId: x\ntags: [flakyish]\n---\n', false],
    ['flaky in a comment on the tags line', 'appId: x\ntags: [smoke] # was flaky\n---\n', false],
    ['flaky in a commented-out block item', 'appId: x\ntags:\n  - smoke\n  # - flaky\n---\n', false],
    ['flaky in a comment after the config', 'appId: x\ntags: [smoke]\n---\n# this flow used to be flaky\n', false],
    ['a "- flaky" line among the steps', 'appId: x\ntags: [smoke]\n---\n- runFlow:\n    tags:\n    - flaky\n', false],
    ['a list item outside tags', 'appId: x\nenv:\n  - flaky\ntags: [smoke]\n---\n', false],
    ['a list item under the key after tags', 'appId: x\ntags:\n  - smoke\nenv:\n  - flaky\n---\n', false],
    ['an indented tags key', 'appId: x\n---\n- runFlow:\n  tags: [flaky]\n', false],
  ])('%s', (_, source, expected) => {
    expect(hasFlakyTag(source)).toBe(expected);
  });

  test('detectFlakyFlows scans only YAML files and sorts the result', () => {
    const dir = flowsDir({
      'b.yaml': 'tags: [flaky]\n---\n',
      'a.yml': 'tags:\n  - flaky\n---\n',
      'c.yaml': 'tags: [smoke]\n---\n',
      'notes.txt': 'tags: [flaky]\n',
    });
    expect(detectFlakyFlows(dir)).toEqual(['a.yml', 'b.yaml']);
  });

  test('no committed flow is quarantined', () => {
    // If this starts failing on purpose, the nightly quarantine legs are live — update
    // e2e/CI_MATRIX_DESIGN.md's row counts if that becomes the steady state.
    expect(detectFlakyFlows(FLOWS_DIR)).toEqual([]);
  });
});

test('renderOutputs writes one GITHUB_OUTPUT line per key with a JSON value', () => {
  const plan = buildPlan({ hasQuarantine: false });
  const lines = renderOutputs(plan).trimEnd().split('\n');
  expect(lines.map((line) => line.split('=')[0])).toEqual(Object.keys(plan));
  for (const line of lines) {
    const [key, ...value] = line.split('=');
    expect(JSON.parse(value.join('='))).toEqual(plan[key]);
  }
});

describe('main', () => {
  test('writes the plan to GITHUB_OUTPUT and names the flaky flows on stderr', () => {
    const dir = flowsDir({ 'x.yaml': 'tags: [smoke, flaky]\n---\n' });
    const output = join(dir, 'out.txt');
    writeFileSync(output, '');
    const { io, stdout, stderr } = fakeIo({ GITHUB_OUTPUT: output });

    expect(main({ argv: ['node', 'matrix-plan.mjs', dir], ...io })).toBe(0);
    expect(readFileSync(output, 'utf8')).toBe(renderOutputs(buildPlan({ hasQuarantine: true })));
    expect(stdout()).toBe('');
    expect(stderr()).toBe('[matrix-plan] quarantine legs scheduled for flaky flows: x.yaml\n');
  });

  test('writes to stdout without GITHUB_OUTPUT', () => {
    const { io, stdout, stderr } = fakeIo();
    expect(main({ argv: ['node', 'matrix-plan.mjs', flowsDir({ 'a.yaml': 'tags: [smoke]\n---\n' })], ...io })).toBe(0);
    expect(stdout()).toBe(renderOutputs(buildPlan({ hasQuarantine: false })));
    expect(stderr()).toContain('no flow tagged flaky');
  });
});
