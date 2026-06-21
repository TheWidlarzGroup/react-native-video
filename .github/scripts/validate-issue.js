// @ts-check
// Deterministic issue validator + labeler for react-native-video bug reports.
// handleIssue() is the entry point and does the GitHub IO.

/** @type {Record<string, string>} */
const PLATFORM = {
  'iOS': 'Platform: iOS',
  'Android': 'Platform: Android',
  'Web': 'Platform: Web',
  'visionOS': 'Platform: visionOS',
  'Apple tvOS': 'Platform: tvOS',
  'Android TV': 'Platform: Android TV',
  'Windows': 'Platform: Windows',
};

// Issue-form section headers we read.
const SECTION = {
  platforms: 'Platforms',
  repro: 'Reproduction repository',
  version: 'react-native-video version',
  prerequisites: 'Prerequisites',
};

const REPRO_PROVIDED = 'Repro Provided';
const MISSING_REPRO = 'Missing Repro';
const OUTDATED = 'Newer Version Available';
const VERSION_MAJORS = [5, 6, 7];
/** @param {number} major */
const versionLabel = (major) => `V${major}`;

// Bot-owned labels. EXCLUSIVE groups: at most one member per issue (setting one
// drops the others). ADDITIVE: any number may apply. Non-bot labels are never touched.
const EXCLUSIVE_GROUPS = [
  VERSION_MAJORS.map(versionLabel), // V5 / V6 / V7
  [REPRO_PROVIDED, MISSING_REPRO],  // repro state
];
const ADDITIVE_LABELS = [...Object.values(PLATFORM), OUTDATED];

const SKIP_LABEL = 'No Validation';
const BOT_MARK = '<!-- rnv-triage-bot -->';

// `context` is typed locally below - github-script's payload type is too loose.
/** @typedef {import('@octokit/rest').Octokit} Octokit */
/**
 * @typedef {Object} IssueLabel
 * @property {string} name
 */
/**
 * @typedef {Object} Issue
 * @property {number} number
 * @property {string} [body]
 * @property {string} state
 * @property {Array<string | IssueLabel>} [labels]
 */
/**
 * @typedef {Object} Context
 * @property {{ owner: string, repo: string }} repo
 * @property {{ issue: Issue, action?: string }} payload
 */

/** @param {string} v */
const isEmpty = (v) => !v || v === '_No response_';

/**
 * Parse the "### Header\n value" sections produced by GitHub issue forms.
 * @param {string} body
 * @returns {Record<string, string>}
 */
function parseSections(body) {
  /** @type {Record<string, string>} */
  const sections = {};
  /** @type {string | null} */
  let header = null;
  for (const line of String(body || '').split(/\r?\n/)) {
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) { header = m[1].trim(); sections[header] = ''; continue; }
    if (header != null) sections[header] += line + '\n';
  }
  for (const k of Object.keys(sections)) sections[k] = sections[k].trim();
  return sections;
}

/**
 * A reproduction is "provided" only when the field contains a real http(s) URL.
 * @param {string} v
 * @returns {boolean}
 */
function isReproUrl(v) {
  if (isEmpty(v)) return false;
  return /\bhttps?:\/\/[^\s)]+/i.test(v);
}

/**
 * Extract the first x.y.z from a version string (ignores a leading v and any
 * prerelease suffix).
 * @param {string} v
 * @returns {number[] | null} [major, minor, patch] or null
 */
function parseVersionTuple(v) {
  const s = parseSemver(v);
  return s ? s.main : null;
}

/**
 * Full semver parse incl. prerelease identifiers. Generic for -alpha/-beta/-rc/etc.
 * @param {string} v
 * @returns {{ main: number[], pre: string[] } | null}
 */
function parseSemver(v) {
  const m = String(v || '').match(/v?(\d+)\.(\d+)\.(\d+)(?:[-.]([0-9A-Za-z.-]+))?/);
  if (!m) return null;
  // Split prerelease ids on "." or "-" so malformed inputs like "7.0.0.beta-9"
  // still compare correctly (real-world reporters fumble the separators).
  return { main: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ? m[4].split(/[-.]/) : [] };
}

/**
 * Compare two prerelease identifier arrays per semver precedence.
 * [] (stable) ranks higher than any prerelease.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number}
 */
function comparePre(a, b) {
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length === 0) return 1;
  if (b.length === 0) return -1;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (i >= a.length) return -1;
    if (i >= b.length) return 1;
    const x = a[i], y = b[i];
    const xn = /^\d+$/.test(x), yn = /^\d+$/.test(y);
    if (xn && yn) { if (Number(x) !== Number(y)) return Number(x) < Number(y) ? -1 : 1; }
    else if (xn) return -1;
    else if (yn) return 1;
    else if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

/**
 * Full semver comparison: -1 if a < b, 0 if equal, 1 if a > b.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareSemver(a, b) {
  const pa = parseSemver(a), pb = parseSemver(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) if (pa.main[i] !== pb.main[i]) return pa.main[i] < pb.main[i] ? -1 : 1;
  return comparePre(pa.pre, pb.pre);
}

/**
 * Highest version among `versions` that shares the given major (the newest the
 * reporter could upgrade to within their own version line).
 * @param {string[]} versions
 * @param {number} major
 * @returns {string | null}
 */
function highestForMajor(versions, major) {
  const same = (versions || []).filter((v) => { const t = parseVersionTuple(v); return t && t[0] === major; });
  if (!same.length) return null;
  return same.reduce((hi, v) => (compareSemver(v, hi) > 0 ? v : hi), same[0]);
}

/**
 * Compute the desired bot labels + actions from parsed sections.
 * @param {Record<string, string>} sections
 * @param {string[]} versions array of candidate "newest" version strings (npm dist-tags)
 * @returns {{ labels: Set<string>, isV5: boolean, outdated: { from: string, to: string } | null }}
 */
function computeTriage(sections, versions) {
  /** @param {string} h */
  const get = (h) => (sections[h] || '').trim();
  /** @type {Set<string>} */
  const labels = new Set();
  let isV5 = false;
  /** @type {{ from: string, to: string } | null} */
  let outdated = null;

  const plat = get(SECTION.platforms);
  if (!isEmpty(plat)) {
    for (const p of plat.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)) {
      if (PLATFORM[p]) labels.add(PLATFORM[p]);
    }
  }

  labels.add(isReproUrl(get(SECTION.repro)) ? REPRO_PROVIDED : MISSING_REPRO);

  const verRaw = get(SECTION.version);
  const tuple = parseVersionTuple(verRaw);
  if (tuple) {
    const maj = tuple[0];
    if (VERSION_MAJORS.includes(maj)) labels.add(versionLabel(maj));
    if (maj === 5) {
      isV5 = true;
    } else {
      // newest in the reporter's major line, so e.g. an alpha is nudged to the latest beta
      const newest = highestForMajor(versions, maj);
      if (newest && compareSemver(verRaw, newest) < 0) {
        labels.add(OUTDATED);
        outdated = { from: verRaw, to: newest };
      }
    }
  }

  return { labels, isV5, outdated };
}

/**
 * Remove the Prerequisites checkboxes section from the rendered issue body.
 * @param {string} body
 * @returns {string | null} the new body, or null if there was nothing to strip
 */
function tidyBody(body) {
  const lines = String(body || '').split(/\r?\n/);
  /** @type {string[]} */
  const out = [];
  let inPrereq = false;
  let removed = false;
  // Drop ONLY the Prerequisites section; keep everything else verbatim
  // (preamble before the first header, other sections, text between them).
  for (const line of lines) {
    if (/^###\s+/.test(line)) {
      inPrereq = line.replace(/^###\s+/, '').trim().toLowerCase() === SECTION.prerequisites.toLowerCase();
      if (inPrereq) { removed = true; continue; }
    }
    if (inPrereq) continue;
    out.push(line);
  }
  if (!removed) return null;
  return out.join('\n').replace(/\s+$/, '') + '\n';
}

/** @returns {Promise<string[]>} */
async function fetchLatestVersions() {
  try {
    const res = await fetch('https://registry.npmjs.org/-/package/react-native-video/dist-tags');
    if (!res.ok) return [];
    const tags = /** @type {Record<string, string>} */ (await res.json());
    return Object.values(tags).filter(Boolean);
  } catch (e) {
    console.error('npm dist-tags fetch failed:', e instanceof Error ? e.message : e);
    return [];
  }
}

/** @param {{ github: Octokit, context: Context }} args */
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

/** @param {{ github: Octokit, context: Context, body: string }} args */
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

/** @param {{ github: Octokit, context: Context }} args */
async function handleIssue({ github, context }) {
  const { owner, repo } = context.repo;
  const issue = context.payload.issue;
  if (!issue) return;
  const number = issue.number;
  const body = issue.body || '';

  const sections = parseSections(body);
  // Only act on our bug-report form.
  if (!(SECTION.platforms in sections) && !(SECTION.version in sections)) return;

  const existing = (issue.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
  if (existing.includes(SKIP_LABEL)) {
    console.log('No Validation label present -> skipping');
    return;
  }

  const versions = await fetchLatestVersions();
  const { labels: desired, isV5, outdated } = computeTriage(sections, versions);

  // Reconcile only the bot's own labels (never touch others -> no clobber/race).
  const have = new Set(existing);
  const toAdd = [...desired].filter((l) => !have.has(l));
  /** @type {string[]} */
  const toRemove = [];
  // Exclusive groups: setting one member drops the others that are present.
  for (const group of EXCLUSIVE_GROUPS) {
    if (group.some((l) => desired.has(l))) {
      for (const l of group) if (have.has(l) && !desired.has(l)) toRemove.push(l);
    }
  }
  // Additive bot labels no longer applicable.
  for (const l of ADDITIVE_LABELS) {
    if (have.has(l) && !desired.has(l)) toRemove.push(l);
  }
  if (toAdd.length) {
    await github.rest.issues.addLabels({ owner, repo, issue_number: number, labels: toAdd });
  }
  for (const l of toRemove) {
    try {
      await github.rest.issues.removeLabel({ owner, repo, issue_number: number, name: l });
    } catch (e) { /* label already absent - ignore */ }
  }

  const tidied = tidyBody(body);
  if (tidied && tidied !== body) {
    await github.rest.issues.update({ owner, repo, issue_number: number, body: tidied });
  }

  // On a freshly opened issue, post one welcome comment: a thanks intro plus any
  // nudges that apply (outdated version, missing reproduction). v5 has its own
  // message below, so it is excluded here.
  if (context.payload.action === 'opened' && !isV5) {
    const parts = ['Thanks for creating the issue! It will be triaged soon.'];
    if (outdated) {
      parts.push(
        `You reported **${outdated.from}**, but a newer version (**${outdated.to}**) is available - ` +
          `please retest on it and update the report if it still happens; many problems are already fixed there.`,
      );
    }
    if (desired.has(MISSING_REPRO)) {
      parts.push('We could not find a reproduction link - a minimal repro helps us fix it much faster, so please add one if you can.');
    }
    await comment({ github, context, body: parts.join('\n\n') });
  }

  // v5 is unsupported: comment + close as not planned (only once).
  if (isV5 && issue.state === 'open' && !existing.includes(versionLabel(5))) {
    await comment({
      github,
      context,
      body: [
        'Thanks for the report - but **react-native-video v5 and older are no longer maintained**.',
        '',
        `Please upgrade to **v6 or v7**, where we actively fix issues. If you must stay on v5, [TheWidlarzGroup offers commercial support](https://sdk.thewidlarzgroup.com/issue-booster?contact=true&utm_source=rnv&utm_medium=issue&utm_campaign=v5-support&utm_id=${number}).`,
        '',
        'Closing as not planned - if it still happens on a supported version, please open a new issue.',
      ].join('\n'),
    });
    await github.rest.issues.update({ owner, repo, issue_number: number, state: 'closed', state_reason: 'not_planned' });
  }
}

module.exports = handleIssue;
