import { expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { violations, waitRuns } from './check-flow-timeouts.mjs';

const flow = (...steps) => ['appId: x', '---', ...steps].join('\n');
const wait = (id, timeout, extra = '') =>
  `- extendedWaitUntil:\n    visible:\n      id: "${id}"\n    timeout: ${timeout}${extra}`;
const open = '- runFlow:\n    file: ../shared/open-scenario.yaml\n    env:\n      SCENARIO: mp4';
const press = '- runFlow:\n    file: ../shared/press.yaml\n    env:\n      BUTTON: btn-play\n      NTH: 1';

test('timeouts that grow inside a run of waits pass', () => {
  expect(violations(flow(open, wait('a', 20000), wait('b', 30000), wait('c', 45000)))).toEqual([]);
});

test('a later timeout that is not larger than the one before it is reported with its line', () => {
  const text = flow(open, wait('a', 20000), wait('b', 10000));
  expect(violations(text)).toEqual([{ line: 14, timeout: 10000, previous: 20000 }]);
  expect(violations(flow(open, wait('a', 20000), wait('b', 20000)))).toHaveLength(1);
});

test('an interaction starts a new run', () => {
  expect(violations(flow(open, wait('a', 20000), press, wait('b', 5000)))).toEqual([]);
  expect(violations(flow(open, wait('a', 20000), '- tapOn:\n    id: "x"', wait('b', 5000)))).toEqual([]);
  expect(waitRuns(flow(open, wait('a', 20000), press, wait('b', 5000)))).toHaveLength(2);
});

test('an optional wait is not a deadline', () => {
  const text = flow(open, wait('a', 20000), wait('b', 3000, '\n    optional: true'), wait('c', 25000));
  expect(violations(text)).toEqual([]);
});

test('wait-for-end counts as a wait, with END_TIMEOUT when the flow passes one', () => {
  const plain = '- runFlow: ../shared/wait-for-end.yaml';
  expect(violations(flow(open, wait('a', 20000), plain))).toEqual([]);
  expect(violations(flow(open, wait('a', 50000), plain))).toHaveLength(1);
  const longer = '- runFlow:\n    file: ../shared/wait-for-end.yaml\n    env:\n      END_TIMEOUT: 85000';
  expect(violations(flow(open, wait('a', 50000), longer))).toEqual([]);
  expect(violations(flow(open, plain, wait('b', 30000)))).toHaveLength(1);
});

test('a comment is not a timeout', () => {
  expect(violations(flow(open, wait('a', 20000), '# timeout: 5000', wait('b', 30000)))).toEqual([]);
});

test('every flow in e2e/flows keeps its timeouts growing', () => {
  const dir = 'e2e/flows';
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.yaml'))) {
    expect({ file, violations: violations(readFileSync(join(dir, file), 'utf8')) }).toEqual({ file, violations: [] });
  }
});
