# react-native-video — E2E: Context & Decision Record

Why the E2E harness is built the way it is, and the non-obvious things that cost days to
find. Read this before changing the test app, the flows, or the CI workflows.

How to run the suite and how to add a flow: [`README.md`](README.md).

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

## Practical gotchas

- Android emulator reaches the host fixture server via `http://10.0.2.2:<port>`,
  iOS simulator via `http://localhost:<port>`. The test app selects the base URL via
  `Platform.select` (see `fixtures.ts`).
- Plain-HTTP fixtures on Android require cleartext traffic enabled for the test app
  (debug manifest: `android:usesCleartextTraffic="true"` or a network security config
  scoped to `10.0.2.2`).
- Standard `ubuntu-latest` runners have KVM; you must add the udev rule step before
  starting the emulator (see workflow).
- Keep clips 5–15 s — `onEnded` tests must not wait minutes.
- **Zero retries.** A flow is never re-run to turn it green — a retry hides exactly the
  race conditions this suite exists to catch. A flow that proves unstable gets quarantined
  (`tags: [flaky]`) with an issue, and drops out of the gate until it is fixed.
- v7 API only in the test app: `useVideoPlayer` + `VideoView` + `useEvent`,
  `player.seekTo()`. No `<Video>` component, no v6 `drm` prop.

## Gotchas found while building the MVP scaffold (verified manually on iOS simulator)

- **iOS deep links need an AppDelegate hook, not just Info.plist.** Adding
  `CFBundleURLTypes` registers the scheme with the OS, but `Linking.getInitialURL()` /
  the `'url'` event never fire unless `AppDelegate` forwards to `RCTLinkingManager`:
  `override func application(_ app: UIApplication, open url: URL, options: ...) -> Bool { RCTLinkingManager.application(app, open: url, options: options) }`.
  Without it, `openLink` in Maestro silently does nothing — no error, no crash.
- **`useSyncExternalStore` bails out on same-reference snapshots.** An event-log store
  (`eventLog.ts`) whose `mark()`/`log()` mutate the same `Set`/array in place will never
  re-render subscribers, even though `emit()` fires — React compares the last and next
  `getSnapshot()` by `Object.is`. Every mutation must produce a new `Set`/array.
- **`onError` only fires from a rejected JS promise or a caught synchronous throw**
  (`VideoPlayer.ts`'s `throwError`, called from `initialize()`/`preload()`/
  `replaceSourceAsync()` rejections or a caught `play()`/`seekTo()` exception) — it is
  *not* raised when AVPlayerItem's async status observer later notices a failure
  (`HybridVideoPlayer+Events.swift` just sets `status = .error` and emits
  `onPlaybackStateChange`). A 404 source resolves `initialize()` optimistically and only
  fails afterwards, so `onError` never fires for it — only `onStatusChange('error')` does.
  **Listen to both** for a reliable error marker.
- **With `initializeOnCreation: true` (the default), `useVideoPlayer` defers its `setup`
  callback until the native side's own auto-triggered load reaches `onLoadStart` /
  `onStatusChange`.** A source that fails immediately never reaches that point, so `setup`
  — and every listener registered inside it — never runs at all. Fix: set
  `initializeOnCreation: false` on every scenario source and call `player.initialize()`
  explicitly inside `setup`, after attaching listeners, before `play()`.
- **`onError` is JS-only and un-buffered** (`VideoPlayerEvents.native.ts`): a listener
  registered via `useEvent`'s post-render effect can lose a fast local failure that fires
  before that effect runs. Register all listeners with `player.addEventListener(...)`
  synchronously inside the `useVideoPlayer` setup callback instead (matches the pattern in
  `docs/docs/player/events.md`), not via `useEvent` in the component body.
- **Root-caused and fixed: `openLink` right after `launchApp` silently drops the deep
  link on a cold/cleared launch.** `RCTLinkingManager.getInitialURL()`
  (`Libraries/LinkingIOS/RCTLinkingManager.mm`) only ever reads
  `launchOptions[UIApplicationLaunchOptionsURLKey]` — set only for a true OS-level
  cold-launch-via-URL. `openLink` instead goes through `application:openURL:options:`,
  which posts the `'url'` NSNotification fire-and-forget: nothing caches it, so if it
  arrives before JS has mounted and called `Linking.addEventListener('url', ...)`, it's
  lost for good — no error, no crash, the app just renders its default screen. This is a
  React Native architecture gap, not app- or scenario-specific, and it reproduced 100% of
  the time on a fresh `launchApp: clearState: true` in real Maestro runs (not just manual
  `simctl` testing). **Fix, already applied in every `e2e/flows/*.yaml`:** insert an
  `extendedWaitUntil: { visible: { id: "e2e-host-ready" } }` (a `testID` on the
  `<Text>` the test app's default screen renders — `App.tsx`'s
  `<Text testID="e2e-host-ready">RNVideoE2E ready</Text>` — matched by testID rather
  than by its literal text, which is more robust against the copy changing) between
  `launchApp` and `openLink`, so the link is only sent once JS has actually mounted and
  subscribed. Verified stable over 3 consecutive full `maestro test e2e/flows/` runs
  (3/3 passed each time, ~29s).

- **A cold-launched scenario that fails before any real playback fires NO player event at
  all — and this is an unexplained workaround, not a fix.** On a genuinely cold launch, the
  error-404 scenario (which errors before attempting playback) never emitted a single
  event; confirmed hanging past 30 s, not merely slow. A scenario with real playback
  (mp4/hls) initialises fine cold. The root cause was never pinned down — it looks like a
  native/Nitro registration path that only completes once an actual playback attempt
  triggers it. `smoke-error-404.yaml` works around it by first navigating through the mp4
  scenario, verified stable over 3 repeats. **This is worth root-causing properly**: the
  warm-up makes a green flow out of behaviour nobody has explained, and if the underlying
  cause is a real library bug in cold-start initialisation, this flow is now shaped so it
  can never catch it.

## Gotchas found while building the wave-1 expansion (seek, mute/volume, rate, loop)

- **A `tapOn` issued while the video is actively decoding is not delivered until the
  player goes idle (paused/ended) — confirmed on iOS Simulator, reproduced even with a
  button whose handler does nothing but write to the JS event log** (so it's not about our
  player calls specifically). `maestro test` reports the `tapOn` step as `COMPLETED`
  immediately, but the on-device effect only appears seconds later, right around the
  clip's natural end — repeated across multiple isolated debug flows, including taps fired
  *before* `evt-onLoad` even appears. Root cause not fully pinned down (looks like the
  test driver's own "wait for the app to go idle before acting" heuristic never resolving
  while frames are actively decoding) — not investigated further since it reproduces
  identically regardless of what the tapped element does.
  **Consequence for flow design:** don't write a flow that taps a button mid-playback and
  assumes the effect happens immediately — it silently doesn't. Two ways to write a valid
  flow around this:
  - If the effect is an **absolute value-set** (`seekTo(5)`, `player.muted = true`), timing
    doesn't matter — the eventual (deferred) tap still produces a correct, meaningful
    event whenever it lands. `smoke-seek.yaml`, `smoke-mute-volume.yaml`,
    `smoke-hls-seek.yaml` rely on this.
  - If the effect is **relative to current state** (`player.rate = player.rate === 1 ? 2
    : ...`, a play/pause toggle keyed on `isPlaying`), a deferred tap reads *stale* state
    (by the time it lands, the clip has often already naturally ended) and silently does
    the wrong thing. Fix: never derive the next value from a live read at press-time —
    track it independently in JS (see `ScenarioScreen.tsx`'s `rateStepRef`), and/or
    restructure the flow to only interact once the player is already idle
    (`smoke-loop.yaml`, `smoke-replay-after-end.yaml`).
- **A "pause mid-playback" flow is not achievable under the above constraint, and was
  dropped rather than shipped in a form that passes vacuously.** A first version tapped
  `btn-play-pause` twice during playback and passed — but the debug trace showed both taps
  actually landed *after* the clip's natural end, by which point `isPlaying` was already
  `false` from the natural stop. So the toggle's `pause()` branch was never reached:
  `evt-paused` was satisfied by the natural end transition, and `evt-resumed` by the
  deferred tap's `play()` call being a harmless no-op blip on an already-ended player —
  not by any real pause/resume happening. Since the toggle can only ever see
  `isPlaying === true` *before* the natural end, and no tap lands before that, `pause()`
  cannot be exercised by a Maestro `tapOn` in this setup. Revisit if a future Maestro
  version changes its idle detection.
- **`loop` needs a 3rd, *unassisted* `onEnd` to prove anything.** Because of the tap-defer
  issue above, the `loop`-toggle tap always lands too late for the clip's first natural
  end, and a plain manual replay (seek + play) after that end would produce a 2nd `onEnd`
  regardless of whether `loop` does anything at all — so "onEnd fired twice" is not a valid
  proof of looping. `smoke-loop.yaml` instead: lets end #1 happen, manually seeks + plays
  once to reach end #2 (by which point the deferred loop-toggle tap has already landed, so
  `loop` is set for that whole 2nd playthrough), then makes **no further taps** — a 3rd
  `onEnd` after that can only come from an unassisted `loop` restart.
- **Root-caused and fixed: on Android, `Linking.getInitialURL()` can read the *previous*
  activity's intent instead of the new one, right after a deep link.** RNTA's singleApp
  mode opens a deep link by having MainActivity build a new Intent, forward it into a
  brand-new `ComponentActivity` instance, and `finish()` itself (see the patch in
  `test-app/patches/`). `adb shell dumpsys activity activities` confirmed the *new*
  activity was `topResumedActivity` with the correct `action=VIEW dat=rnvtest://...` at
  the exact moment its (also brand new) JS root called `Linking.getInitialURL()` and got
  `null` back. Cause: RN Android's `IntentModule.getInitialURL()` reads
  `getCurrentActivity().intent`, and `getCurrentActivity()` is updated by RN's own
  activity-lifecycle tracking — which can still point at the *previous* activity for a
  brief window after the new one is created. `waitForActivityAndGetInitialURL`'s existing
  fallback only triggers when `getCurrentActivity()` is `null`, not when it's non-null but
  stale, so it doesn't catch this. **Fix** (`test-app/App.tsx`): on Android only, if the
  first `getInitialURL()` resolves to no scenario, retry once after a 300ms delay.
  Verified with a manual `adb shell am start -a VIEW` repro (100% reproducible before the
  fix, resolved after). iOS doesn't need this — `RCTLinkingManager` reads
  `UIApplicationLaunchOptionsURLKey` directly, no cross-activity race involved.
- **Android suite stability is not yet confirmed on a clean machine.** After the deep-link
  fix, local re-runs of `e2e/flows/` on an API 34 emulator ranged from 6/10 to 10/10
  passing — partial passes still proved the fix and the flows themselves are sound
  (different flows passed on different runs), but individual flow times ballooned to 15–17
  *minutes* (should be ~20–40 s) and the emulator process was observed stuck in `UN`
  (uninterruptible sleep) — a hung VM, not a slow one, with 30/32 GB RAM in use and load
  average >5 on the host. That is a local-session artifact; CI runs on a fresh VM each
  time. **Before flipping the Android check to `required`, re-run `e2e/flows/` on Android
  several times from a freshly booted emulator on a quiet machine, or in real CI.**
