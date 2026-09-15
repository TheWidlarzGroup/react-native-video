# E2E CI Matrix — Design

Companion to [`CONTEXT.md`](CONTEXT.md), which holds decisions D1–D7 and the scope of the
suite. This document covers the CI matrix that runs the E2E suite across React Native
versions and platforms, and continues the decision numbering at D8.

## Goal

Run every PR through the Maestro E2E suite across multiple React Native versions and both
platforms, in parallel, on free GitHub-hosted runners. The system must not become a
bottleneck (a PR waiting on a queue) and must not produce false positives (red for reasons
unrelated to the change) or false negatives (green that hides a real break). Success is
measured by regressions caught before merge, not by matrix size.

## Decisions (D8–D13)

- **D8 — Three RN versions:** floor (0.77), middle (0.82), latest (0.87). Wide enough to
  catch mid-range breaks, narrow enough to fit the free macOS concurrency limit.
- **D9 — Asymmetric gate.** Per PR: Android × every RN version, iOS × one RN version.
  Nightly: the full grid plus older OS versions. Rationale in "Why this is not a
  bottleneck" below.
- **D10 — OS versions are a real dimension.** PR runs Android API 36 and iOS 26. Nightly
  adds API 35, API 34 and iOS 18.
- **D11 — Zero retries, explicit quarantine.** No flow is ever retried. A flow judged
  unstable gets a `flaky` tag, drops out of the gate, and keeps running in nightly as a
  separate non-blocking report. Quarantine is visible in the diff and countable.
- **D12 — Version swap by overlay + committed lockfile,** scoped to `test-app/`'s
  manifest. See "Version-swap mechanism" for the cost this carries today.
- **D13 — The iOS gate tracks the newest RN version that is green.** Android covers every
  version per PR, so the single iOS job buys platform coverage; pairing it with the newest
  version puts it where version-specific breakage occurs. Today that is 0.87; the floor's
  iOS build is covered by nightly.

## RN 0.87 support

The version swap works: bun nests `test-app/node_modules/{react-native,react,
react-native-nitro-modules}` while the root stays on 0.77 / nitro 0.35 for the library,
and CocoaPods follows the nested copy. RNTA 5.4.9 declares `react-native: 0.76 - 0.87`, so
the pinned version (with the deep-link patch in `test-app/patches/`) covers the whole
matrix.

RN 0.87 needed three changes, all in place:

1. `ReactNativeVideo.podspec` no longer publishes `ios/Video-Bridging-Header.h` as a public
   header (issue #5084; the same change as PR #5085). `add_nitrogen_files` appends the
   Nitrogen headers after it, so it led the umbrella header and loaded module `React`
   first; under the prebuilt core `jsi/jsi.h` belongs to module `React`, and NitroModules'
   textual `#include "jsi/jsi.h"` then failed to compile.
2. Three quoted imports of React headers are framework-style — under the prebuilt core
   `RCTBridge.h` is not in the Pods header tree at all. The `<React/…>` form resolves on
   the floor as well:
   - `ios/view/fabric/RCTVideoViewViewManager.mm` — `<React/RCTBridge.h>`
   - `ios/view/paper/RCTVideoViewViewManager.m` — `<React/RCTEventDispatcher.h>`
   - `ios/view/fabric/RCTVideoViewComponentView.mm` — `<React/RCTFabricComponentsPlugins.h>`
3. `react-native-nitro-modules` is `0.37.1` in the 0.82 and 0.87 overlays. With 0.35.0 the
   app builds and launches, then red-screens with `Failed to install Nitro:
   installJSIBindingsWithRuntime: was not called`.

Verified locally (Xcode 26.6): the full Maestro suite passes on RN 0.87.1 on an iOS 26.5
simulator and an Android API 36 emulator, and on RN 0.77 on iOS with changes 1 and 2
applied. The library's committed nitrogen-0.35 output runs against the Nitro 0.37.1
runtime, so no regeneration is needed today; if that changes, the overlay would have to
reach the root workspace and D12 must be revisited.

RN 0.82 passes on Android in the PR gate; its iOS rows run in nightly only.

## Matrix

### PR gate — 4 parallel jobs

| Job | Runner | RN | Device |
|---|---|---|---|
| `android (0.77) / maestro` | `ubuntu-latest` | 0.77 | API 36 |
| `android (0.82) / maestro` | `ubuntu-latest` | 0.82 | API 36 |
| `android (0.87) / maestro` | `ubuntu-latest` | 0.87 | API 36 |
| `ios / maestro` | `macos-26` | 0.87 | iOS 26 |

### Nightly — 15 coverage jobs, none blocking

- Android: 3 RN × API 36 / 35 / 34 = 9 jobs on `ubuntu-latest`.
- iOS: 3 RN × iOS 26 (`macos-26`) + 3 RN × iOS 18 (`macos-15`) = 6 jobs. `macos-26`
  carries iOS 26 only; `macos-15` carries both iOS 18.x and 26.x.
- Quarantine: when at least one flow is tagged `flaky`, one extra job per platform runs
  `--include-tags=flaky` at the floor RN version (Android API 36, iOS 26). Maestro refuses
  a tag filter that matches nothing, so the plan only schedules these legs when the tag
  is actually in use.

The whole plan (rows, artifact names, shape guard, flaky detection) is computed by
`scripts/e2e/matrix-plan.mjs`, which has unit tests; the workflow only calls it.

### Why this is not a bottleneck

The free plan for a public repository allows 20 concurrent jobs but only **5 concurrent
macOS jobs**. The gate consumes 1 macOS job per PR, so five simultaneous PRs still fit; a
sixth queues only its iOS job, not the whole gate. A symmetric 3×2 gate would consume 3
macOS jobs per PR and queue from the second PR onward. Orchestrator-level `concurrency`
with `cancel-in-progress` frees the macOS slot immediately on a new push.

Nightly exceeds the macOS limit (6–7 macOS jobs, 5 at a time) and runs in two waves.
`timeout-minutes` is measured from when a job starts on a runner, so the second wave gets
its own full budget; worst case is about two hours, which costs nothing overnight.
`cancel-in-progress: false` queues a run that spills into the next trigger rather than
overlapping it.

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
working test app.

`overlay.json` holds differences only — for 0.87 that is `react`, `react-native`,
`react-native-nitro-modules`, the four `@react-native/*` packages, the three
`@react-native-community/cli` packages and `@types/react`. The base stays a single source
of truth.

`node scripts/e2e/use-rn-version.mjs <version>` merges the overlay into
`test-app/package.json` and copies the variant `bun.lock` over the root one. The caller then
runs `bun install --frozen-lockfile`. It **must** run before `pod install` and `gradlew`,
which read `node_modules`. A pre-commit hook refuses to commit the root lockfile or the
test-app manifest while switched.

`--refresh` merges the overlay, runs `bun install` *without* `--frozen-lockfile`, copies the
resulting root `bun.lock` back into the variant directory and restores the floor files —
even if the install fails. Used by the weekly bot job and by anyone adding a version.

`--frozen-lockfile` is what makes a red job trustworthy: a job cannot silently pick up a new
transitive version. Dependency drift becomes its own weekly bot PR instead of noise in
someone else's gate.

**Cost, and the current limitation of D12:** the variant lockfiles snapshot the *whole*
workspace, so any `package.json` change anywhere in the monorepo (library, example, docs)
makes the frozen install fail on the non-floor legs until the variants are regenerated
and committed in the same PR (`e2e/rn-matrix/README.md`). The frozen-install failure
message says exactly that. Decoupling `test-app/` from the root workspace (its own small
lockfile, the library via `link:`) would remove this; it is the obvious next step if the
regeneration becomes a recurring annoyance.

## Workflow structure

```
.github/workflows/
  e2e.yml                  # orchestrator: PR gate
  e2e-nightly.yml          # orchestrator: full matrix + quarantine + report
  e2e-lockfile-refresh.yml # weekly bot PR
  _e2e-android.yml         # reusable: one Android run
  _e2e-ios.yml             # reusable: one iOS run
.github/actions/
  setup-bun/               # bun + node_modules cache (separate namespace for frozen callers)
  e2e-setup/               # composite: RN version swap, frozen install, JS bundle, Maestro, fixture server
```

Platform runs are **reusable workflows** (`workflow_call`), not composite actions: a
composite action cannot vary `runs-on` or own its artifacts, and the iOS run must execute on
`macos-26` in one row and `macos-15` in another. Everything that does not differ between
platforms lives in the `e2e-setup` composite action.

Reusable workflow inputs: `rn-version`, the device (`api-level` / `runner` + `ios-runtime`
+ `sim-device`), `blocking` (false ⇒ `continue-on-error`), `tags` (Maestro tag selection)
and `artifact-name` (the nightly orchestrator passes the name it expects to download, so
its expected-row list and the actual uploads cannot drift).

Quarantine rides on Maestro's own tags: the gate runs `maestro test --exclude-tags=flaky`,
nightly adds `--include-tags=flaky` legs when the tag is in use. Marking a flow unstable is
a one-line change in its YAML — visible in review, greppable.

Caching: Pods keyed on the runner image, the RN version and `Podfile.lock`; xcodebuild's
DerivedData keyed on everything that feeds the iOS build (a cold Pods build is ~12 minutes
on a hosted runner, an incremental one a fraction of that); Gradle's dependency and build
caches via `gradle/actions/setup-gradle` with `--build-cache`, written from PR runs too;
and `node_modules` in a namespace separate from the docs workflows' cache (with the patch
files in the key, since patch-package cannot re-apply a changed patch to an
already-patched tree). The iOS simulator boots in the background from the moment it is
resolved, overlapping pod install and the build. The Android emulator deliberately boots cold:
resuming a saved snapshot produced system-process ANR dialogs ("System UI isn't
responding") that covered the app and made every flow fail on its first assertion.

## Reporting and trust

**A red result must be diagnosable without local reproduction.** Each job uploads the JUnit
report, Maestro's `--debug-output` (screenshot and view hierarchy at the failing
assertion) and the device log (`adb logcat` / `simctl log show`).

**Results are visible without downloading artifacts.** `scripts/e2e/junit-summary.mjs`
renders the JUnit XML into `$GITHUB_STEP_SUMMARY`. An in-repo script rather than a
third-party action: the gate stays free of external services, and every third-party action
is a trusted party with token access.

**Nightly regressions cannot disappear.** A failing nightly row opens **one** issue per
matrix row (platform + RN + device), deduplicated by title and the `e2e-nightly` label,
updated rather than duplicated on subsequent nights, and closed automatically when the row
goes green (`scripts/e2e/nightly-issue.mjs`, via `gh` and `GITHUB_TOKEN`).

**Quarantine decisions are data-driven.** Nightly appends one JSON line per row to an
orphan `e2e-results` branch, with each flow's result, so per-flow pass rates can be read
from the history; `scripts/e2e/record-result.mjs` also reports the consecutive-green
counter that gates marking a check required. A missing, truncated or empty report is
recorded as a failure, never as green.

### Cache budget

The repository's Actions cache is 10 GB with LRU eviction beyond that. Two rules keep it
in shape: entries are only restorable across branches when written on the default
branch, so `e2e.yml` and `unit.yml` also run on pushes to `master` (that is what keeps a
fresh pull request warm); and `cache-cleanup.yml` deletes a pull request's entries when
it closes and, daily, keeps only the newest entry of each cache family per ref.

## Manual setup (one-time)

None of these is enforced by any workflow's `permissions:` block, so a missing one fails
quietly:

1. **Create the orphan `e2e-results` branch.** Until it exists the nightly report job logs
   a warning and classifies rows for issue reporting only, without persisting history.
2. **Create the `e2e-nightly` label** (`gh label create e2e-nightly`). `nightly-issue.mjs`
   uses it, together with an exact title match, to tell its own issues from a same-titled
   issue a human opened.
3. **Enable "Allow GitHub Actions to create and approve pull requests"** (Settings →
   Actions → General). `e2e-lockfile-refresh.yml`'s `gh pr create` needs it in addition to
   `pull-requests: write`; it is off by default on many repos and orgs.

## Out of scope

Public dashboard and GitHub Pages publication (D7), execution-time trend analysis, DRM,
plugin conformance flows, tvOS, and screenshot comparison. All of these read from the same
`e2e-results` branch when their time comes.

## Open risks

- **RN 0.87 on iOS is verified locally, not yet on a hosted runner.** The first gate run
  after the switch builds its Pods and DerivedData from scratch (new cache keys).
- **RN 0.82 on iOS is unverified.** It may need its own fixes, discovered when the nightly
  row first runs.
- **Nitro 0.35-generated code against a 0.37 runtime is observed to work, not guaranteed.**
- **API 36 emulator images on GitHub runners are assumed available and KVM-accelerated.**
  If boot times prove unstable, the PR Android device drops to API 35.
- **Nightly issues need a human owner,** or a deduplicated issue simply stays open forever.
