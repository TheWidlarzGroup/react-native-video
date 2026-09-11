# E2E CI Matrix — Design

> Companion to `CONTEXT.md`, which holds decisions D1–D7 and the MVP scope. This document
> covers the CI matrix that runs the E2E suite across React Native versions and platforms,
> and continues the decision numbering at D8.
> Status: IMPLEMENTED — not yet verified against a real CI run (see "Manual setup (one-time)").
> Date: 2026-09-07

## Goal

Run the library and every PR through the Maestro E2E environment across multiple React
Native versions and both platforms, in parallel, on free GitHub-hosted runners. The system
must not become a bottleneck (a PR waiting on a queue) and must not produce false
positives (red for reasons unrelated to the change) or false negatives (green that hides a
real break). Success is measured by regressions caught before merge, not by matrix size.

## Decisions (D8–D13)

- **D8 — Three RN versions:** floor (0.77), middle (0.82), latest (0.87). Wide enough to
  catch mid-range breaks, narrow enough to fit the free macOS concurrency limit.
- **D9 — Asymmetric gate.** Per PR: Android ×3 RN, iOS ×1 RN. Nightly: the full 3×2 grid
  plus older OS versions. Rationale in "Why this is not a bottleneck" below.
- **D10 — OS versions are a real dimension.** PR runs Android API 36 and iOS 26. Nightly
  adds API 35, API 34 and iOS 18.
- **D11 — Zero retries, explicit quarantine.** No flow is ever retried. A flow judged
  unstable gets a `flaky` tag, drops out of the gate, and keeps running in nightly as a
  separate non-blocking report. Quarantine is visible in the diff and countable.
- **D12 — Version swap by overlay + committed lockfile,** scoped to `test-app/`. The root
  workspace is not modified.
- **D13 — The iOS gate tracks latest RN,** not the floor. Android already covers all three
  versions per PR, so the single iOS job buys platform coverage; pairing it with latest
  puts it where version-specific breakage actually occurs.

## Spike findings (2026-09-07) — RN 0.87 readiness

Run against the RNTA test app bumped to RN 0.87.1 / React 19.2.3, CocoaPods static libs,
New Arch, default prebuilt core, Xcode 26, iOS 26 simulator.

**The version swap itself is cheap.** bun resolves a nested
`test-app/node_modules/{react-native,react,react-native-nitro-modules}` while the root
stays on 0.77.3 / nitro 0.35.0 for the library. CocoaPods follows it
(`[NitroModules] Found react-native 0.87.1 in test-app/node_modules`). RNTA 5.4.9 — the
version already pinned, with the existing `intent.action`/`intent.data` patch — declares
`react-native: 0.76 - 0.87`, so it covers the whole matrix without a bump.

**RN 0.87 needs three library-side changes before its row can be green:**

1. `ReactNativeVideo.podspec` must not publish `ios/Video-Bridging-Header.h` as a public
   header (issue #5084, PR #5085). Reproduced exactly; `jsi/jsi.h` is owned by module
   `React` under the prebuilt core.
2. Three quoted imports of React headers must become framework-style — under the prebuilt
   core `RCTBridge.h` is not in the Pods header tree at all:
   - `ios/view/fabric/RCTVideoViewViewManager.mm:3` — `#import "RCTBridge.h"`
   - `ios/view/paper/RCTVideoViewViewManager.m:2` — `#import "RCTEventDispatcher.h"`
   - `ios/view/fabric/RCTVideoViewComponentView.mm:8` — `#import "RCTFabricComponentsPlugins.h"`
3. `react-native-nitro-modules` must be `0.37.1` for RN 0.87. With 0.35.0 the app builds
   and launches, then red-screens with `Failed to install Nitro:
   installJSIBindingsWithRuntime: was not called`.

With all three applied, the full Maestro suite passes 10/10 on RN 0.87.1 in 3m 12s.

**Known compatibility, not a guarantee:** the library's committed nitrogen-0.35 generated
output compiles and runs against the Nitro 0.37.1 runtime, so no regeneration is needed
today. If that ever breaks, the overlay would have to reach the root workspace and D12
must be revisited.

**Not verified:** RN 0.82. Assumed easier than 0.87 (closer to the floor), but untested.

## Matrix

### PR gate — 4 parallel jobs

| Job | Runner | RN | Device |
|---|---|---|---|
| `android-rn077` | `ubuntu-latest` | 0.77 | API 36 |
| `android-rn082` | `ubuntu-latest` | 0.82 | API 36 |
| `android-rn087` | `ubuntu-latest` | 0.87 | API 36 |
| `ios-gate` | `macos-26` | 0.87 | iOS 26 |

### Nightly — 17 jobs, none blocking

- Android coverage: 3 RN × API 36 / 35 / 34 = 9 jobs on `ubuntu-latest`.
- iOS coverage: 3 RN × iOS 26 (`macos-26`) + 3 RN × iOS 18 (`macos-15`) = 6 jobs.
  `macos-26` carries iOS 26.0–26.5 only; `macos-15` carries both iOS 18.x and 26.x.
- Quarantine: 1 job per platform running `--include-tags=flaky` = 2 jobs (Android on
  API 36, iOS on `macos-26`), both at the floor RN version. Because that duplicates the
  coordinates of a regular leg, each quarantine call must pass an `artifact-suffix` — two
  calls differing only in tag selection would otherwise render the same artifact name, and
  `upload-artifact@v4` hard-errors on a duplicate within a run.

### Why this is not a bottleneck

The free plan for a public repository allows 20 concurrent jobs but only **5 concurrent
macOS jobs**. This split consumes 1 macOS job per PR, so five simultaneous PRs still fit;
Ubuntu (3 × 5 = 15) fits too. A sixth concurrent PR queues only its iOS job, not the whole
gate. A symmetric 3×2 gate would consume 3 macOS jobs per PR and queue from the second PR
onward. Orchestrator-level `concurrency` with `cancel-in-progress` frees the macOS slot
immediately on a new push instead of holding it for a stale commit.

Nightly deliberately exceeds the macOS limit (7 macOS jobs — 6 iOS coverage rows plus
1 quarantine-ios — 5 at a time) and runs in two waves. `_e2e-ios.yml` budgets
`timeout-minutes: 60` per leg, and that budget is measured from when a job actually
starts on a runner, not from when it enters the queue, so the second wave gets its own
full 60 minutes rather than racing a clock already ticking from the first — worst case,
two waves of up to 60 minutes each is up to 2 hours, not the "roughly 40 minutes instead
of 20" this section previously claimed by extrapolating only from the spike's ~3-minute
Maestro run and ignoring pod install / xcodebuild / simulator boot, which is most of
what a leg actually spends its time on. The 10 Android jobs (9 coverage + 1
quarantine-android, each budgeted `timeout-minutes: 45` in `_e2e-android.yml`) run
alongside the iOS waves and finish well inside that same window. A 2-hour ceiling costs
nothing overnight: this is a once-nightly cron, not a per-PR queue, and
`e2e-nightly`'s `concurrency: { cancel-in-progress: false }` queues rather than overlaps
a run that spills into the next scheduled trigger.

### Rollout while RN 0.87 is still broken

Both 0.87 rows (`android-rn087`, `ios-gate`) ship as non-blocking via a `blocking` matrix
input driving `continue-on-error`. They become blocking by flipping one field once the
three library fixes land. This lets the matrix exist now, measure the progress of the RN
0.87 work as it happens, and never show red that a PR author is not responsible for.

Per `CONTEXT.md`, no check becomes *required* until 10–15 consecutive clean runs.

## Version-swap mechanism

```
e2e/rn-matrix/
  README.md
  0.82/  overlay.json  bun.lock
  0.87/  overlay.json  bun.lock
scripts/e2e/use-rn-version.mjs
```

The floor has no directory: `test-app/package.json` in the repo **is** the 0.77 variant and
the root `bun.lock` is its lockfile. The default state of the repo is therefore always a
working test app, and only two lockfiles are duplicated.

`overlay.json` holds differences only — for 0.87 that is `react`, `react-native`,
`react-native-nitro-modules`, the four `@react-native/*` packages and the three
`@react-native-community/cli` packages. The base stays a single source of truth, so adding
a scenario or a dependency to the test app does not require editing three copies.

`node scripts/e2e/use-rn-version.mjs <version>` merges the overlay into
`test-app/package.json` and copies the variant `bun.lock` over the root one. The caller then
runs `bun install --frozen-lockfile`. It **must** run before `pod install` and `gradlew`,
which read `node_modules` — this is the only hard ordering constraint in the mechanism.

`--refresh` merges the overlay, runs `bun install` *without* `--frozen-lockfile`, then copies
the resulting root `bun.lock` back into the variant directory and restores
`test-app/package.json`. Used by the weekly bot job and by anyone adding a version.

`--frozen-lockfile` is what makes a red job trustworthy: a job cannot silently pick up a new
transitive version. A lockfile/manifest mismatch fails with an explicit lockfile error rather
than a confusing build error three layers down. Dependency drift becomes its own weekly bot
PR, judged on its own merits, instead of noise in someone else's gate.

Cost: about 1.4 MB of extra lockfiles in the repo, and large diffs on refresh — contained to
the bot's PR. Adding an RN version costs two files and one command, which is what D6
(community-authored coverage) requires.

## Workflow structure

```
.github/workflows/
  e2e.yml                  # orchestrator: PR gate
  e2e-nightly.yml          # orchestrator: full matrix + quarantine
  e2e-lockfile-refresh.yml # weekly bot PR
  _e2e-android.yml         # reusable: one Android run
  _e2e-ios.yml             # reusable: one iOS run
.github/actions/
  setup-bun/               # exists
  e2e-setup/               # new composite: RN version + install + Maestro + fixture server
```

Platform runs are **reusable workflows** (`workflow_call`), not composite actions: a
composite action cannot vary `runs-on` or own its artifacts, and the iOS run must execute on
`macos-26` in one row and `macos-15` in another. Everything that does not differ between
platforms — version swap, `bun install --frozen-lockfile`, Maestro install, fixture server —
lives in a single composite action, so those steps exist once rather than six times.

Reusable workflow inputs: `rn-version` (e.g. `0.87`, selecting the `e2e/rn-matrix` variant),
`device` (Android API level, e.g. `36`; or iOS simulator runtime, e.g. `26`), `runner`
(the `runs-on` label), and `blocking` (false ⇒ the job sets `continue-on-error`).

Quarantine rides on Maestro's own tags: the gate runs `maestro test --exclude-tags=flaky`,
nightly adds an always-non-blocking `--include-tags=flaky` job. Marking a flow unstable is a
one-line change in its YAML — visible in review, greppable, impossible to overlook.

Caching that matters for wall-clock: AVD snapshot (supported by
`reactivecircus/android-emulator-runner`, the single largest saving on Android), Pods keyed
on `Podfile.lock` **plus the RN version**, and Gradle via the existing
`gradle/actions/setup-gradle`.

Concurrency is declared once at the orchestrator level (`e2e-${{ github.ref }}`,
`cancel-in-progress`) so a new push cancels all four jobs at once. Today each workflow has
its own group, so cancellation is partial.

## Fixes to existing workflows (in scope)

1. **The Pods cache never restores.** `e2e-ios.yml` places `Cache Pods` *after*
   `Install pods`, and `actions/cache` restores at its own step position — so `pod install`
   always runs cold. Move it before, and include the RN version in the key so the three
   variants do not evict each other.
2. **`|| true` after `xcodebuild ... | xcbeautify` swallows build failures.** The job
   continues and fails later at app installation with a misleading message. Replace with
   `set -o pipefail` and a real exit code. This is a false-negative factory.
3. **`npx --yes serve` is a network dependency in every job.** Replace with a ~15-line
   static server at `e2e/fixtures/serve.mjs` on `node:http` — no dependencies, no network,
   deterministic startup.
4. **Artifact names collide under a matrix.** `upload-artifact@v4` errors on duplicate
   names; the current fixed names (`e2e-ios-artifacts`) must include the RN version and
   device.

## Reporting and trust

**A red result must be diagnosable without local reproduction.** In addition to the JUnit
report and `~/.maestro/tests/**` that the current workflows upload, each job captures the
device log (`adb logcat` / `simctl spawn log`) on failure and passes Maestro's
`--debug-output`, which writes a screenshot and view hierarchy at the failing assertion.
Without the latter, `Assertion is false: id: e2e-host-ready is visible` carries no
information — during the spike it was the screenshot that revealed the Nitro red screen and
turned an hour of guessing into a minute.

**Results are visible without downloading artifacts.** A small script renders the JUnit XML
into `$GITHUB_STEP_SUMMARY` as a table. The choice of an in-repo script over a third-party
action is deliberate: the gate must stay free and free of external services, and every
third-party action in a pipeline is a trusted party with token access.

**Nightly regressions cannot disappear.** Fifteen non-blocking jobs a night means nobody
watches them by default. A failing nightly row opens **one** issue per matrix row
(platform + RN + device), deduplicated by title, updated rather than duplicated on
subsequent nights, and closed automatically when the row goes green. Implemented with `gh`
and `GITHUB_TOKEN`; no external service. Without deduplication, fifteen jobs over a week
would produce a hundred issues and a disabled nightly.

**Quarantine decisions are data-driven.** Nightly appends a small JSON result record to an
orphan `e2e-results` branch; a script computes per-flow pass rates over the last N runs.
The same data yields the consecutive-green counter that `CONTEXT.md` requires before any
check is marked required — turning that rule from a note into a number printed in the job
summary. This is also the data source the D7 public dashboard will later read.

## Manual setup (one-time)

Three things a human must do in the repository (or org) settings before this pipeline
works end to end. None of them is enforced by, or visible in, any workflow's
`permissions:` block, so a missing one fails silently or nightly-quiet rather than at
review time:

1. **Create the orphan `e2e-results` branch.** `e2e-nightly.yml`'s report job clones it
   to persist history; until it exists, the job logs a warning and classifies rows for
   issue-reporting purposes only, without persisting anything (see that workflow's
   "Classify rows" step). One-time: create an empty orphan branch and push it to origin.
2. **Create the `e2e-nightly` label.** `nightly-issue.mjs` requires this label on every
   issue it owns, and uses it (together with an exact title match) to identify which open
   issues are actually its own versus a same-titled issue a human opened by hand. One-time:
   `gh label create e2e-nightly`.
3. **Enable "Allow GitHub Actions to create and approve pull requests"** (repo or org
   Settings → Actions → General). `e2e-lockfile-refresh.yml`'s `gh pr create` step needs
   this in addition to its own `pull-requests: write` permission — GitHub gates PR
   creation by the default `GITHUB_TOKEN` behind this separate control, and it is off by
   default on many repos/orgs. Without it, the weekly lockfile-drift PR fails to open and
   nothing signals why beyond the workflow's own run log. See the comment next to
   `gh pr create` in that workflow.

## Out of scope

Public dashboard and GitHub Pages publication (D7), execution-time trend analysis, DRM,
plugin conformance flows, tvOS, and screenshot comparison. All of these read from the same
`e2e-results` branch when their time comes, so none of this work needs rewriting.

## Open risks

- **RN 0.82 is unverified.** It may need its own fixes, discovered only when the row first
  runs.
- **Nitro 0.35-generated code against a 0.37 runtime is observed to work, not guaranteed.**
  A future Nitro release may force regeneration in the library, which would push the overlay
  into the root workspace and invalidate D12.
- **API 36 emulator images on GitHub runners are assumed available and KVM-accelerated.**
  Unverified; if boot times prove unstable, the PR Android device drops to API 35.
- **Ownership (Z4 in `CONTEXT.md`) remains unassigned.** Nightly issues need a human owner,
  or the deduplicated issue simply stays open forever.
