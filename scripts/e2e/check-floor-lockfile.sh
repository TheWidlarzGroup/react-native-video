#!/usr/bin/env bash
# Pre-commit guard: refuse to commit the root bun.lock or test-app/package.json while
# they are switched to a non-floor React Native variant (scripts/e2e/use-rn-version.mjs).
# Committing that state would move the repo's default RN version by accident and corrupt
# the base the weekly lockfile refresh diffs against.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

for lock in e2e/rn-matrix/*/bun.lock; do
  [ -f "$lock" ] || continue
  if cmp -s bun.lock "$lock"; then
    echo "error: bun.lock is identical to $lock — test-app is switched to a non-floor RN version." >&2
    echo "       Restore the floor before committing: git checkout -- bun.lock test-app/package.json" >&2
    exit 1
  fi
done

floor_rn=$(node -p "require('./test-app/package.json').dependencies['react-native']")
for overlay in e2e/rn-matrix/*/overlay.json; do
  [ -f "$overlay" ] || continue
  overlay_rn=$(node -p "require('./$overlay').dependencies?.['react-native'] ?? ''")
  if [ -n "$overlay_rn" ] && [ "$overlay_rn" = "$floor_rn" ]; then
    echo "error: test-app/package.json pins react-native $floor_rn, the $overlay variant, not the floor." >&2
    echo "       Restore the floor before committing: git checkout -- bun.lock test-app/package.json" >&2
    exit 1
  fi
done
