# react-native-video E2E

Deterministic Maestro flows against the test app. Full rationale: [`CONTEXT.md`](CONTEXT.md).

## Run locally

```bash
# 1. Fixtures (one-time, or after changing generate.sh; requires ffmpeg)
./e2e/fixtures/generate.sh

# 2. Serve fixtures
npx serve e2e/fixtures/media -l 8090

# 3. Build & install the test app on an emulator/simulator (see example app README)

# 4. Run
maestro test -e APP_ID=<app id> e2e/flows/            # all
maestro test -e APP_ID=<app id> e2e/flows/smoke-mp4-happy-path.yaml  # one
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
