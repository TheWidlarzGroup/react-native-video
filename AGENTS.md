# AGENTS.md

Rules for coding agents that change this repository. [CONTRIBUTING.md](CONTRIBUTING.md) is the source for setup, scripts and tests: read it first and do not copy it here. When the two differ, CONTRIBUTING.md wins.

To **use** react-native-video in an app, read the skill in [`skills/react-native-video/`](skills/react-native-video/SKILL.md) instead.

## Before you start

- `master` is v7 (Nitro Modules, `useVideoPlayer` + `VideoView`). `support/6.x.x` is v6 (`<Video>`), with another layout and its own CI. A v6 fix is a pull request against `support/6.x.x`.
- Use Bun at the version in `.bun-version`. npm and yarn do not work here.
- An API change or a large change starts with an issue, not a pull request.
- Do not scan the repository for things to change, and do not open many pull requests at once.

## Check your work

- Run `bun lint`, `bun typecheck` and `bun run test` (not `bun test`) from the root.
- In a fresh worktree, run `bun run build` before `bun typecheck`. `example/` and `test-app/` typecheck against the built `lib/`.
- After a native change, build the example app on that platform: `bun example ios` or `bun example android`.
- E2E needs an emulator or a simulator and the fixture server. Follow `e2e/README.md` in order.
- A red E2E leg is a real failure. Read its artifacts. Do not re-run it to get green.

## Rules

1. **Public API** (props, events, methods, exported types): keep iOS, Android and web the same, or say in the pull request which platform does not get it and why. Update `docs/` and `skills/react-native-video/` in the same pull request.
2. **Nitro specs** (`packages/react-native-video/src/spec/nitro/`): run `bun react-native-video specs` and commit `nitrogen/generated/`. Implement the change in Swift (`ios/hybrids/`) and in Kotlin. Never edit `nitrogen/generated/` by hand.
3. **Bug fix:** in an area the E2E suite covers (load, progress, seek, volume, rate, loop, end, errors, source lifecycle), add a Maestro flow that fails without the fix.
4. **E2E flows:** follow "Adding a flow" and "Rules" in `e2e/README.md`. Open scenarios only through `e2e/shared/open-scenario.yaml`. No external network. No retry, longer timeout or `flaky` tag to make a flow pass.
5. **Any `package.json` change:** regenerate the E2E lockfiles in the same pull request: `for v in 0.82 0.87; do node scripts/e2e/use-rn-version.mjs "$v" --refresh; done`, then commit `e2e/rn-matrix/`.
6. **React Native version switch:** before you commit, restore `git checkout -- bun.lock test-app/package.json`.
7. **Android:** code that uses Media3 HLS or DASH classes must also compile against `android/src/stubs/`. A view change must also cover `android/src/paper/` (old architecture). On iOS, cover both `ios/view/fabric/` and `ios/view/paper/`.
8. **Expo config plugins** (`src/expo-plugins/`) change the native projects of every Expo user. They must be idempotent and work when the target element does not exist yet.
9. **DRM:** never log license URLs, tokens, certificates or request headers. `packages/drm-plugin/` tests use Jest, not `bun:test`.
10. **Workflows:** do not rename the jobs in `.github/workflows/e2e.yml` and `unit.yml`; they are meant to become required checks. Do not add a path filter to `pull_request` there: a skipped workflow leaves a required check pending.

## Gotchas

Facts that cost time to find and that the code does not show. The record is in `e2e/CONTEXT.md` and the linked pull requests.

- Android emits `onLoad` again on every re-buffer and replay, and reports `idle` at the natural end of a clip.
- A released player emits nothing: both native players detach their listeners before they set `idle`. Read `player.status` after a release.
- `replaceSourceAsync(null)` also releases the native player on iOS and Android. The docs say otherwise until #5154 merges; trust the code. Remove this line when it merges.

## Pull requests

- Use conventional commits (`fix:`, `feat:`, `test:`, `docs:`, `ci:`, `chore:`). Lefthook checks them.
- Fill in the template. In "Test plan", write what you ran and on which platform. If you ran nothing, write that, and open the pull request as a draft.
- The person who opens the pull request is its author and must be able to explain every change in review.
- Do not push to `master` or `support/6.x.x`. Do not run `bun release` or change versions, tags or the changelog.

## Changing this file

- Do not change this file in a pull request about something else.
- If you found a fact that cost you time and is not here, write it in one line under "Suggested gotcha" in the pull request description. A maintainer decides if it goes here.
- Maintainers add a line when the same mistake happens twice. One line per rule, no history: the reason goes in the commit message. Remove a line when the code makes it untrue. Longer explanations go in `e2e/CONTEXT.md` or a linked doc.
