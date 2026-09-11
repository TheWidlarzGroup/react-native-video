// scripts/e2e/record-result.test.mjs
import { test, expect } from 'bun:test';
import { greenStreak, flowPassRate, main } from './record-result.mjs';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const records = [
  { label: 'a', failures: 0, cases: [{ name: 'f1', failed: false }] },
  { label: 'a', failures: 1, cases: [{ name: 'f1', failed: true }] },
  { label: 'a', failures: 0, cases: [{ name: 'f1', failed: false }] },
  { label: 'a', failures: 0, cases: [{ name: 'f1', failed: false }] },
  { label: 'b', failures: 1, cases: [{ name: 'f1', failed: true }] },
];

test('streak counts consecutive green runs from the newest backwards', () => {
  expect(greenStreak(records, 'a')).toBe(2);
});

test('streak is zero when the newest run failed', () => {
  expect(greenStreak(records, 'b')).toBe(0);
});

test('streak ignores other labels', () => {
  expect(greenStreak(records, 'missing')).toBe(0);
});

test('pass rate is computed per flow for one label', () => {
  expect(flowPassRate(records, 'a').get('f1')).toBeCloseTo(0.75, 5);
});

test('streak is zero for an empty history', () => {
  expect(greenStreak([], 'a')).toBe(0);
});

test('streak is not broken by a run for a different label interleaved between green runs', () => {
  // The row this label runs in is one of 17 in the matrix; other rows append their own
  // records to the same history file in between this label's runs. A foreign-label
  // record must be skipped, not treated as ending the streak (and must not itself
  // count towards it).
  const interleaved = [
    { label: 'a', failures: 0, cases: [] },
    { label: 'a', failures: 0, cases: [] },
    { label: 'other', failures: 0, cases: [] },
    { label: 'a', failures: 0, cases: [] },
  ];
  expect(greenStreak(interleaved, 'a')).toBe(3);
});

test('an older failure of the same label still ends the streak past an interleaved foreign label', () => {
  const interleaved = [
    { label: 'a', failures: 1, cases: [] },
    { label: 'other', failures: 0, cases: [] },
    { label: 'a', failures: 0, cases: [] },
  ];
  expect(greenStreak(interleaved, 'a')).toBe(1);
});

test('the streak is read from the newest end of the array, not the oldest', () => {
  // Guards the loop direction directly: reading front-to-back would stop at the
  // failing run in the middle and report 1 instead of 2.
  const ordered = [
    { label: 'a', failures: 0, cases: [] }, // oldest, green
    { label: 'a', failures: 1, cases: [] }, // a failure further back must not count
    { label: 'a', failures: 0, cases: [] },
    { label: 'a', failures: 0, cases: [] }, // newest
  ];
  expect(greenStreak(ordered, 'a')).toBe(2);
});

test('a single green record for a label is a streak of one, not zero', () => {
  // Boundary check on the increment itself: an off-by-one that only increments on a
  // second match would pass every test above but fail here.
  expect(greenStreak([{ label: 'solo', failures: 0, cases: [] }], 'solo')).toBe(1);
});

test('flowPassRate returns an empty map for a label with no records', () => {
  expect(flowPassRate(records, 'missing').size).toBe(0);
});

test('streak fails closed on a record with a missing `failures` field', () => {
  // A naive `if (r.failures > 0) break;` treats `undefined > 0` (false) as green, so a
  // malformed record would silently extend the streak. A record that does not positively
  // demonstrate `failures === 0` must end the streak instead: 0 here, not 1.
  expect(greenStreak([{ label: 'solo', cases: [] }], 'solo')).toBe(0);
});

test('streak fails closed on a record with a non-numeric `failures` field', () => {
  const malformed = [
    { label: 'a', failures: 0, cases: [] },
    { label: 'a', failures: null, cases: [] },
  ];
  // The malformed newest record must end the streak immediately: 0, not 1.
  expect(greenStreak(malformed, 'a')).toBe(0);
});

test('streak fails closed on `failures: NaN`', () => {
  // `typeof NaN` is "number", so a typeof-based guard lets NaN through and every
  // comparison against it is false — `NaN > 0` is false, so the record would read as
  // green. JSON.parse cannot produce NaN, so the history file can't carry one, but
  // greenStreak is exported and callers can pass in-memory records.
  expect(greenStreak([{ label: 'a', failures: NaN, cases: [] }], 'a')).toBe(0);
});

// --- CLI (integration) ---
// greenStreak/flowPassRate are exported and unit-tested above, but the two behaviours
// this task cares most about — what happens when the report file never showed up, and
// that one bad history line can't take the whole reporting step down — live in the CLI
// body (`readHistory`, the missing-report fallback), which isn't exported on its own.
//
// These tests call the exported `main()` in-process instead of spawning the script as a
// real subprocess. That's a deliberate workaround, not a style choice: under Bun 1.4.0,
// `bun test` returns EBADF for every subprocess spawn — both `node:child_process.spawnSync`
// and `Bun.spawnSync`, for any command — which is a bug in that bun version, not in this
// script (the same spawn works fine under `bun run`). Since `bun test` is what lefthook and
// CI actually run, a subprocess-based test would fail in exactly the environments that
// matter. `main({ argv, env, stdout, stderr })` takes its I/O as arguments for this reason,
// so the tests can inject a fake argv/env and capture the streams without touching a real
// process.

function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), 'record-result-test-'));
}

// Captures what `main` writes to a stream without touching the real stdout/stderr.
function makeStream() {
  const chunks = [];
  return {
    write: (chunk) => {
      chunks.push(chunk);
      return true;
    },
    get contents() {
      return chunks.join('');
    },
  };
}

function callMain(reportPath, label, historyPath, envOverrides = {}, rowKind) {
  const stdout = makeStream();
  const stderr = makeStream();
  const argv = ['bun', 'record-result.mjs', reportPath, label, historyPath];
  if (rowKind) argv.push(rowKind);
  const status = main({
    argv,
    env: envOverrides,
    stdout,
    stderr,
  });
  return { status, stdout: stdout.contents, stderr: stderr.contents };
}

test('CLI: a missing report file is recorded as a failing run, and breaks the streak', () => {
  // Deliberate design choice: the job died before Maestro ever ran (emulator boot
  // timeout, app install failure, etc). That is a real signal, not a data gap, so it
  // must count as a failure — never silently as green.
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'does-not-exist.xml');

  const result = callMain(reportPath, 'my-label', historyPath);

  expect(result.status).toBe(0);
  const lines = readFileSync(historyPath, 'utf8').trim().split('\n');
  expect(lines.length).toBe(1);
  const record = JSON.parse(lines[0]);
  expect(record.label).toBe('my-label');
  expect(record.total).toBe(0);
  expect(record.failures).toBe(1);
  expect(record.cases).toEqual([]);
  expect(result.stdout).toContain('consecutive green nightly runs: **0**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: reporting survives a missing report file without throwing', () => {
  // Reporting must never fail the run it reports on: a non-zero exit here would fail
  // the CI step and mask the real problem this record is supposed to surface.
  const dir = makeTmpDir();
  const result = callMain(
    join(dir, 'missing.xml'),
    'my-label',
    join(dir, 'history.jsonl')
  );
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a malformed history line is skipped, not fatal, and the streak still computes correctly', () => {
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'report.xml');
  writeFileSync(
    historyPath,
    '{"label":"my-label","failures":0,"cases":[]}\nthis line got truncated mid-write\n'
  );
  writeFileSync(
    reportPath,
    '<testsuites><testsuite><testcase name="f1"/></testsuite></testsuites>'
  );

  const result = callMain(reportPath, 'my-label', historyPath);

  expect(result.status).toBe(0);
  expect(result.stderr).toContain('skipping unparseable history line');
  // The prior valid green run plus this new green run: the bad line is skipped, not
  // counted as a break.
  expect(result.stdout).toContain('consecutive green nightly runs: **2**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: writes to GITHUB_STEP_SUMMARY when set, instead of stdout', () => {
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'report.xml');
  const summaryPath = join(dir, 'summary.md');
  writeFileSync(
    reportPath,
    '<testsuites><testsuite><testcase name="f1"/></testsuite></testsuites>'
  );
  writeFileSync(summaryPath, '');

  const result = callMain(reportPath, 'my-label', historyPath, { GITHUB_STEP_SUMMARY: summaryPath });

  expect(result.status).toBe(0);
  expect(result.stdout).not.toContain('consecutive green');
  expect(readFileSync(summaryPath, 'utf8')).toContain('consecutive green nightly runs: **1**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a truncated report (present but missing </testsuites>) is recorded as a failing run, and breaks the streak', () => {
  // A report file that exists but got cut off mid-write (e.g. the workflow's
  // `timeout-minutes` killing Maestro mid-run) must not be treated as a clean pass just
  // because every <testcase> that happened to close before the cut passed. Parsed naively
  // this report is `total: 1, failures: 0` and would extend the streak to 2; the
  // `isCompleteReport` check must record it as `failures: 1`, streak 0.
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'report.xml');
  // A prior green run for the same label, so a wrongly-green new record would read as a
  // streak of 2 instead of the correct 0.
  writeFileSync(historyPath, '{"label":"my-label","failures":0,"cases":[]}\n');
  // Missing the closing </testsuites> tag: one passing <testcase> closed before the cut.
  writeFileSync(
    reportPath,
    '<testsuites><testsuite><testcase name="f1"/>'
  );

  const result = callMain(reportPath, 'my-label', historyPath);

  expect(result.status).toBe(0);
  const lines = readFileSync(historyPath, 'utf8').trim().split('\n');
  expect(lines.length).toBe(2);
  const record = JSON.parse(lines[1]);
  expect(record.failures).toBe(1);
  expect(record.reason).toBe('incomplete-report');
  expect(result.stdout).toContain('consecutive green nightly runs: **0**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a well-formed report with zero test cases is recorded as a failing run, and breaks the streak', () => {
  // A syntactically complete report that matched zero flows (e.g. a tag-filter
  // misconfiguration) is not evidence anything passed. Parsed naively it is
  // `total: 0, failures: 0` and would extend the streak to 2; it must be recorded as
  // `failures: 1`, streak 0.
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'report.xml');
  writeFileSync(historyPath, '{"label":"my-label","failures":0,"cases":[]}\n');
  writeFileSync(reportPath, '<testsuites><testsuite></testsuite></testsuites>');

  const result = callMain(reportPath, 'my-label', historyPath);

  expect(result.status).toBe(0);
  const lines = readFileSync(historyPath, 'utf8').trim().split('\n');
  expect(lines.length).toBe(2);
  const record = JSON.parse(lines[1]);
  expect(record.total).toBe(0);
  expect(record.failures).toBe(1);
  expect(record.reason).toBe('no-cases');
  expect(result.stdout).toContain('consecutive green nightly runs: **0**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a quarantine row with zero test cases is recorded as PASSING, not failing', () => {
  // Zero flows tagged `flaky` today means the
  // quarantine leg matches zero cases on every run. That is the healthy "nothing is
  // quarantined" state, not a broken tag filter, so — ONLY when the caller passes the
  // explicit `quarantine` row-kind argument — this must be recorded as a passing run
  // (`failures: 0`) with a distinct reason, and must NOT break (or fail to extend) the
  // green streak.
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'report.xml');
  writeFileSync(historyPath, '{"label":"quarantine-label","failures":0,"cases":[]}\n');
  writeFileSync(reportPath, '<testsuites><testsuite></testsuite></testsuites>');

  const result = callMain(reportPath, 'quarantine-label', historyPath, {}, 'quarantine');

  expect(result.status).toBe(0);
  const lines = readFileSync(historyPath, 'utf8').trim().split('\n');
  expect(lines.length).toBe(2);
  const record = JSON.parse(lines[1]);
  expect(record.total).toBe(0);
  expect(record.failures).toBe(0);
  expect(record.reason).toBe('no-quarantined-flows');
  expect(result.stdout).toContain('consecutive green nightly runs: **2**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a coverage row with zero test cases still fails even when its label looks like a quarantine label', () => {
  // Hard constraint: the exemption must be reachable ONLY via the explicit row-kind
  // argument, never by anything the label string itself says. A label containing
  // "quarantine" or "flaky" text must NOT get the pass-through unless the caller also
  // passes the literal `quarantine` argument — proving the classification is not a
  // heuristic on `label`.
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'report.xml');
  writeFileSync(reportPath, '<testsuites><testsuite></testsuite></testsuites>');

  const result = callMain(reportPath, 'e2e-android-quarantine-flaky-lookalike', historyPath);

  const lines = readFileSync(historyPath, 'utf8').trim().split('\n');
  const record = JSON.parse(lines[0]);
  expect(record.failures).toBe(1);
  expect(record.reason).toBe('no-cases');
  expect(result.stdout).toContain('consecutive green nightly runs: **0**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a quarantine row with a missing report is still recorded as FAILING', () => {
  // Hard constraint: the exemption is for "no cases at all" (the report is well-formed
  // and simply matched nothing), not a blanket pass for anything labeled quarantine. A
  // quarantine leg that never produced a report at all (the job died before Maestro
  // ran) is real signal and must still fail.
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'does-not-exist.xml');

  const result = callMain(reportPath, 'quarantine-label', historyPath, {}, 'quarantine');

  const record = JSON.parse(readFileSync(historyPath, 'utf8').trim());
  expect(record.failures).toBe(1);
  expect(record.reason).toBe('missing-report');
  expect(result.stdout).toContain('consecutive green nightly runs: **0**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a quarantine row with an incomplete report is still recorded as FAILING', () => {
  // Same hard constraint as above, for the other fail-closed reason: a quarantine leg
  // that got cut off mid-run (e.g. by `timeout-minutes`) is not "no cases", it's an
  // incomplete run, and must still fail even though `rowKind` is 'quarantine'.
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'report.xml');
  writeFileSync(reportPath, '<testsuites><testsuite><testcase name="f1"/>');

  const result = callMain(reportPath, 'quarantine-label', historyPath, {}, 'quarantine');

  const record = JSON.parse(readFileSync(historyPath, 'utf8').trim());
  expect(record.failures).toBe(1);
  expect(record.reason).toBe('incomplete-report');
  expect(result.stdout).toContain('consecutive green nightly runs: **0**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a quarantine row that actually runs and fails a flaky-tagged flow is still recorded as FAILING', () => {
  // Hard constraint, most directly: the exemption is for zero cases, not for the
  // `quarantine` label. Once a flow IS tagged `flaky` and the quarantine leg picks it
  // up and it fails, that is a real result and must be reported as failing, with cases
  // recorded normally (not suppressed to `[]` the way the no-cases branches are).
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'report.xml');
  writeFileSync(
    reportPath,
    '<testsuites><testsuite><testcase name="smoke-flaky-thing"><failure message="boom"/></testcase></testsuite></testsuites>'
  );

  const result = callMain(reportPath, 'quarantine-label', historyPath, {}, 'quarantine');

  const record = JSON.parse(readFileSync(historyPath, 'utf8').trim());
  expect(record.total).toBe(1);
  expect(record.failures).toBe(1);
  expect(record.reason).toBeUndefined();
  expect(record.cases).toEqual([{ name: 'smoke-flaky-thing', failed: true }]);
  expect(result.stdout).toContain('consecutive green nightly runs: **0**');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a missing report file is recorded with reason "missing-report"', () => {
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'does-not-exist.xml');

  callMain(reportPath, 'my-label', historyPath);

  const record = JSON.parse(readFileSync(historyPath, 'utf8').trim());
  expect(record.reason).toBe('missing-report');

  rmSync(dir, { recursive: true, force: true });
});

test('CLI: appends one well-formed JSON line per invocation', () => {
  const dir = makeTmpDir();
  const historyPath = join(dir, 'history.jsonl');
  const reportPath = join(dir, 'report.xml');
  writeFileSync(
    reportPath,
    '<testsuites><testsuite>' +
      '<testcase name="f1"/>' +
      '<testcase name="f2"><failure message="boom"/></testcase>' +
      '</testsuite></testsuites>'
  );

  callMain(reportPath, 'my-label', historyPath);
  callMain(reportPath, 'my-label', historyPath);

  const lines = readFileSync(historyPath, 'utf8').trim().split('\n');
  expect(lines.length).toBe(2);
  for (const line of lines) {
    const record = JSON.parse(line);
    expect(record.label).toBe('my-label');
    expect(record.total).toBe(2);
    expect(record.failures).toBe(1);
    expect(record.cases).toEqual([
      { name: 'f1', failed: false },
      { name: 'f2', failed: true },
    ]);
    expect(typeof record.at).toBe('string');
  }

  rmSync(dir, { recursive: true, force: true });
});
