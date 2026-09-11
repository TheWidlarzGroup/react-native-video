import { test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildPlan,
  detectFlakyFlows,
  main,
  renderOutputs,
  slug,
  validatePlan,
} from './matrix-plan.mjs';

const FLOWS_DIR = new URL('../../e2e/flows', import.meta.url).pathname;

function tmpFlows(files) {
  const dir = mkdtempSync(join(tmpdir(), 'flows-'));
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

test('plan without quarantine has 15 rows and no quarantine labels', () => {
  const plan = buildPlan({ hasQuarantine: false });
  expect(() => validatePlan(plan)).not.toThrow();
  expect(plan['android-matrix'].include).toHaveLength(9);
  expect(plan['ios-matrix'].include).toHaveLength(6);
  expect(plan['expected-labels']).toHaveLength(15);
  expect(plan['quarantine-labels']).toEqual([]);
  expect(plan['has-quarantine']).toBe(false);
});

test('plan with quarantine adds exactly the two quarantine rows', () => {
  const plan = buildPlan({ hasQuarantine: true });
  expect(() => validatePlan(plan)).not.toThrow();
  expect(plan['expected-labels']).toHaveLength(17);
  expect(plan['quarantine-labels']).toEqual([
    'e2e-android-rn0.77-api36-include-tags-flaky',
    'e2e-ios-rn0.77-ios26-include-tags-flaky',
  ]);
  expect(plan['quarantine-android']['artifact-name']).toBe(plan['quarantine-labels'][0]);
  expect(plan['quarantine-ios']['artifact-name']).toBe(plan['quarantine-labels'][1]);
});

test('every row carries the artifact name the legs would derive on their own', () => {
  const plan = buildPlan({ hasQuarantine: true });
  for (const r of plan['android-matrix'].include) {
    expect(r['artifact-name']).toBe(`e2e-android-rn${r.rn}-api${r['api-level']}-exclude-tags-flaky`);
  }
  for (const r of plan['ios-matrix'].include) {
    expect(r['artifact-name']).toBe(`e2e-ios-rn${r.rn}-ios${r['ios-runtime']}-exclude-tags-flaky`);
    expect(r.runner).toMatch(/^macos-/);
    expect(r['sim-device']).toMatch(/^iPhone /);
  }
});

test('artifact names are unique across the whole night', () => {
  const plan = buildPlan({ hasQuarantine: true });
  const labels = plan['expected-labels'];
  expect(new Set(labels).size).toBe(labels.length);
});

test('validatePlan rejects a family of the wrong size', () => {
  const plan = buildPlan({ hasQuarantine: false });
  plan['android-matrix'].include.pop();
  expect(() => validatePlan(plan)).toThrow(/android 8 \(want 9\)/);
});

test('validatePlan rejects a quarantine flag that disagrees with the labels', () => {
  const plan = buildPlan({ hasQuarantine: true });
  plan['has-quarantine'] = false;
  expect(() => validatePlan(plan)).toThrow(/quarantine 2 \(want 0\)/);
});

test('validatePlan rejects a row without an artifact name', () => {
  const plan = buildPlan({ hasQuarantine: false });
  plan['ios-matrix'].include[0]['artifact-name'] = '';
  expect(() => validatePlan(plan)).toThrow(/missing artifact-name/);
});

test('validatePlan rejects duplicate artifact names', () => {
  const plan = buildPlan({ hasQuarantine: false });
  plan['expected-labels'][1] = plan['expected-labels'][0];
  expect(() => validatePlan(plan)).toThrow(/duplicate artifact names/);
});

test('detectFlakyFlows finds inline and block-list tags only', () => {
  const dir = tmpFlows({
    'a.yaml': 'appId: x\ntags: [smoke]\n---\n- launchApp\n',
    'b.yaml': 'appId: x\ntags: [smoke, flaky]\n---\n- launchApp\n',
    'c.yaml': 'appId: x\ntags:\n  - smoke\n  - flaky\n---\n- launchApp\n',
    'd.yaml': 'appId: x\ntags: [smoke]\n---\n# this flow used to be flaky\n- launchApp\n',
    'e.yaml': 'appId: x\ntags: [flakyish]\n---\n- launchApp\n',
    'notes.txt': 'tags: [flaky]\n',
  });
  try {
    expect(detectFlakyFlows(dir)).toEqual(['b.yaml', 'c.yaml']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the committed flows currently have no quarantined flow', () => {
  // If this starts failing on purpose, the nightly quarantine legs are now live —
  // update e2e/CI_MATRIX_DESIGN.md's row counts if that becomes the steady state.
  expect(detectFlakyFlows(FLOWS_DIR)).toEqual([]);
});

test('renderOutputs writes one GITHUB_OUTPUT line per key with JSON values', () => {
  const out = renderOutputs(buildPlan({ hasQuarantine: false }));
  const lines = out.trimEnd().split('\n');
  expect(lines).toHaveLength(7);
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    expect(key).toMatch(/^[a-z-]+$/);
    expect(() => JSON.parse(rest.join('='))).not.toThrow();
  }
  expect(lines.find((l) => l.startsWith('has-quarantine='))).toBe('has-quarantine=false');
});

test('main writes the plan to GITHUB_OUTPUT and reports quarantine on stderr', () => {
  const dir = tmpFlows({ 'x.yaml': 'tags: [smoke, flaky]\n---\n' });
  const outFile = join(dir, 'out.txt');
  writeFileSync(outFile, '');
  const stderr = [];
  try {
    const code = main({
      argv: ['node', 'matrix-plan.mjs', dir],
      env: { GITHUB_OUTPUT: outFile },
      stdout: { write: () => {} },
      stderr: { write: (s) => stderr.push(s) },
    });
    expect(code).toBe(0);
    expect(readFileSync(outFile, 'utf8')).toContain('has-quarantine=true');
    expect(stderr.join('')).toContain('x.yaml');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
