# Patches

Applied by `patch-package` from the repo root `postinstall`.

## `react-native-test-app+5.4.9.patch` — preserve deep-link Intent data

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

**Scope:** two lines, against a file `react-native-test-app` compiles directly from
`node_modules` — not a fork of the template and not an edit to a generated project. Re-check
it when bumping `react-native-test-app`; 5.4.9 supports React Native 0.76–0.87, so the pin
covers the whole version matrix.

iOS needs no equivalent: RNTA's `SceneDelegate.swift` forwards to `RCTLinkingManager`
unconditionally, and `RCTLinkingManager` reads `UIApplicationLaunchOptionsURLKey` directly.
