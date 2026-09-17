import { describe, expect, test } from 'bun:test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isCompleteReport, main, parseJUnit, renderSummary } from './junit-summary.mjs';
import { fakeIo, useTmpDirs } from './test-helpers.mjs';

const tmpDir = useTmpDirs();

// The attribute layout Maestro 2.x writes.
const REPORT = `<?xml version='1.0' encoding='UTF-8'?>
<testsuites>
  <testsuite name="Test Suite" device="API35Test" tests="2" failures="1" time="30.2">
    <testcase id="smoke-mp4-happy-path" name="smoke-mp4-happy-path" classname="smoke-mp4-happy-path" time="14.2" status="SUCCESS"/>
    <testcase id="smoke-seek" name="smoke-seek" classname="smoke-seek" time="16.0" status="ERROR">
      <failure message="Assertion is false: id: evt-seek-fwd-landed is visible"/>
    </testcase>
  </testsuite>
</testsuites>`;

const oneCase = (inner, attrs = 'name="f"') =>
  `<testsuites><testsuite><testcase ${attrs}>${inner}</testcase></testsuite></testsuites>`;
const message = (text) => parseJUnit(oneCase(`<failure message="${text}"/>`)).cases[0].message;
const lastRow = (md) => md.trimEnd().split('\n').at(-1);
// Columns of a markdown table row, splitting on unescaped pipes only.
const columns = (row) => row.split(/(?<!\\)\|/).length - 2;

describe('parseJUnit', () => {
  test('counts cases and failures, with each failure message', () => {
    expect(parseJUnit(REPORT)).toEqual({
      total: 2,
      failures: 1,
      cases: [
        { name: 'smoke-mp4-happy-path', failed: false, message: '' },
        { name: 'smoke-seek', failed: true, message: 'Assertion is false: id: evt-seek-fwd-landed is visible' },
      ],
    });
  });

  test('reads `name`, never the end of `classname`', () => {
    const xml = oneCase('', 'classname="Suite" name="smoke-seek"');
    expect(parseJUnit(xml).cases[0].name).toBe('smoke-seek');
  });

  test('an <error> element counts as a failure', () => {
    expect(parseJUnit(oneCase('<error message="crashed"/>')).cases[0]).toEqual({
      name: 'f',
      failed: true,
      message: 'crashed',
    });
  });

  // Maestro 2.10 writes the reason as the element's text, not as a `message` attribute:
  // <failure>Assertion is false: id: evt-muted is visible</failure>
  describe('failure text in the element body', () => {
    const body = (inner) => parseJUnit(oneCase(inner)).cases[0].message;

    test('is the message when there is no message attribute', () => {
      expect(body('<failure>Assertion is false: id: evt-muted is visible</failure>')).toBe(
        'Assertion is false: id: evt-muted is visible'
      );
      expect(body('<error>crashed</error>')).toBe('crashed');
    });

    test('is entity-decoded and trimmed', () => {
      expect(body('<failure>\n  text &quot;Play&quot; &amp; &lt;b&gt;\n</failure>')).toBe('text "Play" & <b>');
    });

    test('is read verbatim from CDATA', () => {
      expect(body('<failure><![CDATA[a < b &amp; c]]></failure>')).toBe('a < b &amp; c');
    });

    test('loses to a message attribute', () => {
      expect(body('<failure message="short">long stack trace</failure>')).toBe('short');
    });

    test('an empty element still counts as a failure with no message', () => {
      expect(parseJUnit(oneCase('<failure></failure>')).cases[0]).toEqual({ name: 'f', failed: true, message: '' });
    });
  });

  test('an empty document has no cases', () => {
    expect(parseJUnit('')).toEqual({ total: 0, failures: 0, cases: [] });
  });

  describe('XML entities', () => {
    test('named entities are decoded', () => {
      expect(message('text &quot;Play&quot; &amp; &apos;Pause&apos; &lt;b&gt;')).toBe(
        `text "Play" & 'Pause' <b>`
      );
    });

    test('decimal and hex references are decoded, including astral code points', () => {
      expect(message('&#65;&#x42;&#x1F600;')).toBe('AB😀');
    });

    test('decoded text is never decoded a second time', () => {
      expect(message('&#38;quot;')).toBe('&quot;');
      expect(message('&amp;#60;')).toBe('&#60;');
      expect(message('&amp;amp;')).toBe('&amp;');
    });

    test('a reference outside Unicode is left as written', () => {
      expect(message('&#x110000;')).toBe('&#x110000;');
    });
  });
});

test('isCompleteReport requires the closing root element', () => {
  expect(isCompleteReport(REPORT)).toBe(true);
  expect(isCompleteReport('<testsuites><testsuite>')).toBe(false);
  expect(isCompleteReport('')).toBe(false);
});

describe('renderSummary', () => {
  const render = (xml, overrides = {}) =>
    renderSummary({
      parsed: parseJUnit(xml),
      label: 'android · RN 0.87 · API 36',
      reportExists: true,
      reportComplete: isCompleteReport(xml),
      ...overrides,
    });

  test('renders a heading and one table row per flow', () => {
    const md = render(REPORT);
    expect(md.startsWith('### android · RN 0.87 · API 36 — 1 failed / 2 flows\n\n')).toBe(true);
    expect(md).toContain('| | Flow | Failure |\n|---|---|---|\n');
    expect(md).toContain('| ✅ | `smoke-mp4-happy-path` |  |');
    expect(md).toContain('| ❌ | `smoke-seek` | Assertion is false: id: evt-seek-fwd-landed is visible |');
  });

  test('newlines, pipes and backslashes in a message cannot break the table', () => {
    const row = lastRow(render(oneCase('<failure message="a | b\nc C:\\x \\| y"/>', 'name="a\\b"')));
    expect(columns(row)).toBe(3);
    expect(row).toBe('| ❌ | `a\\\\b` | a \\| b c C:\\\\x \\\\\\| y |');
  });

  test('a missing report says the job failed before Maestro ran', () => {
    const md = render('', { reportExists: false });
    expect(md).toContain('_No JUnit report produced — the job failed before Maestro ran._');
    expect(md).not.toContain('incomplete');
  });

  test('a complete report with no cases says no flows ran', () => {
    const md = render('<testsuites><testsuite/></testsuites>');
    expect(md).toContain('0 failed / 0 flows');
    expect(md).toContain('_No flows ran._');
    expect(md).not.toContain('| Flow |');
  });

  test('an incomplete report without cases shows only the warning', () => {
    const md = render('<testsuites><testsuite>');
    expect(md).toContain('_JUnit report is incomplete');
    expect(md).not.toContain('_No flows ran._');
    expect(md).not.toContain('| Flow |');
  });

  test('an incomplete report still lists the cases that closed, below the warning', () => {
    const md = render('<testsuites><testsuite><testcase name="f1"/><testcase name="f2"><failure message="timeout"/></testcase>');
    expect(md).toContain('1 failed / 2 flows');
    expect(md.indexOf('_JUnit report is incomplete')).toBeLessThan(md.indexOf('| | Flow | Failure |'));
    expect(md).toContain('`f1`');
    expect(md).toContain('`f2`');
  });
});

describe('main', () => {
  test('appends the summary to GITHUB_STEP_SUMMARY', () => {
    const dir = tmpDir();
    const report = join(dir, 'report.xml');
    const summary = join(dir, 'summary.md');
    writeFileSync(report, REPORT);
    writeFileSync(summary, 'before\n');
    const { io, stdout } = fakeIo({ GITHUB_STEP_SUMMARY: summary });

    expect(main({ argv: ['node', 'junit-summary.mjs', report, 'my label'], ...io })).toBe(0);
    expect(readFileSync(summary, 'utf8')).toStartWith('before\n### my label — 1 failed / 2 flows');
    expect(stdout()).toBe('');
  });

  test('writes to stdout without GITHUB_STEP_SUMMARY, and reports a missing file', () => {
    const { io, stdout } = fakeIo();
    const code = main({ argv: ['node', 'junit-summary.mjs', join(tmpDir(), 'missing.xml')], ...io });
    expect(code).toBe(0);
    expect(stdout()).toContain('### e2e — 0 failed / 0 flows');
    expect(stdout()).toContain('_No JUnit report produced');
  });

  test('fails with usage when no report path is given', () => {
    const { io, stderr } = fakeIo();
    expect(main({ argv: ['node', 'junit-summary.mjs'], ...io })).toBe(1);
    expect(stderr()).toContain('usage:');
  });
});
