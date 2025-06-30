# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Bun workspaces](https://bun.sh/docs/install/workspaces). It contains the following packages:

- An Library package in the `packages/react-native-video` directory.
- An example app in the `example/` directory.

To get started with the project, run `bun install` in the root directory to install the required dependencies for each package:

```sh
bun install
```

> Since the project relies on Bun workspaces, you cannot use [`npm`](https://github.com/npm/cli) or [`yarn`](https://yarnpkg.com/) for development.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

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

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
bun typecheck
bun lint
```

To fix formatting errors, run the following:

```sh
bun lint --fix
```

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
bun release
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `bun install`: setup project by installing dependencies.
- `bun typecheck`: type-check files with TypeScript.
- `bun lint`: lint files with ESLint.
- `bun example start`: start the Metro server for the example app.
- `bun example android`: run the example app on Android.
- `bun example ios`: run the example app on iOS.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.

### License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).
