# RN version matrix

Each directory is one React Native version in the CI matrix. `overlay.json` holds only the
dependency differences from `test-app/package.json`; `bun.lock` is the full root lockfile
resolved with that overlay applied, so every CI job installs with `--frozen-lockfile` and a
red job can never mean "bun resolved differently today".

The floor version (0.77) has no directory: the repo's own `test-app/package.json` and root
`bun.lock` are its variant.

## Switching locally

`node scripts/e2e/use-rn-version.mjs <version>` rewrites `test-app/package.json` and the
root `bun.lock` and clears `test-app/node_modules` (a nested `react-native` from the
previous variant would otherwise survive the next install); then run
`bun install --frozen-lockfile`. To go back: `node scripts/e2e/use-rn-version.mjs 0.77`,
`git checkout -- bun.lock test-app/package.json`, install again. A pre-commit hook refuses
to commit either file while switched.

## When a lockfile must be regenerated

The variant lockfiles snapshot the whole workspace, not just `test-app/`. Any change to a
`package.json` anywhere in the monorepo (library, example, docs) makes the frozen install
fail on the 0.82/0.87 legs. Regenerate and commit the variants in the same PR:

```bash
for v in 0.82 0.87; do node scripts/e2e/use-rn-version.mjs "$v" --refresh; done
git add e2e/rn-matrix
```

## Adding a version

1. `mkdir e2e/rn-matrix/<version>` and write `overlay.json`, copying tool versions from
   the matching release of `react-native-community/template`.
2. `node scripts/e2e/use-rn-version.mjs <version> --refresh` to generate `bun.lock`.
3. Add the version to the matrix in `.github/workflows/e2e-nightly.yml` (and
   `.github/workflows/e2e.yml` if it should gate PRs).

Lockfiles are refreshed weekly by `.github/workflows/e2e-lockfile-refresh.yml`, which opens
a PR. Dependency drift is reviewed there, not inside someone else's PR.
