// Opens exactly one issue per failing nightly matrix row, comments on it while the row keeps
// failing, and closes it when the row goes green. Uses the gh CLI with the workflow's
// GITHUB_TOKEN, so no external service is involved.
//
// Usage: nightly-issue.mjs <label> <pass|fail> <run-url>
import { execFileSync } from 'node:child_process';
import { runIfMain } from './is-main.mjs';

const PREFIX = '[e2e nightly]';
// Every issue this script owns carries this label; an issue without it is never touched.
const LABEL = 'e2e-nightly';
const STATUSES = ['pass', 'fail'];

// The label is the artifact name from the nightly workflow (e.g.
// "e2e-android-rn0.87-api36-exclude-tags-flaky"). Deduplication matches on the exact title,
// so it must not be reformatted.
export function issueTitle(label) {
  return `${PREFIX} ${label}`;
}

export function decide({ status, existing }) {
  if (status === 'fail') return existing ? 'comment' : 'create';
  return existing ? 'close' : 'noop';
}

// GitHub's issue search matches tokens, so it also returns neighbouring rows ("API 36" for
// "API 360"): only an exact title with our label is the same row. Two overlapping runs can
// both create the issue; the oldest is kept and the rest are returned for closing.
export function reconcile(issues, title) {
  const [existing = null, ...duplicates] = issues
    .filter((issue) => issue.title === title && (issue.labels ?? []).some(({ name }) => name === LABEL))
    .sort((a, b) => a.number - b.number);
  return { existing, duplicates };
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' });
}

// A failed lookup degrades to "no issue yet": at worst a duplicate is created and closed on
// the next run. Mutations are the report itself, so their failures are never swallowed.
function findExisting(run, title, stderr) {
  try {
    const out = run(['issue', 'list', '--state', 'open', '--search', `"${title}" in:title`,
      '--label', LABEL, '--json', 'number,title,labels', '--limit', '50']);
    return reconcile(JSON.parse(out), title);
  } catch (err) {
    stderr.write(`[nightly-issue] gh issue list failed: ${err.message}\n`);
    return { existing: null, duplicates: [] };
  }
}

export function main({ argv, stdout, stderr, run = gh }) {
  const [, , label, status, runUrl] = argv;
  if (!label || !STATUSES.includes(status) || !runUrl) {
    stderr.write('usage: nightly-issue.mjs <label> <pass|fail> <run-url>\n');
    return 1;
  }

  const title = issueTitle(label);
  const { existing, duplicates } = findExisting(run, title, stderr);
  let failed = false;

  for (const duplicate of duplicates) {
    try {
      run(['issue', 'close', String(duplicate.number), '--comment',
        `Duplicate of #${existing.number} for the same matrix row; closing.`]);
    } catch (err) {
      stderr.write(`[nightly-issue] ${label}: failed to close duplicate #${duplicate.number}: ${err.message}\n`);
      failed = true;
    }
  }

  const action = decide({ status, existing });
  try {
    if (action === 'create') {
      run(['issue', 'create', '--title', title, '--label', LABEL, '--body',
        `Nightly E2E is failing for **${label}**.\n\nRun: ${runUrl}\n\nThis issue is opened once per matrix row and closes automatically when the row goes green.`]);
    } else if (action === 'comment') {
      run(['issue', 'comment', String(existing.number), '--body', `Still failing. Run: ${runUrl}`]);
    } else if (action === 'close') {
      run(['issue', 'close', String(existing.number), '--comment', `Green again. Run: ${runUrl}`]);
    }
    stdout.write(`[nightly-issue] ${label}: ${action}\n`);
  } catch (err) {
    stderr.write(`[nightly-issue] ${label}: failed to ${action} issue: ${err.message}\n`);
    failed = true;
  }

  return failed ? 1 : 0;
}

runIfMain(import.meta.url, main);
