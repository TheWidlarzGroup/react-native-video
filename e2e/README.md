# react-native-video E2E

Deterministic Maestro flows against the test app. Full rationale: [`CONTEXT.md`](CONTEXT.md).
CI matrix: [`CI_MATRIX_DESIGN.md`](CI_MATRIX_DESIGN.md).

## Run locally

```bash
# 1. Fixtures (one-time, or after changing generate.sh; requires ffmpeg)
./e2e/fixtures/generate.sh

# 2. Serve fixtures (dependency-free — the same server CI starts via
#    .github/actions/e2e-setup/action.yml; run it from the repo root and leave it running)
node e2e/fixtures/serve.mjs e2e/fixtures/media 8090

# 3. Pick the React Native version and install.
#    0.77 is the floor and needs no switch; see e2e/rn-matrix/README.md for the others.
#    Switching rewrites test-app/package.json and the root bun.lock — restore them with
#    `git checkout -- bun.lock test-app/package.json` before committing.
node scripts/e2e/use-rn-version.mjs 0.77
bun install --frozen-lockfile   # also applies test-app/patches/ via the root postinstall

# 4. Bundle the app's JS. react-native-test-app embeds test-app/dist/ at build time and
#    falls back to a Metro dev server when it is missing. Either build the bundle (what
#    CI does) or keep `bun run --cwd test-app start` running instead.
bun run --cwd test-app build:android   # or build:ios — before pod install on iOS

# Android: build a debug APK and install it on a running emulator. The bundle step above
# already generated test-app/android/app/build/generated/rnta/.../AndroidManifest.xml,
# BEFORE react-native-test-app applied the config plugins (deep-link intent filter,
# cleartext HTTP), and the generator only regenerates when app.json is newer than that
# file. Delete it so Gradle regenerates it with the plugins applied.
rm -rf test-app/android/app/build/generated/rnta
cd test-app/android && ./gradlew assembleDebug -PreactNativeArchitectures=x86_64 && cd ../..
adb install -r test-app/android/app/build/outputs/apk/debug/app-debug.apk

# iOS: install pods, build, then install on a booted simulator
# (see .github/workflows/_e2e-ios.yml for the exact CI commands this mirrors)
cd test-app && bundle install && bundle exec pod install --project-directory=ios && cd ..
xcodebuild -workspace test-app/ios/RNVideoE2E.xcworkspace \
  -scheme RNVideoE2E -configuration Debug -sdk iphonesimulator \
  -derivedDataPath build \
  -destination "platform=iOS Simulator,name=<simulator name>" build
xcrun simctl boot "<simulator name>" || true   # already-booted is fine, hence `|| true`
xcrun simctl install booted "$(find build/Build/Products -name '*.app' -maxdepth 3 | head -1)"

# 5. Run (APP_ID is com.rnvtest.host, from _e2e-android.yml's/_e2e-ios.yml's env)
maestro test -e APP_ID=com.rnvtest.host e2e/flows/            # all
maestro test -e APP_ID=com.rnvtest.host e2e/flows/smoke-mp4-happy-path.yaml  # one
```

Android emulator reaches fixtures via `10.0.2.2:8090` (cleartext HTTP must be allowed in
the debug build), iOS simulator via `localhost:8090` — handled in the app (`fixtures.ts`).

## How assertions work

The test app renders player events as text markers with stable `testID`s
(`evt-onLoad`, `evt-progress-gt-2s`, `evt-onEnded`, `evt-onError`, ...). Flows assert
marker visibility — never parse numbers, never assert on video pixels. Scenarios open via
deep links (`rnvtest://scenario/<name>`), never via UI navigation.

## Adding a flow

1. If the scenario needs new app behavior: add a `ScenarioName` + source in `fixtures.ts`,
   and (if needed) a derived marker in `eventLog.ts` — markers over number-parsing, always.
2. Copy the closest existing flow in `e2e/flows/`, rename, adjust deep link + assertions.
3. Timeouts: generous on first event after load (emulator decoders are slow to start),
   tight after playback is running. Clip lengths are 8 s — nothing should wait > 30 s.
4. Run locally on BOTH platforms before opening a PR.
5. One flow = one scenario = one file. Keep flows independent (each starts with
   `launchApp: clearState: true`).

Optionally, record a draft with [agent-device](https://github.com/callstack/agent-device)
and export to Maestro YAML, then clean it up by hand — the committed artifact is always
plain reviewable YAML.

## Rules

- No external network in PR flows — local fixtures only. Public streams live in nightly.
- Zero retries. A flaky flow gets quarantined (`tags: [flaky]`) with an issue, never
  retried into a false green — a retry hides the race the flow just caught.
- Bugfix in an E2E-coverable area ⇒ the PR includes a reproducing flow.
