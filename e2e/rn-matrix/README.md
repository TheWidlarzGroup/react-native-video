# RN version matrix

Each directory is one React Native version in the CI matrix. `overlay.json` holds only the
dependency differences from `test-app/package.json`; `bun.lock` is the full root lockfile
resolved with that overlay applied, so every CI job installs with `--frozen-lockfile` and a
red job can never mean "npm resolved differently today".

The floor version (0.77) has no directory: the repo's own `test-app/package.json` and root
`bun.lock` are its variant.

## Adding a version

1. `mkdir e2e/rn-matrix/<version>` and write `overlay.json`, copying tool versions from
   the matching release of `react-native-community/template`.
2. `node scripts/e2e/use-rn-version.mjs <version> --refresh` to generate `bun.lock`.
3. Add the version to the matrix in `.github/workflows/e2e-nightly.yml` (and
   `.github/workflows/e2e.yml` if it should gate PRs).

Lockfiles are refreshed weekly by `.github/workflows/e2e-lockfile-refresh.yml`, which opens
a PR. Dependency drift is reviewed there, not inside someone else's PR.
