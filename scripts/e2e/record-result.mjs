// Appends one JSON line per matrix row per nightly run to the history file and reports the
// row's consecutive-green streak. The workflow commits the file to the orphan
// `e2e-results` branch; this script only reads and writes it.
//
// Usage: record-result.mjs <report.xml> <label> <history.jsonl> [quarantine]
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { runIfMain } from './is-main.mjs';
import { isCompleteReport, parseJUnit } from './junit-summary.mjs';

// Consecutive green nights a row needs before its check may be marked required.
export const REQUIRED_GREEN_STREAK = 15;

export function greenStreak(records, label) {
  let streak = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i];
    if (record.label !== label) continue;
    // Fail closed: a record without a usable `failures` count has not shown a green run.
    if (!Number.isFinite(record.failures) || record.failures > 0) break;
    streak++;
  }
  return streak;
}

// One truncated line (a runner killed mid-append) must not break reporting for every row.
function readHistory(path, stderr) {
  if (!existsSync(path)) return [];
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

// A run that is not positive evidence of a green suite is recorded as failing, with the
// reason, and without cases (it is unknown which flows would have run). The one exception
// is a quarantine row with no cases: nothing is tagged flaky, which is the healthy state.
// Quarantine is an explicit argument, never inferred from the label text.
export function classifyRun({ reportExists, xml, isQuarantine }) {
  const failing = (reason) => ({ total: 0, failures: 1, cases: [], reason });
  if (!reportExists) return failing('missing-report');
  if (!isCompleteReport(xml)) return failing('incomplete-report');
  const parsed = parseJUnit(xml);
  if (parsed.total > 0) return parsed;
  return isQuarantine
    ? { total: 0, failures: 0, cases: [], reason: 'no-quarantined-flows' }
    : failing('no-cases');
}

export function main({ argv, env, stdout, stderr }) {
  const [, , reportPath, label, historyFile, rowKind] = argv;
  if (!reportPath || !label || !historyFile || (rowKind !== undefined && rowKind !== 'quarantine')) {
    stderr.write('usage: record-result.mjs <report.xml> <label> <history.jsonl> [quarantine]\n');
    return 1;
  }

  const reportExists = existsSync(reportPath);
  const run = classifyRun({
    reportExists,
    xml: reportExists ? readFileSync(reportPath, 'utf8') : '',
    isQuarantine: rowKind === 'quarantine',
  });
  const record = {
    at: new Date().toISOString(),
    label,
    total: run.total,
    failures: run.failures,
    cases: run.cases.map(({ name, failed }) => ({ name, failed })),
    ...(run.reason ? { reason: run.reason } : {}),
  };
  appendFileSync(historyFile, `${JSON.stringify(record)}\n`);

  const streak = greenStreak(readHistory(historyFile, stderr), label);
  const line = `\n**${label}** — consecutive green nightly runs: **${streak}** (${REQUIRED_GREEN_STREAK} needed before this check may be marked required)\n`;
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, line);
  else stdout.write(line);
  return 0;
}

runIfMain(import.meta.url, main);
