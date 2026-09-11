import { test, expect } from 'bun:test';
import { parseJUnit, renderSummary, isCompleteReport } from './junit-summary.mjs';

const XML = `<?xml version="1.0"?>
<testsuites>
  <testsuite name="e2e">
    <testcase name="smoke-mp4-happy-path" time="14.2"/>
    <testcase name="smoke-seek" time="16.0">
      <failure message="Assertion is false: id: evt-seeked is visible"/>
    </testcase>
  </testsuite>
</testsuites>`;

test('table cells escape backslashes as well as pipes', () => {
  const xml = `<testsuites><testsuite><testcase name="a\\b"><failure message="path C:\\x | y"/></testcase></testsuite></testsuites>`;
  const md = renderSummary(parseJUnit(xml), 'l', true, true);
  expect(md).toContain('`a\\\\b`');
  expect(md).toContain('path C:\\\\x \\| y');
});

test('counts cases and failures', () => {
  const parsed = parseJUnit(XML);
  expect(parsed.total).toBe(2);
  expect(parsed.failures).toBe(1);
});

test('captures the failure message', () => {
  const failed = parseJUnit(XML).cases.find((c) => c.failed);
  expect(failed.name).toBe('smoke-seek');
  expect(failed.message).toContain('evt-seeked');
});

test('marks passing cases as not failed', () => {
  const passed = parseJUnit(XML).cases.find((c) => c.name === 'smoke-mp4-happy-path');
  expect(passed.failed).toBe(false);
});

test('renders a table naming the label and the failing flow', () => {
  const md = renderSummary(parseJUnit(XML), 'android · RN 0.87 · API 36', true, true);
  expect(md).toContain('android · RN 0.87 · API 36');
  expect(md).toContain('smoke-seek');
  expect(md).toContain('1 failed');
  // Assert markdown table structure is present
  expect(md).toContain('| | Flow | Failure |');
  expect(md).toContain('|---|---|---|');
  // Assert the failing case has its own row
  const lines = md.split('\n');
  const failingRow = lines.find((l) => l.includes('smoke-seek'));
  expect(failingRow).toBeDefined();
  expect(failingRow.split(/(?<!\\)\|/).length).toBe(5); // table with 4 separators
});

test('handles a report with no failures', () => {
  const md = renderSummary(parseJUnit('<testsuites><testsuite/></testsuites>'), 'x', true, true);
  expect(md).toContain('0 failed');
  // Assert this is a genuine zero-flow run, not a missing file
  expect(md).toContain('_No flows ran._');
  // Should not render a table
  expect(md).not.toContain('| | Flow | Failure |');
});

test('a failure message with pipes and newlines cannot break the table', () => {
  const xml =
    '<testsuites><testsuite><testcase name="f">' +
    '<failure message="a | b\nc"/></testcase></testsuite></testsuites>';
  const row = renderSummary(parseJUnit(xml), 'x', true, true).trimEnd().split('\n').at(-1);
  expect(row.startsWith('|')).toBe(true);
  // Split on unescaped pipes only; the escaped pipe in the message preserves table structure
  expect(row.split(/(?<!\\)\|/).length).toBe(5);
  // Verify the pipe is escaped in the output, preserving information
  expect(row).toContain('a \\| b');
});

test('handles messages with backslash-pipe sequences', () => {
  const xml =
    '<testsuites><testsuite><testcase name="g">' +
    '<failure message="already has \\| in it"/></testcase></testsuite></testsuites>';
  const row = renderSummary(parseJUnit(xml), 'x', true, true).trimEnd().split('\n').at(-1);
  // Backslash and pipe are treated as separate characters; the pipe gets escaped
  expect(row.split(/(?<!\\)\|/).length).toBe(5);
  // The message contains a literal backslash before the pipe; in a markdown table the
  // backslash must be escaped too (\\), followed by the escaped pipe (\|).
  expect(row).toContain('already has \\\\\\| in it');
});

test('decodes XML entities in failure messages', () => {
  const xml =
    '<testsuites><testsuite><testcase name="h">' +
    '<failure message="text &quot;Play&quot; &amp; &quot;Pause&quot; is visible"/></testcase></testsuite></testsuites>';
  const parsed = parseJUnit(xml);
  const failedCase = parsed.cases[0];
  // Verify entities are decoded: &quot; -> " and &amp; -> &
  expect(failedCase.message).toBe('text "Play" & "Pause" is visible');
  // Verify the message renders correctly in the table
  const md = renderSummary(parsed, 'x', true, true);
  expect(md).toContain('text "Play" & "Pause" is visible');
});

test('decodes numeric entity references safely without double-decoding', () => {
  const xml =
    '<testsuites><testsuite><testcase name="i">' +
    '<failure message="entity &#38;quot; renders literally"/></testcase></testsuite></testsuites>';
  const parsed = parseJUnit(xml);
  const failedCase = parsed.cases[0];
  // &#38;quot; should decode to &quot; (the literal string), not a quote character
  expect(failedCase.message).toBe('entity &quot; renders literally');
  const md = renderSummary(parsed, 'x', true, true);
  expect(md).toContain('entity &quot; renders literally');
});

test('distinguishes three states: no file, truncated file, valid empty report', () => {
  const parsed = { total: 0, failures: 0, cases: [] };

  // Case 1: No file exists (hasFile = false)
  const noFile = renderSummary(parsed, 'x', false, true);
  expect(noFile).toContain('_No JUnit report produced — the job failed before Maestro ran._');
  expect(noFile).not.toContain('mid-write');
  expect(noFile).not.toContain('_No flows ran._');

  // Case 2: File exists but is truncated/incomplete (hasFile = true, isComplete = false)
  const truncated = renderSummary(parsed, 'x', true, false);
  expect(truncated).toContain('_JUnit report is incomplete');
  expect(truncated).toContain('mid-write');
  expect(truncated).not.toContain('No JUnit report produced');
  expect(truncated).not.toContain('_No flows ran._');

  // Case 3: File exists and is complete with zero flows (hasFile = true, isComplete = true)
  const validEmpty = renderSummary(parsed, 'x', true, true);
  expect(validEmpty).toContain('_No flows ran._');
  expect(validEmpty).not.toContain('No JUnit report produced');
  expect(validEmpty).not.toContain('mid-write');
});

test('detects complete vs truncated reports', () => {
  const complete = '<testsuites><testsuite/></testsuites>';
  const truncated = '<testsuites><testsuite>';
  const empty = '';

  expect(isCompleteReport(complete)).toBe(true);
  expect(isCompleteReport(truncated)).toBe(false);
  expect(isCompleteReport(empty)).toBe(false);
});

test('truncated report with partial cases shows warning and still renders cases', () => {
  const truncatedXml = `<testsuites>
  <testsuite name="e2e">
    <testcase name="flow-1" time="5.0"/>
    <testcase name="flow-2" time="3.5">
      <failure message="timeout"/>
    </testcase>`;
  // Note: no closing </testsuite></testsuites>

  const parsed = parseJUnit(truncatedXml);
  const md = renderSummary(parsed, 'test-run', true, false);

  // The warning must be present and visibly named
  expect(md).toContain('_JUnit report is incomplete');
  expect(md).toContain('mid-write');

  // Partial data is still useful and must render
  expect(md).toContain('flow-1');
  expect(md).toContain('flow-2');
  expect(md).toContain('1 failed');
  expect(md).toContain('2 flows');

  // Warning appears before the table
  const lines = md.split('\n');
  const warningIdx = lines.findIndex((l) => l.includes('incomplete'));
  const tableIdx = lines.findIndex((l) => l.includes('| | Flow | Failure |'));
  expect(warningIdx).toBeLessThan(tableIdx);
});
