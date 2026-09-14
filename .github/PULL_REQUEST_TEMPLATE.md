<!--
Thanks for opening a pull request!

To help us review and merge it quickly:
- Keep the PR focused on a single concern - split unrelated changes into separate PRs.
- Add or update tests for the change - a unit test and/or a Maestro E2E flow. A bug fix in an
  area the E2E suite can exercise (playback, seeking, volume, rate, loop, events, errors) should
  come with a flow that reproduces it. See "Testing your change" in CONTRIBUTING.md.
- Update the docs (`docs/`) and the README when you change or add public API, props, or events.
- Update the AI agent skill (`skills/react-native-video/`) the same way when you change how the library is used (API, props, events, behavior).
- Link the issue this PR addresses with "Fixes #<number>".
-->

## Summary

<!-- A clear, concise description of what this PR does. -->

## Motivation

<!-- Why is this change needed? Link the related issue, e.g. "Fixes #1234". -->

## Changes

<!-- A short bullet list of the notable changes. -->

-

## Platforms affected

<!-- Check all that apply. -->

- [ ] Android
- [ ] iOS
- [ ] visionOS
- [ ] tvOS / Android TV
- [ ] Windows
- [ ] Web

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Documentation only

## Test plan

<!--
How did you verify the change?
- Automated: which unit tests (`packages/react-native-video/__tests__/`) or Maestro flows (`e2e/flows/`) you added or updated, and what they assert.
- Manual: steps, a sample source/URL, config, and the expected behavior. Screenshots or a screen recording help a lot.
- If no automated test fits (e.g. native UI, DRM, PiP, a platform CI does not run), say why.
-->

## Checklist

- [ ] I read the [contributing guidelines](https://github.com/TheWidlarzGroup/react-native-video/blob/master/CONTRIBUTING.md).
- [ ] I added or updated tests that cover this change, or explained under "Test plan" why none apply.
- [ ] For a bug fix the E2E suite can exercise, this PR includes a Maestro flow that fails without the fix.
- [ ] `bun run test`, `bun lint` and `bun typecheck` pass locally.
- [ ] I updated the documentation / README where relevant.
- [ ] If this changes how the library is used (API, props, events, behavior), I updated the AI agent skill (`skills/react-native-video/`) to match.
- [ ] This PR is focused on a single concern.
- [ ] I tested my changes on at least one platform.
