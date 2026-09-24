# react-native-video — E2E: Context & Decision Record

Why the E2E harness is built the way it is, and the non-obvious things that cost days to
find. Read this before changing the test app, the flows, or the CI workflows.

How to run the suite and how to add a flow: [`README.md`](README.md). The CI matrix
(decisions D8–D13): [`CI_MATRIX_DESIGN.md`](CI_MATRIX_DESIGN.md).

## Decisions (D1–D7)

- **D1 — Runner: Maestro.** YAML flows, no compiled test code, low contribution barrier,
  works on new arch. Not Detox/Appium.
- **D2 — Core engineering artifact: test app with an Event Log Screen.** Player events are
  rendered as text with stable `testID`s; Maestro asserts on those. Derived boolean markers
  (e.g. `evt-progress-gt-2s`) instead of parsing numbers in YAML. Scenarios are opened via
  deep links (`rnvtest://scenario/<name>`), never via UI navigation.
- **D3 — Deterministic media.** Local fixtures served from a job-local HTTP server
  (short mp4, tiny HLS VOD, intentionally broken manifest). No flow depends on an external
  stream, so a red run is never the network.
- **D4 — CI: standard GitHub-hosted runners.** `ubuntu-latest` for Android, `macos-26` /
  `macos-15` for iOS. Hosted macOS runners are limited to 5 concurrent jobs, which shapes
  the matrix (`CI_MATRIX_DESIGN.md`).
- **D5 — Agents never ARE the test.** The gate is deterministic Maestro. A flow may be
  drafted with any tool, but what lands in the repo is plain YAML a human has reviewed.
- **D6 — A bug fix brings a reproducing flow.** A fix in an area the suite can exercise
  includes a flow that fails without it (`CONTRIBUTING.md`, "Testing your change"). The
  harness itself (test app, CI workflows, scripts) is maintained alongside the library.
- **D7 — One flow for both platforms.** Every flow runs unchanged on Android and iOS.
  Platform differences in how the player reports an event (e.g. `loop`, below) are absorbed
  by the test app's markers, never by per-platform flows.

## Practical rules

- Android emulator reaches the host fixture server via `http://10.0.2.2:<port>`,
  iOS simulator via `http://localhost:<port>`. The test app selects the base URL via
  `Platform.select` (see `fixtures.ts`). Plain-HTTP fixtures on Android need cleartext
  traffic enabled; `test-app/rnv-e2e-plugin.mjs` sets it on the debug manifest.
- Standard `ubuntu-latest` runners have KVM; the udev rule step must run before the
  emulator starts (see `_e2e-android.yml`).
- Keep clips 5–15 s — `onEnded` tests must not wait minutes.
- **Zero retries.** A flow is never re-run to turn it green — a retry hides exactly the
  race conditions this suite exists to catch. A flow that proves unstable gets quarantined
  (`tags: [flaky]`) with an issue, and drops out of the gate until it is fixed. The only
  exceptions are transport, not behaviour. On iOS the deep link is opened by the fixture
  server (`POST /__open-link`, `e2e/fixtures/open-link.mjs`), which retries `simctl
  openurl`, because on hosted macOS runners that command has timed out
  (NSPOSIXErrorDomain 60) while the link still arrived seconds later. It cannot be done in
  the flow: Maestro's `retry` and `optional` only catch `MaestroException`, and this
  failure is an `IllegalStateException`, so a `retry` around `openLink` never ran a second
  attempt. A link delivered twice is harmless (the screen is keyed on the scenario). The
  other one is `e2e/shared/press.yaml`, which re-sends a tap only when the app never
  rendered the `pressed-<testID>-<n>` marker: it is set synchronously in `onPress`, so it
  proves delivery and nothing else, and a missing marker is a plain assertion failure,
  which Maestro's `retry` does catch. What the app then shows is never retried.
- **Android: Maestro's first driver connection can die at start-up** (nightly 2026-09-22,
  RN 0.87 / API 36: `DeviceServerDiedException ... UNAVAILABLE` on the first flow's first
  command, 3 s after the driver came up; the other nine flows passed). No mitigation yet.
  A warm-up run before the suite does not help: every `maestro test` process installs,
  connects and uninstalls its own driver, so the suite's first connection is still a first
  connection.
- **iOS: the first deep link on a fresh simulator can raise "Open in app?", and the link
  after that confirmation never reaches JS.** The iOS leg runs
  `e2e/warmup/ios-approve-open-link.yaml` once before the suite to take that confirmation
  out of the real flows' way; the shared subflow still handles it defensively.
- **iOS: an unanswered "Open in app?" prompt outlives the app and hides it.** The prompt
  belongs to SpringBoard: it survives `stopApp`, `clearState` and `launchApp`, and while it
  is up the app is missing from the hierarchy, so `e2e-host-ready` never becomes visible.
  On a slow `macos-15` runner the prompt came up only after the warm-up had stopped
  waiting for it (no prompt 20 s after `openLink`), and that leg lost all 10 flows.
  `launch-app.yaml` therefore taps Open on a prompt that is already up after launch and
  relaunches. Open rather than Cancel, so the approval sticks. With no prompt the check
  takes ~7 s per launch (Maestro's fixed lookup time for a `when: visible` that is false;
  7.5 s measured in CI), which did not show up in leg durations against runner variance.
- v7 API only in the test app: `useVideoPlayer` + `VideoView` + `useEvent`,
  `player.seekTo()`. No `<Video>` component, no v6 `drm` prop.
- No check becomes *required* in branch protection before 10–15 consecutive clean runs
  (the nightly job summary prints the current streak). Only `unit` and `e2e` qualify:
  they have no path filter on `pull_request`. `lint-workflows` and `Test Documentation
  Build` are path-filtered and must stay optional, because a workflow skipped by a path
  filter leaves its check Pending, which blocks merging (a job skipped by `if:` reports
  Success instead, so any future filter belongs on the callee `maestro` jobs).

## Test app gotchas

- **react-native-test-app does not bundle JS in Gradle or Xcode.** It embeds the files
  listed under `resources` in `app.json` (`test-app/dist/`) and falls back to Metro when
  they are missing. CI runs `bun run build:<platform>` first; on iOS that must happen
  before `pod install`, which is when the resources are resolved.
- **RNTA's Android manifest can go stale.** `react-native bundle` (through
  `react-native.config.js`) runs RNTA's manifest generator, which copies RNTA's
  `AndroidManifest.xml` into `android/app/build/generated/rnta/` and afterwards skips
  regeneration unless `app.json` is newer than that file. The config plugins (deep-link
  intent filter, cleartext HTTP) are applied to RNTA's source manifest later, at Gradle
  settings time, so a bundle-then-build sequence ships an APK without the intent filter
  and every `openLink` fails with "unable to resolve Intent". CI applies the plugins
  explicitly and deletes the generated manifest before Gradle; locally, delete it or
  touch `app.json` after the bundle step.
- **iOS deep links need `RCTLinkingManager`, not just `CFBundleURLTypes`.** RNTA's
  `SceneDelegate` already forwards to it; a hand-rolled AppDelegate would have to.
- **`openLink` right after `launchApp` drops the link.** `RCTLinkingManager.getInitialURL()`
  only reads `UIApplicationLaunchOptionsURLKey` (a true OS-level cold launch via URL);
  `openLink` goes through `application:openURL:options:`, which posts the `'url'`
  notification fire-and-forget. If it arrives before JS has subscribed it is lost, with no
  error. The test app therefore renders `e2e-host-ready` only after its `Linking` listener
  is attached (`App.tsx`), and every flow waits for that marker before `openLink`.
- **Android: one activity, one React root.** RNTA's singleApp mode forwards a deep link
  from `MainActivity` into `ComponentActivity` (see `test-app/patches/`). Without
  `CLEAR_TOP | SINGLE_TOP` on that redirect, a second link in the same session opened a
  second `ComponentActivity` with a second React root; RN broadcasts the `url` event to
  every root, so two scenarios mounted and two players played at once. The patch makes the
  existing activity receive the link via `onNewIntent`, which reaches JS as the `url`
  event on the single root. Since every flow opens its links into the running app, they
  all arrive as `url` events; `Linking.getInitialURL()` only matters for a cold launch
  from a link, which no flow does.
- **Android 15+ draws edge-to-edge and `SafeAreaView` is iOS-only.** Without a top
  padding equal to `StatusBar.currentHeight`, the first marker renders under the status
  bar and Maestro drops it from the hierarchy as invisible ("Skipping invisible child").
  Local runs on API 34 never showed this; API 35/36 do.
- **API 34 kills an app launched within ~1 s of `pm clear`.** Clearing state removes the
  previous task; when that removal's 1 s destroy timeout fires, Android 14 kills the
  package's current process ("Destroy timeout of remove-task" then "Killing <pid> (adj
  -10000): remove task" in logcat), which by then is the one Maestro just started. The
  activity survives without a React root: a white screen and no `e2e-host-ready`.
  `launchApp: {clearState: true}` starts the app ~0.9 s after the clear on a hosted runner,
  which cost 5 of 30 flows across the API 34 nightly legs and none on API 35/36. Hence
  `launch-app.yaml` runs `clearState`, waits 2.5 s on Android, then `launchApp`.
- **Taps are immediate on Android, deferred on iOS.** The iOS driver only delivers a tap
  once the player goes idle (below); the Android driver delivers it at once. Flows that
  must work on both use absolute actions (`btn-play`, `btn-seek-1`, `btn-loop-on`), never
  state-dependent toggles.
- **`loop` is reported differently per platform.** AVPlayer fires `onEnd` on every loop
  pass; ExoPlayer's repeat mode wraps silently (no `onEnd`, no `onSeek`) and only progress
  jumping from the end of the clip back to its start betrays it. `evt-loop-verified`
  covers both (see `eventLog.ts`).
- **Every control press is logged** (`press:<control>`, e.g. `press:rate 2x`) so a failing flow's
  hierarchy dump shows what actually landed and when. Duplicated entries in that log are
  how the two-root problem above was found.
- **`useSyncExternalStore` bails out on same-reference snapshots.** Every mutation in
  `eventLog.ts` produces a new `Set`/array; mutating in place never re-renders.
- **`onError` and the error status are separate markers.** `evt-onError` is set only by
  `onError`, `evt-status-error` only by `onStatusChange('error')`, and `evt-onError-repeated`
  by a second `onError` in one scenario. An async failure (a 404, on both platforms)
  reports both events, but `onError` only once (#5083); the error flows assert all three.
- **`initializeOnCreation: true` (the default) defers the `useVideoPlayer` setup callback**
  until the native load reaches `onLoadStart`/`onStatusChange`; a source that fails
  immediately never gets there, so no listener is ever attached. Every scenario source sets
  `initializeOnCreation: false`, attaches listeners inside setup, then calls
  `player.initialize()` explicitly. Because setup then runs synchronously during the first
  render, the event log is reset at the top of setup, not in an effect (an effect would
  run after the first events and wipe them).
- **`onError` is JS-only and un-buffered.** Register listeners with
  `player.addEventListener(...)` inside the setup callback, not via `useEvent` in the
  component body, or a fast local failure is lost.

## Flow-design gotchas (Maestro)

- **A tap can be lost between the driver and JS even on an idle player** (#5130). Nightly
  2026-09-21 and 09-22, iOS 26 with RN 0.87 only: `btn-mute` was tapped 2.4 s after
  `onEnded`, the simulator log shows touch-down and touch-up reaching the app's window,
  and `onPress` never ran. Same symptom as the tap lost 264 ms after `onEnded` on
  2026-09-15, so the settle in `wait-for-end.yaml` is not a complete answer. Flows that
  press on an idle player go through `e2e/shared/press.yaml`, which re-taps only when the
  app never rendered `pressed-<testID>-<n>`. Root cause not established; evidence in the
  issue.
- **A scenario that fails before any playback attempt fires no player event on a truly
  cold launch.** `smoke-error-404.yaml` and `smoke-broken-manifest-error.yaml` therefore
  open the mp4 scenario first. The root cause is unknown (it looks like a native/Nitro
  registration path that only completes on a real playback attempt). This is a workaround,
  not a fix: if the cause is a library cold-start bug, these flows cannot catch it. Worth
  root-causing.
- **A `tapOn` issued while the video is actively decoding is not delivered until the
  player goes idle** (paused/ended). Reproduced on iOS Simulator even with a button whose
  handler only writes to the JS log, so it is the test driver's idle heuristic, not the
  player. Consequences for flow design:
  - An **absolute value-set** (`seekTo(5)`, `player.muted = true`) is fine whenever the
    deferred tap lands: `smoke-seek`, `smoke-mute-volume`, `smoke-hls-seek`.
  - A **relative** action (`rate = f(current rate)`, a play/pause toggle keyed on
    `isPlaying`) reads stale state when it finally lands. The test app therefore has no
    toggles: every control in `ScenarioScreen.tsx` sets an absolute value (`btn-rate-2`,
    `btn-mute` / `btn-unmute`), and flows that depend on playback state interact only
    once the player is idle (`smoke-loop`, `smoke-replay-after-end`).
  - A **"pause mid-playback" flow is not achievable** under this constraint and was
    dropped rather than shipped passing vacuously. Revisit if Maestro's idle detection
    changes.
  - **`loop` needs an unassisted restart to prove anything**: the `btn-loop-on` tap lands
    too late for the first natural end (iOS) and a manual replay produces a second end
    regardless. `smoke-loop.yaml` seeks + plays once, then makes no further taps; only
    `loop` itself can produce end #3 (iOS) or a silent wrap-around (Android).
