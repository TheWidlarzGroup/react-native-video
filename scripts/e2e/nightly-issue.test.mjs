import { test, expect } from 'bun:test';
import { issueTitle, decide, reconcile, runNightlyIssue } from './nightly-issue.mjs';

test('title is stable and identifies the matrix row', () => {
  expect(issueTitle('android · RN 0.87 · API 36')).toBe(
    '[e2e nightly] android · RN 0.87 · API 36'
  );
});

test('title does not prettify a machine-derived label', () => {
  // The label is the artifact directory name from the nightly workflow. It must pass
  // through untouched — reformatting it would break title-based deduplication the
  // next time the same row reports.
  const label = 'e2e-android-rn0.87-api36-exclude-tags-flaky';
  expect(issueTitle(label)).toBe(`[e2e nightly] ${label}`);
});

test('a failure with no open issue creates one', () => {
  expect(decide({ status: 'fail', existing: null })).toBe('create');
});

test('a repeat failure comments instead of duplicating', () => {
  expect(decide({ status: 'fail', existing: { number: 12 } })).toBe('comment');
});

test('a pass with an open issue closes it', () => {
  expect(decide({ status: 'pass', existing: { number: 12 } })).toBe('close');
});

test('a pass with no open issue does nothing', () => {
  expect(decide({ status: 'pass', existing: null })).toBe('noop');
});

test('decide covers all four status/existing combinations distinctly', () => {
  // A belt-and-braces check on top of the four tests above: assert the full truth
  // table in one place so swapping any two branches is immediately visible as a
  // duplicate entry in this set, not just a single failing assertion.
  const outcomes = new Set([
    decide({ status: 'fail', existing: null }),
    decide({ status: 'fail', existing: { number: 1 } }),
    decide({ status: 'pass', existing: { number: 1 } }),
    decide({ status: 'pass', existing: null }),
  ]);
  expect(outcomes).toEqual(new Set(['create', 'comment', 'close', 'noop']));
});

const TITLE = '[e2e nightly] android · RN 0.87 · API 36';

const LABEL = 'e2e-nightly';
const LABELS = [{ id: 'L1', name: LABEL, description: '', color: 'ededed' }];

test('reconcile ignores near-matches from a fuzzy search', () => {
  // GitHub's issue search is token-based, not exact. A search for this title can
  // return neighbouring rows that share most tokens but are not the same row.
  const issues = [
    { number: 1, title: '[e2e nightly] android · RN 0.87 · API 35', labels: LABELS },
    { number: 2, title: '[e2e nightly] android · RN 0.86 · API 36', labels: LABELS },
    { number: 3, title: TITLE, labels: LABELS },
  ];
  const { existing, duplicates } = reconcile(issues, TITLE);
  expect(existing).toEqual({ number: 3, title: TITLE, labels: LABELS });
  expect(duplicates).toEqual([]);
});

test('reconcile finds nothing when only near-matches exist', () => {
  const issues = [
    { number: 1, title: '[e2e nightly] android · RN 0.87 · API 35' },
    { number: 2, title: '[e2e nightly] ios · RN 0.87 · API 36' },
  ];
  const { existing, duplicates } = reconcile(issues, TITLE);
  expect(existing).toBeNull();
  expect(duplicates).toEqual([]);
});

test('reconcile treats an empty search result as no existing issue', () => {
  const { existing, duplicates } = reconcile([], TITLE);
  expect(existing).toBeNull();
  expect(duplicates).toEqual([]);
});

test('reconcile keeps the oldest issue and flags the rest as duplicates from a race', () => {
  // Two runs for the same row can both search before either has created its issue,
  // then both create — leaving two open issues with the identical title.
  const issues = [
    { number: 42, title: TITLE, labels: LABELS },
    { number: 17, title: TITLE, labels: LABELS },
    { number: 99, title: TITLE, labels: LABELS },
  ];
  const { existing, duplicates } = reconcile(issues, TITLE);
  expect(existing).toEqual({ number: 17, title: TITLE, labels: LABELS });
  expect(duplicates).toEqual([
    { number: 42, title: TITLE, labels: LABELS },
    { number: 99, title: TITLE, labels: LABELS },
  ]);
});

test('reconcile treats a single exact match as canonical with no duplicates', () => {
  const issues = [{ number: 5, title: TITLE, labels: LABELS }];
  const { existing, duplicates } = reconcile(issues, TITLE);
  expect(existing).toEqual({ number: 5, title: TITLE, labels: LABELS });
  expect(duplicates).toEqual([]);
});

test('reconcile leaves an exact-title issue untouched when it lacks the e2e-nightly label', () => {
  // A maintainer can open (or rename) an issue with this exact title by hand. Without the
  // label check, this script would comment on it as a "repeat failure" or auto-close it as
  // a duplicate — neither of which is this script's issue to manage.
  const issues = [{ number: 7, title: TITLE, labels: [] }];
  const { existing, duplicates } = reconcile(issues, TITLE);
  expect(existing).toBeNull();
  expect(duplicates).toEqual([]);
});

test('reconcile picks the labelled issue over an untagged same-title issue', () => {
  const issues = [
    { number: 7, title: TITLE, labels: [] },
    { number: 3, title: TITLE, labels: LABELS },
  ];
  const { existing, duplicates } = reconcile(issues, TITLE);
  expect(existing).toEqual({ number: 3, title: TITLE, labels: LABELS });
  expect(duplicates).toEqual([]);
});

// runNightlyIssue takes gh's `run(args) => stdout` as a plain function argument, so these
// tests drive the real create/comment/close/duplicate-close logic with a fake `run` instead
// of spawning a subprocess (bun test's subprocess spawns return EBADF under Bun 1.4.0).
function silenceConsole(fn) {
  const log = console.log;
  const error = console.error;
  const logs = [];
  const errors = [];
  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => errors.push(args.join(' '));
  try {
    const exitCode = fn();
    return { exitCode, logs, errors };
  } finally {
    console.log = log;
    console.error = error;
  }
}

test('runNightlyIssue reports success only when the mutation actually ran', () => {
  const calls = [];
  const run = (args) => {
    calls.push(args);
    if (args[0] === 'issue' && args[1] === 'list') return '[]';
    return '';
  };
  const { exitCode, logs, errors } = silenceConsole(() =>
    runNightlyIssue(run, 'android · RN 0.87 · API 36', 'fail', 'https://example.com/run/1')
  );
  expect(exitCode).toBe(0);
  expect(logs).toEqual(['[nightly-issue] android · RN 0.87 · API 36: create']);
  expect(errors).toEqual([]);
  expect(calls.some((args) => args[0] === 'issue' && args[1] === 'create')).toBe(true);
});

test('a failed mutation is reported loudly and never logged as a success', () => {
  // This is the critical case: if `gh issue create` fails (missing label, no issues:write
  // permission, ...), the script must not print the success line, and must fail the run —
  // reporting must not fail the run it reports on, but the reporter silently failing to
  // report is a different failure that must not be invisible.
  const run = (args) => {
    if (args[0] === 'issue' && args[1] === 'list') return '[]';
    if (args[0] === 'issue' && args[1] === 'create') {
      throw new Error("HTTP 404: 'e2e-nightly' not found");
    }
    return '';
  };
  const { exitCode, logs, errors } = silenceConsole(() =>
    runNightlyIssue(run, 'android · RN 0.87 · API 36', 'fail', 'https://example.com/run/1')
  );
  expect(exitCode).toBe(1);
  expect(logs).toEqual([]);
  expect(errors).toEqual([
    "[nightly-issue] android · RN 0.87 · API 36: failed to create issue: HTTP 404: 'e2e-nightly' not found",
  ]);
});

test('a failed duplicate close is reported loudly but does not block the primary action', () => {
  const issues = [
    { number: 17, title: issueTitle('android · RN 0.87 · API 36'), labels: LABELS },
    { number: 42, title: issueTitle('android · RN 0.87 · API 36'), labels: LABELS },
  ];
  const run = (args) => {
    if (args[0] === 'issue' && args[1] === 'list') return JSON.stringify(issues);
    if (args[0] === 'issue' && args[1] === 'close' && args[2] === '42') {
      throw new Error('HTTP 403: rate limited');
    }
    return '';
  };
  const { exitCode, logs, errors } = silenceConsole(() =>
    runNightlyIssue(run, 'android · RN 0.87 · API 36', 'fail', 'https://example.com/run/1')
  );
  expect(exitCode).toBe(1);
  expect(errors).toEqual([
    '[nightly-issue] android · RN 0.87 · API 36: failed to close duplicate #42: HTTP 403: rate limited',
  ]);
  // The primary action (commenting on the canonical issue #17) still ran and still reports,
  // because a duplicate-cleanup failure is unrelated to whether the main report succeeded.
  expect(logs).toEqual(['[nightly-issue] android · RN 0.87 · API 36: comment']);
});

test('findExisting scopes the gh issue list search to the e2e-nightly label', () => {
  // reconcile's label check only protects a decision made from whatever `gh issue list`
  // already returned. The `--label` filter and the `labels` field in `--json` are what
  // actually scope that real API call — drop either one and an untagged same-title issue
  // that ranks outside the (unfiltered, --limit 50) search window would simply never come
  // back for reconcile to filter. Capture the literal args passed to `run` for `issue list`
  // so a future edit that drops either piece fails this test instead of silently reopening
  // the gap.
  let listArgs = null;
  const run = (args) => {
    if (args[0] === 'issue' && args[1] === 'list') {
      listArgs = args;
      return '[]';
    }
    return '';
  };
  silenceConsole(() =>
    runNightlyIssue(run, 'android · RN 0.87 · API 36', 'pass', 'https://example.com/run/1')
  );
  expect(listArgs).not.toBeNull();
  const labelIndex = listArgs.indexOf('--label');
  expect(labelIndex).toBeGreaterThan(-1);
  expect(listArgs[labelIndex + 1]).toBe('e2e-nightly');
  const jsonIndex = listArgs.indexOf('--json');
  expect(jsonIndex).toBeGreaterThan(-1);
  expect(listArgs[jsonIndex + 1].split(',')).toContain('labels');
});

test('a failed read degrades to "no existing issue" instead of throwing', () => {
  const run = (args) => {
    if (args[0] === 'issue' && args[1] === 'list') {
      throw new Error('HTTP 500: something went wrong');
    }
    return '';
  };
  const { exitCode, logs } = silenceConsole(() =>
    runNightlyIssue(run, 'android · RN 0.87 · API 36', 'fail', 'https://example.com/run/1')
  );
  expect(exitCode).toBe(0);
  expect(logs).toEqual(['[nightly-issue] android · RN 0.87 · API 36: create']);
});
