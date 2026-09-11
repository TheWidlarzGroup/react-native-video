// Appends one JSON line per matrix row per nightly run. The workflow commits the file to
// an orphan `e2e-results` branch; this script only reads and writes it.
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { parseJUnit, isCompleteReport } from './junit-summary.mjs';
import { isMain } from './is-main.mjs';

export function greenStreak(records, label) {
  let streak = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i];
    if (r.label !== label) continue;
    // Fail closed on shape: a record whose `failures` isn't a finite number (missing,
    // null, NaN, written by some future/foreign format, etc.) has not positively
    // demonstrated a green run, so it ends the streak just like an explicit failure
    // would — it must never be free to extend a streak that gates promoting a check to
    // required. `Number.isFinite` rather than a `typeof` check because `typeof NaN` is
    // "number": JSON.parse can't produce NaN so the history file can't carry one, but
    // `greenStreak` is exported and takes in-memory records too, and a guard that reads
    // as "is this a usable number" should not have a hole shaped like the one value that
    // compares false against every threshold.
    if (!Number.isFinite(r.failures) || r.failures > 0) break;
    streak++;
  }
  return streak;
}

export function flowPassRate(records, label) {
  const totals = new Map();
  const passes = new Map();
  for (const r of records) {
    if (r.label !== label) continue;
    for (const c of r.cases) {
      totals.set(c.name, (totals.get(c.name) ?? 0) + 1);
      if (!c.failed) passes.set(c.name, (passes.get(c.name) ?? 0) + 1);
    }
  }
  const rates = new Map();
  for (const [name, total] of totals) rates.set(name, (passes.get(name) ?? 0) / total);
  return rates;
}

// `stderr` is injected (rather than calling `console.error` directly) so the CLI tests
// below can capture this warning in-process instead of spawning a subprocess to read it
// off the real stderr.
function readHistory(path, stderr) {
  if (!existsSync(path)) return [];
  // Skip unparseable lines rather than throwing: this file is appended to by every nightly
  // run, and one truncated write (e.g. a runner killed mid-`appendFileSync`) must not take
  // down all future reporting for every other label.
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        stderr.write('[record-result] skipping unparseable history line\n');
        return [];
      }
    });
}

// The CLI body takes its I/O as arguments rather than reading `process.*` directly, so
// the unit tests can drive it in-process and still exercise the real argv parsing,
// missing-report and malformed-history-line behaviour.
export function main({ argv, env, stdout, stderr }) {
  const [, , reportPath, label, historyFile, rowKind] = argv;
  // `rowKind` is an explicit, separate CLI argument — never inferred from `label` — so
  // that the quarantine exemption below is structurally reachable only when the caller
  // deliberately passes it, and can never fire by accident because a label happens to
  // contain a suggestive substring. The nightly workflow only ever puts 'quarantine'
  // here for the two rows matrix-plan itself built as the quarantine legs (matched
  // against its own `quarantine-labels` output, not by pattern-matching the label
  // text); every coverage-row invocation omits this argument entirely, so `isQuarantine`
  // is `false` for every coverage row no matter what its label string looks like.
  const isQuarantine = rowKind === 'quarantine';
  const reportExists = existsSync(reportPath);
  const xml = reportExists ? readFileSync(reportPath, 'utf8') : '';

  // Deliberate, fail-closed classification: there are three ways this run can fail to be
  // positive evidence of a green suite, and each is recorded as a failing run
  // (`failures: 1`, `cases: []`) so none of them can extend the streak that gates
  // promoting a check to required. `reason` distinguishes which one happened, purely so
  // the history can later explain *why* a night wasn't green — `greenStreak` itself never
  // looks at `reason`, only at `failures`, so it doesn't matter for streak math and old
  // history lines (written before this field existed) still read back correctly.
  //   - 'missing-report': the report file doesn't exist at all — the job died before
  //     Maestro ever produced output (e.g. emulator boot timeout, app failed to install).
  //     This applies to quarantine rows exactly the same as coverage rows: the leg never
  //     ran at all, which is never evidence of "nothing is quarantined".
  //   - 'incomplete-report': the file exists but is missing the closing `</testsuites>`
  //     tag — the realistic cause is the workflow's `timeout-minutes` killing Maestro
  //     mid-run. Whatever `<testcase>` elements happened to close before the cut are not
  //     reliable evidence of a full run (the flows that never got to close are simply
  //     missing from the count), so this is forced to a failure even if every case that
  //     *did* close passed — otherwise the streak would climb on a night the suite never
  //     finished. Also applies unchanged to quarantine rows: a quarantine leg that DID
  //     match flaky-tagged flows but got cut off mid-run is not "no cases", it's an
  //     incomplete run of real cases, and must still fail.
  //   - 'no-cases': the report is complete and well-formed but matched zero test cases
  //     (e.g. a tag-filter misconfiguration matched no flows for this label). A report
  //     with no flows in it is not evidence anything passed, so for a COVERAGE row it
  //     can't count as green. A QUARANTINE row is the one exception: it selects flows
  //     tagged `flaky`, so zero matched cases means zero flows are quarantined, which is
  //     the healthy state. (The nightly workflow only schedules quarantine legs when at
  //     least one flow carries the tag, because Maestro refuses to run a tag filter that
  //     matches nothing, so in practice this branch is defence in depth.) The exemption
  //     is reachable only through the `isQuarantine` flag above.
  // In every one of these cases we don't know which flows would have run, so `cases` is
  // left empty: the run intentionally does not count against (or for) any individual
  // flow's per-flow pass rate in `flowPassRate` — only against the overall streak.
  let parsed;
  let reason;
  if (!reportExists) {
    parsed = { total: 0, failures: 1, cases: [] };
    reason = 'missing-report';
  } else if (!isCompleteReport(xml)) {
    parsed = { total: 0, failures: 1, cases: [] };
    reason = 'incomplete-report';
  } else {
    const complete = parseJUnit(xml);
    if (complete.total === 0 && isQuarantine) {
      parsed = { total: 0, failures: 0, cases: [] };
      reason = 'no-quarantined-flows';
    } else if (complete.total === 0) {
      parsed = { total: 0, failures: 1, cases: [] };
      reason = 'no-cases';
    } else {
      parsed = complete;
    }
  }
  const record = {
    at: new Date().toISOString(),
    label,
    total: parsed.total,
    failures: parsed.failures,
    cases: parsed.cases.map(({ name, failed }) => ({ name, failed })),
    ...(reason ? { reason } : {}),
  };
  appendFileSync(historyFile, `${JSON.stringify(record)}\n`);

  const history = readHistory(historyFile, stderr);
  const streak = greenStreak(history, label);
  const summary = env.GITHUB_STEP_SUMMARY;
  const line = `\n**${label}** — consecutive green nightly runs: **${streak}** (15 needed before this check may be marked required)\n`;
  if (summary) appendFileSync(summary, line);
  else stdout.write(line);

  return 0;
}

if (isMain(import.meta.url)) {
  process.exit(
    main({ argv: process.argv, env: process.env, stdout: process.stdout, stderr: process.stderr })
  );
}
