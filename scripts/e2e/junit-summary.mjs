// Renders Maestro's JUnit report into the GitHub job summary. Maestro emits a flat,
// stable <testcase>/<failure> shape, so a regex reader is enough and keeps this
// dependency-free.
import { readFileSync, appendFileSync } from 'node:fs';
import { isMain } from './is-main.mjs';

const CASE_RE = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;

// Decode XML entities: &quot; &apos; &lt; &gt; &amp; and numeric references.
// Decode named entities FIRST, then numeric references LAST to avoid double-decoding.
// For example: &#38;quot; should become &quot;, not a quote.
// If we decoded numeric first, &#38; -> &, then &quot; -> ", which is wrong.
// Decoding named first leaves &#38;quot; alone, then &#38; -> & yields &quot;.
function decodeXmlEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

const ATTR = (attrs, name) => {
  const match = new RegExp(`${name}="([^"]*)"`).exec(attrs);
  return match ? decodeXmlEntities(match[1]) : '';
};

export function parseJUnit(xml) {
  const cases = [];
  for (const m of xml.matchAll(CASE_RE)) {
    const [, attrs, , body = ''] = m;
    const failure = /<(failure|error)\b([^>]*)/.exec(body);
    cases.push({
      name: ATTR(attrs, 'name'),
      failed: Boolean(failure),
      message: failure ? ATTR(failure[2], 'message') : '',
    });
  }
  return {
    total: cases.length,
    failures: cases.filter((c) => c.failed).length,
    cases,
  };
}

// Detect if a JUnit XML document is complete (contains closing root element).
// A truncated report (file created but not finished writing) lacks </testsuites>.
export function isCompleteReport(xml) {
  return xml.includes('</testsuites>');
}

// Maestro failure messages are free text and routinely contain newlines, pipes and
// backslashes, all of which silently destroy a markdown table. Flatten and escape
// before embedding; backslashes first, so the escapes added for pipes stay intact.
function cell(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .trim();
}

export function renderSummary(parsed, label, hasFile, isComplete = true) {
  const head = `### ${label} — ${parsed.failures} failed / ${parsed.total} flows\n\n`;

  // Warn if report is incomplete, regardless of case count
  const incompleteWarning = hasFile && !isComplete
    ? '_JUnit report is incomplete (file present but ends mid-write). The job may have ended before Maestro finished writing._\n\n'
    : '';

  if (parsed.total === 0) {
    if (!hasFile) return `${head}_No JUnit report produced — the job failed before Maestro ran._\n`;
    if (!isComplete) return `${head}${incompleteWarning}`;
    return `${head}_No flows ran._\n`;
  }

  const rows = parsed.cases
    .map((c) => `| ${c.failed ? '❌' : '✅'} | \`${cell(c.name)}\` | ${cell(c.message)} |`)
    .join('\n');
  return `${head}${incompleteWarning}| | Flow | Failure |\n|---|---|---|\n${rows}\n`;
}

if (isMain(import.meta.url)) {
  const [, , reportPath, label = 'e2e'] = process.argv;
  let xml = '';
  let fileExists = false;
  try {
    xml = readFileSync(reportPath, 'utf8');
    fileExists = true;
  } catch {
    xml = '';
  }
  const isComplete = fileExists && isCompleteReport(xml);
  const md = renderSummary(parseJUnit(xml), label, fileExists, isComplete);
  const out = process.env.GITHUB_STEP_SUMMARY;
  if (out) appendFileSync(out, md);
  else process.stdout.write(md);
}
