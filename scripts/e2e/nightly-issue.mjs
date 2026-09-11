// Opens exactly one issue per failing nightly matrix row, updates it on repeat failures,
// and closes it when the row goes green. Uses the gh CLI with the workflow's GITHUB_TOKEN
// so no external service is involved.
import { execFileSync } from 'node:child_process';

const PREFIX = '[e2e nightly]';

// Every issue this script owns carries this label. It is how `findExisting` scopes its
// search and how `reconcile` decides an exact-title match is actually ours (see below).
const LABEL = 'e2e-nightly';

// The label is the artifact directory name from the nightly workflow (e.g.
// "e2e-android-rn0.87-api36-exclude-tags-flaky"). It is machine-derived and stable,
// which is what makes title-based deduplication below work — do not prettify it.
export function issueTitle(label) {
  return `${PREFIX} ${label}`;
}

export function decide({ status, existing }) {
  if (status === 'fail') return existing ? 'comment' : 'create';
  return existing ? 'close' : 'noop';
}

function hasLabel(issue, label) {
  // gh's `--json labels` returns an array of {id, name, description, color} objects — match
  // that shape rather than guessing at others no caller here actually produces.
  return (issue.labels ?? []).some((entry) => entry.name === label);
}

// GitHub's issue search is fuzzy (token matching, not substring), so a search for
// this exact title can also return neighbouring matrix rows that merely share
// tokens — e.g. "API 36" vs "API 360", or a different RN version. Only an exact
// title match identifies the same row.
//
// An exact title match still isn't proof the issue is ours: a maintainer can open an
// issue by hand with that exact title, or rename an unrelated issue to it. Require the
// e2e-nightly label too, so a same-titled issue without it is left alone instead of being
// commented on or auto-closed as a duplicate.
//
// A race between two runs for the same row (a manual re-run overlapping the
// scheduled one, say) can also leave more than one open issue with the identical
// title, since both can run the search before either issue exists. Treat the
// oldest (lowest issue number) as canonical and report the rest as duplicates so
// the caller can close them, converging the row back to exactly one open issue.
export function reconcile(issues, title) {
  const matches = issues
    .filter((issue) => issue.title === title && hasLabel(issue, LABEL))
    .sort((a, b) => a.number - b.number);
  const [existing = null, ...duplicates] = matches;
  return { existing, duplicates };
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' });
}

// This script does two different kinds of gh call, and they must fail differently.
//
// The read (`issue list`, in findExisting below) is a lookup, not the report itself: if
// the search API blips, degrading to "no existing issue found" is safe — worst case we
// create a duplicate issue or skip a close, both of which self-heal or are harmless next
// run. ghSafe exists for exactly this call: log the failure and return a fallback instead
// of throwing.
//
// The mutations (`issue create`/`comment`/`close`) are the report. The nightly run itself
// already succeeded or failed before this script even started — the results are recorded
// in artifacts and the history file — so a failed mutation can't retroactively invalidate
// them, but it also must not be swallowed: nobody is watching this job, so a silently
// failed `create` means the failing row never gets an issue, forever, with the console
// insisting it did. Mutations therefore do NOT go through ghSafe; they run directly (see
// runNightlyIssue) so a thrown error is caught at the call site, logged with the row label,
// and turned into a non-zero exit instead of a fabricated success line.
function ghSafe(run, args, fallback) {
  try {
    return run(args);
  } catch (err) {
    console.error(`[nightly-issue] gh ${args[0]} ${args[1]} failed: ${err.message}`);
    return fallback;
  }
}

function findExisting(run, title) {
  const out = ghSafe(run, ['issue', 'list', '--state', 'open', '--search', `"${title}" in:title`,
    '--label', LABEL, '--json', 'number,title,labels', '--limit', '50'], '[]');
  let issues;
  try {
    issues = JSON.parse(out);
  } catch {
    issues = [];
  }
  return reconcile(issues, title);
}

// Drives one nightly-issue run against an injected `run(args) => stdout` function, so
// tests can exercise the full create/comment/close/duplicate-close flow — including a
// mutation that throws — without spawning a real `gh` subprocess. Returns the process
// exit code the caller should use: 0 if every gh call this run needed succeeded, 1 if any
// mutation failed.
export function runNightlyIssue(run, label, status, runUrl) {
  const title = issueTitle(label);
  // Look up once: a second call is another API round-trip and can disagree with the first.
  const { existing, duplicates } = findExisting(run, title);

  let failed = false;

  // Self-heal any duplicates left by a past race before deciding what to do next. This is
  // a mutation like the ones below: if it fails, say so and keep going rather than losing
  // the failure in a swallowed exception.
  for (const dup of duplicates) {
    try {
      run(['issue', 'close', String(dup.number), '--comment',
        `Duplicate of #${existing.number} for the same matrix row; closing.`]);
    } catch (err) {
      console.error(`[nightly-issue] ${label}: failed to close duplicate #${dup.number}: ${err.message}`);
      failed = true;
    }
  }

  const action = decide({ status, existing });

  try {
    if (action === 'create') {
      run(['issue', 'create', '--title', title, '--label', LABEL, '--body',
        `Nightly E2E is failing for **${label}**.\n\nRun: ${runUrl}\n\nThis issue is opened once per matrix row and closes automatically when the row goes green.`]);
    } else if (action === 'comment') {
      run(['issue', 'comment', String(existing.number), '--body',
        `Still failing. Run: ${runUrl}`]);
    } else if (action === 'close') {
      run(['issue', 'close', String(existing.number), '--comment',
        `Green again. Run: ${runUrl}`]);
    }
    // Only reached if the action above actually succeeded (or there was no action to take),
    // so this line is never printed for a mutation that failed.
    console.log(`[nightly-issue] ${label}: ${action}`);
  } catch (err) {
    console.error(`[nightly-issue] ${label}: failed to ${action} issue: ${err.message}`);
    failed = true;
  }

  return failed ? 1 : 0;
}

if (import.meta.main) {
  const [, , label, status, runUrl] = process.argv;
  if (!label || !status) {
    console.error('usage: nightly-issue.mjs <label> <pass|fail> <runUrl>');
    process.exit(1);
  }
  process.exit(runNightlyIssue(gh, label, status, runUrl));
}
