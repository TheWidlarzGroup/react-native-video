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
  (short mp4, tiny HLS VOD, intentionally broken manifest). Public streams (Apple/Mux)
  only in nightly, non-blocking. DRM in CI: ClearKey / Widevine L3 on Android emulator only.
  FairPlay is out of CI scope (manual / OSS device-cloud programs).
- **D4 — CI: free standard GitHub-hosted runners only.** Unlimited for public repos incl.
  macOS (max 5 concurrent macOS jobs). No larger runners, no paid services.
- **D5 — Agents never ARE the test.** The gate is deterministic Maestro. agent-device
  (Callstack, MIT) is an optional authoring accelerator: record a run → export strict
  Maestro YAML → human review → plain YAML lands in repo.
- **D6 — Community writes cases, maintainers own infrastructure.** Scenario catalog as
  `good-first-test` issues, one exemplary flow per assertion type, rule: "bugfix in an
  E2E-coverable area ⇒ PR includes a reproducing flow".
- **D7 — v7 differentiator: tested cross-platform event contract.** Plugins run the same
  shared conformance flows as core.

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
  (`tags: [flaky]`) with an issue, and drops out of the gate until it is fixed. The single
  exception is transport, not behaviour: `e2e/shared/open-scenario.yaml` retries the
  `openLink` command itself, because `simctl openurl` on hosted macOS runners has timed
  out before the app received anything. What the app then shows is never retried.
- **iOS: the first deep link on a fresh simulator can raise "Open in app?", and the link
  after that confirmation never reaches JS.** The iOS leg runs
  `e2e/warmup/ios-approve-open-link.yaml` once before the suite to take that confirmation
  out of the real flows' way; the shared subflow still handles it defensively.
- v7 API only in the test app: `useVideoPlayer` + `VideoView` + `useEvent`,
  `player.seekTo()`. No `<Video>` component, no v6 `drm` prop.
- No check becomes *required* in branch protection before 10–15 consecutive clean runs
  (the nightly job summary prints the current streak).

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
  event on the single root.
- **Android: `Linking.getInitialURL()` can read the previous activity's intent.** RN's
  `IntentModule.getInitialURL()` reads `getCurrentActivity().intent`, and
  `getCurrentActivity()` can lag behind the redirect for a brief window, returning `null`
  for the first link. `App.tsx` re-reads it at 300 ms and 1 s on Android only, and stops
  re-reading once a `url` event has arrived (after which the original intent is stale).
- **Android 15+ draws edge-to-edge and `SafeAreaView` is iOS-only.** Without a top
  padding equal to `StatusBar.currentHeight`, the first marker renders under the status
  bar and Maestro drops it from the hierarchy as invisible ("Skipping invisible child").
  Local runs on API 34 never showed this; API 35/36 do.
- **Taps are immediate on Android, deferred on iOS.** The iOS driver only delivers a tap
  once the player goes idle (below); the Android driver delivers it at once. Flows that
  must work on both use absolute actions (`btn-play`, `btn-seek-1`, `btn-loop-toggle` with
  the value tracked in JS), never state-dependent toggles.
- **`loop` is reported differently per platform.** AVPlayer fires `onEnd` on every loop
  pass; ExoPlayer's repeat mode wraps silently (no `onEnd`, no `onSeek`) and only progress
  jumping from the end of the clip back to its start betrays it. `evt-loop-verified`
  covers both (see `eventLog.ts`).
- **Every control press is logged** (`press:<control> -> <value>`) so a failing flow's
  hierarchy dump shows what actually landed and when; each `App` instance logs its root id
  with the scenario, which is how the two-root problem above was found.
- **`useSyncExternalStore` bails out on same-reference snapshots.** Every mutation in
  `eventLog.ts` produces a new `Set`/array; mutating in place never re-renders.
- **`onError` only fires from a rejected JS promise or a caught synchronous throw.** A
  source that resolves `initialize()` optimistically and fails later (a 404 on iOS) only
  surfaces via `onStatusChange('error')`. The test app listens to both.
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
    `isPlaying`) reads stale state when it finally lands. Track the next value in JS
    (`ScenarioScreen.tsx`'s `rateStepRef`) and/or interact only once the player is idle
    (`smoke-loop`, `smoke-replay-after-end`).
  - A **"pause mid-playback" flow is not achievable** under this constraint and was
    dropped rather than shipped passing vacuously. Revisit if Maestro's idle detection
    changes.
  - **`loop` needs an unassisted restart to prove anything**: the loop-toggle tap lands
    too late for the first natural end (iOS) and a manual replay produces a second end
    regardless. `smoke-loop.yaml` seeks + plays once, then makes no further taps; only
    `loop` itself can produce end #3 (iOS) or a silent wrap-around (Android).
