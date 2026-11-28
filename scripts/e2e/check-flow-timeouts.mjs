#!/usr/bin/env node
// Maestro measures the timeout of an `extendedWaitUntil` from the latest interaction (launch,
// tap, opening a link, an orientation change), not from the start of the step. In a run of
// waits with no interaction between them, a later wait has only what is left of its timeout
// once the earlier waits have used theirs. So inside such a run every timeout has to be larger
// than the one before it: each one is "time since the last interaction", not "time for this
// step". This script fails when a flow breaks that rule (e2e/CONTEXT.md, "Timeouts").
//
// Usage: node scripts/e2e/check-flow-timeouts.mjs [flows-dir]   (default: e2e/flows)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMain } from './is-main.mjs';

// Subflows and commands that interact with the app, which restarts the clock.
const INTERACTION = /^\s*-?\s*(tapOn|doubleTapOn|longPressOn|launchApp|openLink|setOrientation|swipe|inputText|pressKey|back)\b|shared\/(launch-app|open-scenario|press)\.yaml/;
// Shared subflows that only wait: their own timeout runs on the same clock.
const WAITING_SUBFLOWS = { 'wait-for-end.yaml': 45000 };

/**
 * The waits of a flow, grouped into runs that have no interaction between them.
 * `text` is the content of a flow file; the result is a list of runs, each a list of
 * `{ line, timeout }`.
 */
export function waitRuns(text) {
  const lines = text.split('\n').map((raw) => raw.replace(/#.*$/, ''));
  // The lines of the list item that starts at `start` (up to the next item at any depth).
  const itemEnd = (start) => {
    let end = start + 1;
    while (end < lines.length && !/^\s*-\s/.test(lines[end])) end++;
    return end;
  };
  const runs = [[]];
  lines.forEach((line, index) => {
    if (INTERACTION.test(line)) {
      runs.push([]);
      return;
    }
    for (const [name, fallback] of Object.entries(WAITING_SUBFLOWS)) {
      if (!line.includes(`shared/${name}`)) continue;
      // `- runFlow: ../shared/x.yaml` or `- runFlow:` + `file:`; the item may pass END_TIMEOUT.
      let start = index;
      while (start > 0 && !/^\s*-\s/.test(lines[start])) start--;
      const override = lines
        .slice(start, itemEnd(start))
        .map((l) => /^\s*END_TIMEOUT:\s*(\d+)/.exec(l))
        .find(Boolean);
      runs.at(-1).push({ line: index + 1, timeout: override ? Number(override[1]) : fallback });
    }
    const match = /^\s*timeout:\s*(\d+)/.exec(line);
    if (!match) return;
    let start = index;
    while (start > 0 && !/^\s*-\s/.test(lines[start])) start--;
    // An optional wait is a pause or a probe, not a deadline the flow depends on.
    const optional = lines.slice(start, itemEnd(start)).some((l) => /^\s*optional:\s*true/.test(l));
    if (!optional) runs.at(-1).push({ line: index + 1, timeout: Number(match[1]) });
  });
  return runs.filter((run) => run.length > 0);
}

/** Waits whose timeout is not larger than the wait before them in the same run. */
export function violations(text) {
  const found = [];
  for (const run of waitRuns(text)) {
    for (let i = 1; i < run.length; i++) {
      if (run[i].timeout <= run[i - 1].timeout) {
        found.push({ line: run[i].line, timeout: run[i].timeout, previous: run[i - 1].timeout });
      }
    }
  }
  return found;
}

if (isMain(import.meta.url)) {
  const dir = process.argv[2] ?? 'e2e/flows';
  let failed = 0;
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.yaml')).sort()) {
    for (const v of violations(readFileSync(join(dir, file), 'utf8'))) {
      failed += 1;
      console.error(
        `${join(dir, file)}:${v.line}: timeout ${v.timeout} is not larger than the ${v.previous} of the wait before it. ` +
          'No interaction separates them, so Maestro counts both from the same moment.'
      );
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} timeout(s) to fix. See e2e/CONTEXT.md, "Timeouts".`);
    process.exit(1);
  }
  console.log('flow timeouts: ok');
}
