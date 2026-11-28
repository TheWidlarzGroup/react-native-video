import { describe, expect, test } from 'bun:test';
import { decide, issueTitle, main, reconcile } from './nightly-issue.mjs';
import { fakeIo } from './test-helpers.mjs';

const ROW = 'e2e-android-rn0.87-api36-exclude-tags-flaky';
const TITLE = issueTitle(ROW);
const OURS = [{ id: 'L1', name: 'e2e-nightly', description: '', color: 'ededed' }];
const issue = (number, title = TITLE, labels = OURS) => ({ number, title, labels });

test('the title is the prefix plus the unmodified label', () => {
  expect(TITLE).toBe(`[e2e nightly] ${ROW}`);
});

test.each([
  ['fail', null, 'create'],
  ['fail', { number: 1 }, 'comment'],
  ['pass', { number: 1 }, 'close'],
  ['pass', null, 'noop'],
])('decide: %s with existing %o -> %s', (status, existing, action) => {
  expect(decide({ status, existing })).toBe(action);
});

describe('reconcile', () => {
  test('matches only the exact title, ignoring token-similar rows from the search', () => {
    const issues = [issue(1, issueTitle('e2e-android-rn0.87-api35-exclude-tags-flaky')), issue(2, `${TITLE}0`), issue(3)];
    expect(reconcile(issues, TITLE)).toEqual({ existing: issue(3), duplicates: [] });
  });

  test('finds nothing in an empty result or among near-matches', () => {
    expect(reconcile([], TITLE)).toEqual({ existing: null, duplicates: [] });
    expect(reconcile([issue(1, `${TITLE} `)], TITLE)).toEqual({ existing: null, duplicates: [] });
  });

  test('ignores a same-titled issue without the e2e-nightly label', () => {
    expect(reconcile([issue(7, TITLE, [])], TITLE)).toEqual({ existing: null, duplicates: [] });
    expect(reconcile([{ number: 7, title: TITLE }, issue(9)], TITLE)).toEqual({ existing: issue(9), duplicates: [] });
  });

  test('keeps the oldest of several matches and returns the rest as duplicates', () => {
    expect(reconcile([issue(42), issue(17), issue(99)], TITLE)).toEqual({
      existing: issue(17),
      duplicates: [issue(42), issue(99)],
    });
  });
});

describe('main', () => {
  // A fake `gh`: records every call, answers `issue list` with `open` (or the raw
  // `listOutput`), and throws for any call whose arguments start with one of `failing`.
  function fakeGh({ open = [], listOutput = JSON.stringify(open), failing = [] } = {}) {
    const calls = [];
    const run = (args) => {
      calls.push(args);
      if (failing.some((prefix) => prefix.every((arg, i) => args[i] === arg))) {
        throw new Error(`HTTP 403: ${args.slice(0, 3).join(' ')}`);
      }
      return args[1] === 'list' ? listOutput : '';
    };
    return { run, calls, mutations: () => calls.filter((args) => args[1] !== 'list') };
  }
  const call = (gh, status = 'fail', args = [ROW, status, 'https://example.com/run/1']) => {
    const fake = fakeIo();
    const code = main({ argv: ['node', 'nightly-issue.mjs', ...args], ...fake.io, run: gh.run });
    return { code, stdout: fake.stdout(), stderr: fake.stderr() };
  };

  test('searches open issues by title, scoped to the e2e-nightly label', () => {
    const gh = fakeGh();
    call(gh, 'pass');
    const [list] = gh.calls;
    expect(list.slice(0, 4)).toEqual(['issue', 'list', '--state', 'open']);
    expect(list[list.indexOf('--search') + 1]).toBe(`"${TITLE}" in:title`);
    expect(list[list.indexOf('--label') + 1]).toBe('e2e-nightly');
    expect(list[list.indexOf('--json') + 1].split(',')).toContain('labels');
  });

  test('a failing row without an issue creates one, labelled, linking the run', () => {
    const gh = fakeGh();
    const { code, stdout, stderr } = call(gh, 'fail');
    expect(code).toBe(0);
    expect(stdout).toBe(`[nightly-issue] ${ROW}: create\n`);
    expect(stderr).toBe('');
    const [create] = gh.mutations();
    expect(create.slice(0, 6)).toEqual(['issue', 'create', '--title', TITLE, '--label', 'e2e-nightly']);
    expect(create.at(-1)).toContain('Run: https://example.com/run/1');
  });

  test('a failing row with an issue comments on it', () => {
    const gh = fakeGh({ open: [issue(12)] });
    expect(call(gh, 'fail').stdout).toBe(`[nightly-issue] ${ROW}: comment\n`);
    expect(gh.mutations()).toEqual([['issue', 'comment', '12', '--body', 'Still failing. Run: https://example.com/run/1']]);
  });

  test('a green row closes its issue, and does nothing without one', () => {
    const withIssue = fakeGh({ open: [issue(12)] });
    expect(call(withIssue, 'pass').stdout).toBe(`[nightly-issue] ${ROW}: close\n`);
    expect(withIssue.mutations()).toEqual([['issue', 'close', '12', '--comment', 'Green again. Run: https://example.com/run/1']]);

    const withoutIssue = fakeGh();
    expect(call(withoutIssue, 'pass').stdout).toBe(`[nightly-issue] ${ROW}: noop\n`);
    expect(withoutIssue.mutations()).toEqual([]);
  });

  test('closes duplicates against the oldest issue before acting on it', () => {
    const gh = fakeGh({ open: [issue(42), issue(17)] });
    expect(call(gh, 'fail').code).toBe(0);
    expect(gh.mutations().map((args) => args.slice(0, 3))).toEqual([
      ['issue', 'close', '42'],
      ['issue', 'comment', '17'],
    ]);
    expect(gh.mutations()[0].at(-1)).toBe('Duplicate of #17 for the same matrix row; closing.');
  });

  test('a failed mutation fails the run and is never reported as done', () => {
    const { code, stdout, stderr } = call(fakeGh({ failing: [['issue', 'create']] }), 'fail');
    expect(code).toBe(1);
    expect(stdout).toBe('');
    expect(stderr).toBe(`[nightly-issue] ${ROW}: failed to create issue: HTTP 403: issue create --title\n`);
  });

  test('a failed duplicate close fails the run but still performs the main action', () => {
    const gh = fakeGh({ open: [issue(17), issue(42)], failing: [['issue', 'close', '42']] });
    const { code, stdout, stderr } = call(gh, 'fail');
    expect(code).toBe(1);
    expect(stderr).toContain('failed to close duplicate #42');
    expect(stdout).toBe(`[nightly-issue] ${ROW}: comment\n`);
  });

  test.each([
    ['a failing lookup', { failing: [['issue', 'list']] }],
    ['an unparseable lookup', { listOutput: 'not json' }],
  ])('%s degrades to "no issue yet"', (_, options) => {
    const { code, stdout, stderr } = call(fakeGh(options), 'fail');
    expect(code).toBe(0);
    expect(stdout).toBe(`[nightly-issue] ${ROW}: create\n`);
    expect(stderr).toContain('gh issue list failed');
  });

  test.each([
    ['no arguments', []],
    ['an unknown status', [ROW, 'failed', 'https://example.com/run/1']],
    ['no run URL', [ROW, 'fail']],
  ])('fails with usage and calls no gh given %s', (_, args) => {
    const gh = fakeGh({ open: [issue(12)] });
    const { code, stderr } = call(gh, undefined, args);
    expect(code).toBe(1);
    expect(stderr).toBe('usage: nightly-issue.mjs <label> <pass|fail> <run-url>\n');
    expect(gh.calls).toEqual([]);
  });
});
