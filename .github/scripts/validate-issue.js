// Deterministic issue validator + labeler for react-native-video bug reports.
// Pure helpers (parsing, label computation) are exported for local testing;
// handleIssue() does the GitHub IO. No marketing/Issue Boost here on purpose -
// that is handled by the separate AI routine.

const PLATFORM = {
  'iOS': 'Platform: iOS',
  'Android': 'Platform: Android',
  'Web': 'Platform: Web',
  'visionOS': 'Platform: visionOS',
  'Apple tvOS': 'Platform: tvOS',
  'Android TV': 'Platform: Android TV',
  'Windows': 'Platform: Windows',
};

// Labels this bot owns: cleared and recomputed on every run.
const BOT_LABELS = [
  'Repro Provided',
  'Missing Repro',
  'Newer Version Available',
  'V5',
  'V6',
  'V7',
  ...Object.values(PLATFORM),
];

const SKIP_LABEL = 'No Validation';
const BOT_MARK = '<!-- rnv-triage-bot -->';

const isEmpty = (v) => !v || v === '_No response_';

// Parse the "### Header\n value" sections produced by GitHub issue forms.
function parseSections(body) {
  const sections = {};
  let header = null;
  for (const line of String(body || '').split(/\r?\n/)) {
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) { header = m[1].trim(); sections[header] = ''; continue; }
    if (header != null) sections[header] += line + '\n';
  }
  for (const k of Object.keys(sections)) sections[k] = sections[k].trim();
  return sections;
}

// A reproduction is "provided" only when the field contains a real http(s) URL.
function isReproUrl(v) {
  if (isEmpty(v)) return false;
  return /\bhttps?:\/\/[^\s)]+/i.test(v);
}

// Extract the first x.y.z from a version string (ignores a leading v and any
// prerelease suffix). Returns [major, minor, patch] or null.
function parseVersionTuple(v) {
  const m = String(v || '').match(/v?(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function cmpTuple(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

// Compute the desired bot labels + actions from parsed sections.
// latestVersion: npm "latest" version string, or null if unknown.
function computeTriage(sections, latestVersion) {
  const get = (h) => (sections[h] || '').trim();
  const labels = new Set();
  let isV5 = false;
  let outdated = null;

  // Platforms -> Platform: * labels
  const plat = get('Platforms');
  if (!isEmpty(plat)) {
    for (const p of plat.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)) {
      if (PLATFORM[p]) labels.add(PLATFORM[p]);
    }
  }

  // Reproduction repository -> Repro Provided / Missing Repro
  labels.add(isReproUrl(get('Reproduction repository')) ? 'Repro Provided' : 'Missing Repro');

  // react-native-video version -> V5/V6/V7 (+ outdated check for v6/v7)
  const verRaw = get('react-native-video version');
  const tuple = parseVersionTuple(verRaw);
  if (tuple) {
    const maj = tuple[0];
    if (maj === 5) {
      labels.add('V5');
      isV5 = true;
    } else {
      if (maj === 6) labels.add('V6');
      else if (maj === 7) labels.add('V7');
      const latestTuple = latestVersion ? parseVersionTuple(latestVersion) : null;
      if (latestTuple && cmpTuple(tuple, latestTuple) < 0) {
        labels.add('Newer Version Available');
        outdated = { from: verRaw, to: latestVersion };
      }
    }
  }

  return { labels, isV5, outdated };
}

// Remove the Prerequisites checkboxes section from the rendered issue body.
// Returns the new body, or null if there was nothing to strip.
function tidyBody(body) {
  const blocks = [];
  let blk = null;
  for (const line of String(body || '').split(/\r?\n/)) {
    if (/^###\s+/.test(line)) { blk = { head: line.replace(/^###\s+/, '').trim(), lines: [line] }; blocks.push(blk); }
    else if (blk) blk.lines.push(line);
  }
  const kept = blocks.filter((b) => b.head.toLowerCase() !== 'prerequisites');
  if (kept.length === blocks.length) return null;
  return kept.map((b) => b.lines.join('\n').replace(/\s+$/, '')).join('\n\n') + '\n';
}

async function fetchLatestVersion() {
  try {
    const res = await fetch('https://registry.npmjs.org/react-native-video/latest');
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.version ? data.version : null;
  } catch (e) {
    console.error('npm latest fetch failed:', e && e.message);
    return null;
  }
}

async function hidePreviousBotComments({ github, context }) {
  const { owner, repo } = context.repo;
  const number = context.payload.issue.number;
  const comments = await github.rest.issues.listComments({ owner, repo, issue_number: number });
  const ours = comments.data.filter((c) => c.body && c.body.includes(BOT_MARK) && !c.body.includes('<summary>Previous bot comment'));
  for (const c of ours) {
    const hidden = `<details>\n<summary>Previous bot comment (click to expand)</summary>\n\n${c.body}\n\n</details>`;
    await github.rest.issues.updateComment({ owner, repo, comment_id: c.id, body: hidden });
  }
}

async function comment({ github, context, body }) {
  const { owner, repo } = context.repo;
  await hidePreviousBotComments({ github, context });
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: context.payload.issue.number,
    body: `${body}\n\n${BOT_MARK}`,
  });
}

async function handleIssue({ github, context }) {
  const { owner, repo } = context.repo;
  const issue = context.payload.issue;
  if (!issue) return;
  const number = issue.number;
  const body = issue.body || '';

  const sections = parseSections(body);
  // Only act on our bug-report form.
  if (!('Platforms' in sections) && !('react-native-video version' in sections)) return;

  const existing = (issue.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
  if (existing.includes(SKIP_LABEL)) {
    console.log('No Validation label present -> skipping');
    return;
  }

  const latestVersion = await fetchLatestVersion();
  const { labels: desired, isV5, outdated } = computeTriage(sections, latestVersion);

  // Reconcile: keep non-bot labels, set bot labels to the freshly computed set.
  const keep = existing.filter((l) => !BOT_LABELS.includes(l));
  const finalLabels = Array.from(new Set([...keep, ...desired]));
  const changed =
    finalLabels.length !== existing.length ||
    finalLabels.some((l) => !existing.includes(l)) ||
    existing.some((l) => !finalLabels.includes(l));
  if (changed) {
    await github.rest.issues.setLabels({ owner, repo, issue_number: number, labels: finalLabels });
  }

  // Strip the Prerequisites section from the created issue.
  const tidied = tidyBody(body);
  if (tidied && tidied !== body) {
    await github.rest.issues.update({ owner, repo, issue_number: number, body: tidied });
  }

  // Outdated version: nudge to retest on the latest (skip for v5, which is closed below).
  if (outdated && !isV5 && !existing.includes('Newer Version Available')) {
    await comment({
      github,
      context,
      body:
        `Heads up: you reported **${outdated.from}**, but the latest react-native-video is **${outdated.to}**. ` +
        `Please retest on the latest version and update the report if the issue persists - many problems are already fixed there.`,
    });
  }

  // v5 is unsupported: comment + close as not planned (only once).
  if (isV5 && issue.state === 'open' && !existing.includes('V5')) {
    await comment({
      github,
      context,
      body: [
        'Thanks for the report - but **react-native-video v5 and older are no longer maintained**.',
        '',
        'Please upgrade to **v6 or v7**, where we actively fix issues.',
        '',
        'Closing as not planned - feel free to re-open on a supported version.',
      ].join('\n'),
    });
    await github.rest.issues.update({ owner, repo, issue_number: number, state: 'closed', state_reason: 'not_planned' });
  }
}

module.exports = handleIssue;
module.exports.parseSections = parseSections;
module.exports.isReproUrl = isReproUrl;
module.exports.parseVersionTuple = parseVersionTuple;
module.exports.cmpTuple = cmpTuple;
module.exports.computeTriage = computeTriage;
module.exports.tidyBody = tidyBody;
module.exports.PLATFORM = PLATFORM;
module.exports.BOT_LABELS = BOT_LABELS;
