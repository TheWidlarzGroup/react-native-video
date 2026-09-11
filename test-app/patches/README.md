# Patches

Applied by `patch-package` from the repo root `postinstall`.

## `react-native-test-app+5.4.9.patch` — deliver deep links to one activity

Two changes to the redirect `MainActivity` performs in `singleApp` mode, both on the Intent it
builds for `ComponentActivity`.

### 1. Preserve the launch Intent's action/data

**What breaks without it:** on Android, `Linking.getInitialURL()` always resolves to `null`
after a `rnvtest://scenario/<name>` deep link, so every Maestro flow lands on the test app's
default screen instead of its scenario. No error, no crash — the flows just fail their first
assertion.

**Cause:** in `singleApp` mode, `react-native-test-app`'s own `MainActivity.kt` does not host
the app itself. It looks up the component, builds a fresh Intent for a separate
`ComponentActivity`, starts it, and calls `finish()`. That redirect Intent is constructed from
scratch and never carries over the launching Intent's `action` or `data`, so the deep-link URI
is dropped before the JS side ever exists. React Native's `IntentModule.getInitialURL()`
requires **both** `Intent.ACTION_VIEW` and a non-null `data` — copying only `data` still
returns `null`, which is why the patch sets both.

**Why a patch and not configuration:** putting the `intent-filter` on `ComponentActivity`
instead does not work either — its `onCreate()` throws unless the Intent carries a
`componentName` extra, which an implicit `VIEW` intent delivered by the OS never has. The
`intent-filter` itself is injected correctly through `app.json` (`withAndroidManifest`); only
this in-process hand-off loses the data.

### 2. `FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_SINGLE_TOP`

**What breaks without it:** a second deep link in the same session (scenario A, then
scenario B — what the error flows do) starts a *second* `ComponentActivity` with a *second*
React root, while the first one keeps running in the background with its player. Both roots
mount `App`; React Native broadcasts Linking's `url` event to every root in the runtime, so
both mount scenario B, two players play at once and every event in the log appears twice.
Meanwhile `getInitialURL()` in the new root can still read the *previous* activity's Intent
(`getCurrentActivity()` lags), i.e. scenario A.

**With the flags:** the existing `ComponentActivity` (a `ReactActivity`) receives the link via
`onNewIntent`, React Native emits the `url` event to the single root, and `App.tsx` remounts
`ScenarioScreen` (keyed on the scenario), which destroys the previous player. One activity,
one root, one player.

**Scope:** a handful of lines, against a file `react-native-test-app` compiles directly from
`node_modules` — not a fork of the template and not an edit to a generated project. Re-check
it when bumping `react-native-test-app`; 5.4.9 supports React Native 0.76–0.87, so the pin
covers the whole version matrix. `patch-package`'s *make* mode does not understand
`bun.lock`; regenerate the file by hand (`diff -u` of the pristine and edited
`MainActivity.kt`, with `a/node_modules/...` / `b/node_modules/...` headers) and verify with
`bunx patch-package --patch-dir test-app/patches` on a pristine copy.

iOS needs no equivalent: RNTA's `SceneDelegate.swift` forwards to `RCTLinkingManager`
unconditionally, and `RCTLinkingManager` reads `UIApplicationLaunchOptionsURLKey` directly.
