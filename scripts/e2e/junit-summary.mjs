// Renders Maestro's JUnit report into the GitHub job summary. Maestro emits a flat,
// stable <testcase>/<failure> shape, so a regex reader is enough and keeps this
// dependency-free.
//
// Usage: junit-summary.mjs <report.xml> [label]
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { runIfMain } from './is-main.mjs';

const CASE_RE = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;

const NAMED_ENTITIES = { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' };

// One pass, so the output of one decode is never decoded again (`&amp;#60;` is the text
// `&#60;`, not `<`).
function decodeXmlEntities(text) {
  return text.replace(/&(?:(quot|apos|lt|gt|amp)|#(\d+)|#x([0-9a-f]+));/gi, (entity, name, dec, hex) => {
    if (name) return NAMED_ENTITIES[name];
    const codePoint = dec ? Number.parseInt(dec, 10) : Number.parseInt(hex, 16);
    return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
  });
}

function attribute(attrs, name) {
  // Anchored on whitespace, so `name` never matches inside `classname`.
  const match = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs);
  return match ? decodeXmlEntities(match[1]) : '';
}

// Maestro 2.10 writes the reason as the element's text, not the JUnit `message`
// attribute. The attribute wins when both are present (the text is then a stack trace).
// Quoted attribute values may contain ">", so they are skipped as a unit.
const FAILURE_RE = /<(?:failure|error)\b((?:[^>"]|"[^"]*")*?)(?:\/>|>([\s\S]*?)<\/(?:failure|error)>|>)/;

const MAX_BODY_MESSAGE = 300;

// First line only: a body is often a stack trace, and the summary is capped at 1 MiB.
function elementText(inner) {
  const text = inner
    .split(/(<!\[CDATA\[[\s\S]*?\]\]>)/)
    .map((part) => (part.startsWith('<![CDATA[') ? part.slice(9, -3) : decodeXmlEntities(part)))
    .join('');
  const firstLine = text.trim().split(/\r?\n/, 1)[0].trim();
  return firstLine.length > MAX_BODY_MESSAGE ? `${firstLine.slice(0, MAX_BODY_MESSAGE - 1)}…` : firstLine;
}

export function parseJUnit(xml) {
  const cases = [];
  for (const [, attrs, , body = ''] of xml.matchAll(CASE_RE)) {
    const failure = FAILURE_RE.exec(body);
    cases.push({
      name: attribute(attrs, 'name'),
      failed: failure !== null,
      message: failure ? attribute(failure[1], 'message') || elementText(failure[2] ?? '') : '',
    });
  }
  return {
    total: cases.length,
    failures: cases.filter((c) => c.failed).length,
    cases,
  };
}

// A report cut off mid-write (the job's timeout killed Maestro) has no closing root element.
export function isCompleteReport(xml) {
  return xml.includes('</testsuites>');
}

// Failure messages contain newlines, pipes and backslashes, each of which breaks a markdown
// table. Backslashes are escaped first so the escapes added for pipes stay intact.
function cell(text) {
  return text.replace(/\s+/g, ' ').replace(/\\/g, '\\\\').replace(/\|/g, '\\|').trim();
}

export function renderSummary({ parsed, label, reportExists, reportComplete }) {
  const head = `### ${label} — ${parsed.failures} failed / ${parsed.total} flows\n\n`;
  if (!reportExists) {
    return `${head}_No JUnit report produced — the job failed before Maestro ran._\n`;
  }
  const warning = reportComplete
    ? ''
    : '_JUnit report is incomplete (file present but ends mid-write). The job may have ended before Maestro finished writing._\n\n';
  if (parsed.total === 0) {
    return reportComplete ? `${head}_No flows ran._\n` : `${head}${warning}`;
  }
  const rows = parsed.cases
    .map((c) => `| ${c.failed ? '❌' : '✅'} | \`${cell(c.name)}\` | ${cell(c.message)} |`)
    .join('\n');
  return `${head}${warning}| | Flow | Failure |\n|---|---|---|\n${rows}\n`;
}

export function main({ argv, env, stdout, stderr }) {
  const [, , reportPath, label = 'e2e'] = argv;
  if (!reportPath) {
    stderr.write('usage: junit-summary.mjs <report.xml> [label]\n');
    return 1;
  }
  const reportExists = existsSync(reportPath);
  const xml = reportExists ? readFileSync(reportPath, 'utf8') : '';
  const md = renderSummary({
    parsed: parseJUnit(xml),
    label,
    reportExists,
    reportComplete: isCompleteReport(xml),
  });
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, md);
  else stdout.write(md);
  return 0;
}

runIfMain(import.meta.url, main);
