import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { classifyRun, greenStreak, main, REQUIRED_GREEN_STREAK } from './record-result.mjs';
import { fakeIo, useTmpDirs } from './test-helpers.mjs';

const tmpDir = useTmpDirs();

const green = (label) => ({ label, failures: 0, cases: [] });
const red = (label) => ({ label, failures: 1, cases: [] });

const COMPLETE_EMPTY = '<testsuites><testsuite></testsuite></testsuites>';
const TRUNCATED = '<testsuites><testsuite><testcase name="f1"/>';
const MIXED =
  '<testsuites><testsuite><testcase name="f1"/>' +
  '<testcase name="f2"><failure message="boom"/></testcase></testsuite></testsuites>';

describe('greenStreak', () => {
  test('counts consecutive green runs of the label, newest first', () => {
    expect(greenStreak([green('a'), red('a'), green('a'), green('a')], 'a')).toBe(2);
  });

  test('is zero for an empty history, an unknown label, or a failing newest run', () => {
    expect(greenStreak([], 'a')).toBe(0);
    expect(greenStreak([green('a')], 'b')).toBe(0);
    expect(greenStreak([green('a'), red('a')], 'a')).toBe(0);
  });

  test('a single green run is a streak of one', () => {
    expect(greenStreak([green('a')], 'a')).toBe(1);
  });

  test('runs of other labels in between neither break nor extend the streak', () => {
    expect(greenStreak([green('a'), red('b'), green('a'), green('b')], 'a')).toBe(2);
    expect(greenStreak([red('a'), green('b'), green('a')], 'a')).toBe(1);
  });

  test.each([
    ['missing', { label: 'a', cases: [] }],
    ['null', { label: 'a', failures: null, cases: [] }],
    ['a string', { label: 'a', failures: '0', cases: [] }],
    ['NaN', { label: 'a', failures: NaN, cases: [] }],
  ])('a record whose failures count is %s ends the streak', (_, malformed) => {
    expect(greenStreak([green('a'), malformed], 'a')).toBe(0);
  });
});

describe('classifyRun', () => {
  test('a complete report with cases is recorded as parsed', () => {
    const run = classifyRun({ reportExists: true, xml: MIXED, isQuarantine: false });
    expect(run.total).toBe(2);
    expect(run.failures).toBe(1);
    expect(run.reason).toBeUndefined();
  });

  test.each([
    ['a missing report', { reportExists: false, xml: '', isQuarantine: false }, 'missing-report'],
    ['a missing quarantine report', { reportExists: false, xml: '', isQuarantine: true }, 'missing-report'],
    // Parsed as-is this would be one passing case.
    ['a truncated report', { reportExists: true, xml: TRUNCATED, isQuarantine: false }, 'incomplete-report'],
    ['a truncated quarantine report', { reportExists: true, xml: TRUNCATED, isQuarantine: true }, 'incomplete-report'],
    ['a complete report with no cases', { reportExists: true, xml: COMPLETE_EMPTY, isQuarantine: false }, 'no-cases'],
  ])('%s fails, without cases', (_, run, reason) => {
    expect(classifyRun(run)).toEqual({ total: 0, failures: 1, cases: [], reason });
  });

  test('a quarantine row with no cases passes: nothing is tagged flaky', () => {
    expect(classifyRun({ reportExists: true, xml: COMPLETE_EMPTY, isQuarantine: true })).toEqual({
      total: 0,
      failures: 0,
      cases: [],
      reason: 'no-quarantined-flows',
    });
  });

  test('a quarantine row that ran a failing flow fails like any other row', () => {
    const run = classifyRun({ reportExists: true, xml: MIXED, isQuarantine: true });
    expect(run.failures).toBe(1);
    expect(run.reason).toBeUndefined();
  });
});

describe('main', () => {
  function setup({ report, history } = {}) {
    const dir = tmpDir();
    const reportPath = join(dir, 'report.xml');
    const historyPath = join(dir, 'history.jsonl');
    if (report !== undefined) writeFileSync(reportPath, report);
    if (history !== undefined) writeFileSync(historyPath, history);
    return { dir, reportPath, historyPath };
  }
  const readRecords = (path) =>
    readFileSync(path, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  const call = (args, env) => {
    const fake = fakeIo(env);
    const code = main({ argv: ['node', 'record-result.mjs', ...args], ...fake.io });
    return { code, stdout: fake.stdout(), stderr: fake.stderr() };
  };

  test('appends one record per call with the per-flow results', () => {
    const { reportPath, historyPath } = setup({ report: MIXED });
    expect(call([reportPath, 'row', historyPath]).code).toBe(0);
    expect(call([reportPath, 'row', historyPath]).code).toBe(0);

    const records = readRecords(historyPath);
    expect(records).toHaveLength(2);
    for (const record of records) {
      expect(record).toEqual({
        at: expect.any(String),
        label: 'row',
        total: 2,
        failures: 1,
        cases: [
          { name: 'f1', failed: false },
          { name: 'f2', failed: true },
        ],
      });
      expect(Number.isNaN(Date.parse(record.at))).toBe(false);
    }
  });

  test('records the reason for a run that is not evidence of green, and resets the streak', () => {
    const { reportPath, historyPath } = setup({ report: TRUNCATED, history: `${JSON.stringify(green('row'))}\n` });
    const { stdout } = call([reportPath, 'row', historyPath]);
    expect(readRecords(historyPath).at(-1)).toMatchObject({ failures: 1, reason: 'incomplete-report', cases: [] });
    expect(stdout).toBe(
      `\n**row** — consecutive green nightly runs: **0** (${REQUIRED_GREEN_STREAK} needed before this check may be marked required)\n`
    );
  });

  test('a missing report is recorded, not thrown', () => {
    const { reportPath, historyPath } = setup();
    const { code, stderr } = call([reportPath, 'row', historyPath]);
    expect(code).toBe(0);
    expect(stderr).toBe('');
    expect(readRecords(historyPath)).toMatchObject([{ failures: 1, reason: 'missing-report' }]);
  });

  test('the quarantine argument exempts a row with no cases; a lookalike label does not', () => {
    const { reportPath, historyPath } = setup({ report: COMPLETE_EMPTY });
    call([reportPath, 'quarantine-row', historyPath, 'quarantine']);
    call([reportPath, 'e2e-android-quarantine-flaky-lookalike', historyPath]);
    expect(readRecords(historyPath)).toMatchObject([
      { label: 'quarantine-row', failures: 0, reason: 'no-quarantined-flows' },
      { label: 'e2e-android-quarantine-flaky-lookalike', failures: 1, reason: 'no-cases' },
    ]);
  });

  test('skips an unparseable history line and still counts the streak', () => {
    const history = `${JSON.stringify(green('row'))}\nthis line got truncated mid-wr\n`;
    const { reportPath, historyPath } = setup({ report: '<testsuites><testsuite><testcase name="f1"/></testsuite></testsuites>', history });
    const { code, stdout, stderr } = call([reportPath, 'row', historyPath]);
    expect(code).toBe(0);
    expect(stderr).toBe('[record-result] skipping unparseable history line\n');
    expect(stdout).toContain('consecutive green nightly runs: **2**');
  });

  test('writes the streak to GITHUB_STEP_SUMMARY when set', () => {
    const { dir, reportPath, historyPath } = setup({ report: COMPLETE_EMPTY });
    const summary = join(dir, 'summary.md');
    const { stdout } = call([reportPath, 'row', historyPath], { GITHUB_STEP_SUMMARY: summary });
    expect(stdout).toBe('');
    expect(readFileSync(summary, 'utf8')).toContain('**row** — consecutive green nightly runs: **0**');
  });

  test.each([
    ['no arguments', []],
    ['no label', ['report.xml']],
    ['no history file', ['report.xml', 'row']],
    ['an unknown row kind', ['report.xml', 'row', 'history.jsonl', 'quarantined']],
  ])('fails with usage and writes nothing given %s', (_, args) => {
    const dir = tmpDir();
    const { code, stderr } = call(args.map((arg) => (arg.includes('.') ? join(dir, arg) : arg)));
    expect(code).toBe(1);
    expect(stderr).toContain('usage:');
    expect(existsSync(join(dir, 'history.jsonl'))).toBe(false);
  });
});
