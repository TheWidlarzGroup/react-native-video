# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Bun workspaces](https://bun.sh/docs/install/workspaces). It contains:

- The library in `packages/react-native-video`.
- The DRM plugin in `packages/drm-plugin`.
- An example app in `example/`, for trying the library by hand.
- The E2E test app in `test-app/` and its Maestro flows and media fixtures in `e2e/`.
- The documentation site in `docs/`.

To get started with the project, run `bun install` in the root directory to install the required dependencies for each package:

```sh
bun install
```

Use the Bun version in `.bun-version` (the one CI runs, and the one that wrote the committed `bun.lock`):

```sh
curl -fsSL https://bun.sh/install | bash -s "bun-v$(cat .bun-version)"
```

> Since the project relies on Bun workspaces, you cannot use [`npm`](https://github.com/npm/cli) or [`yarn`](https://yarnpkg.com/) for development.

The [example app](/example/) demonstrates usage of the library and is the quickest way to try a change by hand.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

If you want to use Android Studio or XCode to edit the native code, you can open the `example/android` or `example/ios` directories respectively in those editors. To edit the Objective-C or Swift files, open `example/ios/VideoExample.xcworkspace` in XCode and find the source files at `Pods > Development Pods > react-native-video`.

To edit the Java or Kotlin files, open `example/android` in Android studio and find the source files at `react-native-video` under `Android`.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
bun example start
```

To run the example app on Android:

```sh
bun example android
```

To run the example app on iOS:

```sh
bun example ios
```

Make sure your code passes TypeScript, ESLint and the unit tests. Run the following to verify:

```sh
bun typecheck
bun lint
bun run test
```

To fix formatting errors, run the following:

```sh
bun lint --fix
```

## Testing your change

Every pull request that changes behavior should come with a test that would fail without the change. Pick the level that matches what you changed:

- **Unit tests** (`packages/react-native-video/__tests__/`, run with `bun run test`) for the library's JavaScript layer: native error parsing, `useManagedInstance` and the Expo config plugins. They use Bun's built-in test runner (`bun:test`) and mock the native side, so they run in about a second.
- **Maestro E2E flows** (`e2e/flows/`) for behavior on a real emulator or simulator: loading, progress, seeking, volume, rate, loop, end of playback and errors. Flows drive the test app through deep links and assert on text markers it renders for player events. [`e2e/README.md`](e2e/README.md) explains how to run the suite locally and how to add a flow; [`e2e/CONTEXT.md`](e2e/CONTEXT.md) explains why it is built the way it is.

Rules of thumb:

- **A bug fix in an area the E2E suite can exercise includes a flow that reproduces the bug.** Check that the flow fails without your fix and passes with it.
- New features come with tests for the new behavior; if the test app needs a new scenario or marker, add it in `test-app/src/e2e/` (see "Adding a flow" in `e2e/README.md`).
- Refactors and documentation changes need no new tests, but the existing ones must keep passing.
- When no automated test fits (native UI, DRM, picture-in-picture, a platform CI does not run), explain how you verified the change under "Test plan" in the pull request.
- E2E flows are never retried to make them pass. A flow that turns out to be unstable is tagged `flaky` with an issue and leaves the PR gate until it is fixed.

## Continuous integration

Every pull request runs:

- **`unit`**: lint, typecheck and unit tests on React 18, plus the library's tests and typecheck on React 19.
- **`e2e`**: the Maestro suite on Android (React Native 0.77, 0.82 and 0.87, API 36) and on iOS (React Native 0.87, iOS 26). A leg takes about 15 minutes on either platform.

Both run on every pull request, including docs-only ones, so that they can become required checks: a workflow skipped by a path filter would leave its check pending and block the merge. A first-time contributor's workflows may need a maintainer's approval before they start.

A red E2E leg is a real signal, not something to re-run. Its artifacts contain the JUnit report, a screenshot and view hierarchy at the failing step, and the device log.

> **Changing a `package.json`?** The E2E matrix installs React Native 0.82 and 0.87 from committed lockfiles that snapshot the whole workspace, so any `package.json` change needs them regenerated in the same pull request: `for v in 0.82 0.87; do node scripts/e2e/use-rn-version.mjs "$v" --refresh; done`, then commit `e2e/rn-matrix/`. See [`e2e/rn-matrix/README.md`](e2e/rn-matrix/README.md).

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `perf`: performance improvements.
- `docs`: changes into documentation, e.g. add usage example for the module.
- `test`: adding or updating tests, e.g. add a Maestro flow for seeking in HLS.
- `ci`: changes to the CI workflows.
- `build`: changes to the build system or dependencies.
- `chore`: other tooling changes.

### Pre-commit hooks

[Lefthook](https://github.com/evilmartians/lefthook) runs on commit:

- ESLint and TypeScript on staged source files.
- The unit tests when test-covered files are staged.
- [commitlint](https://commitlint.js.org/) on the commit message.
- A guard that refuses to commit the root `bun.lock` or `test-app/package.json` while the test app is switched to a non-default React Native version.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
bun release
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `bun install`: setup project by installing dependencies.
- `bun run build`: build the packages.
- `bun typecheck`: type-check files with TypeScript.
- `bun lint`: lint files with ESLint.
- `bun run test`: run the unit tests.
- `bun example start`: start the Metro server for the example app.
- `bun example android`: run the example app on Android.
- `bun example ios`: run the example app on iOS.
- `bun test-app start`: start the Metro server for the E2E test app.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Add or update tests for your change (see [Testing your change](#testing-your-change)) and verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- If your change affects how the library is **used** (API, props, events, or behavior), update the AI agent skill in `skills/react-native-video/` to match — keep it in sync just like the docs.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.

### License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).
