#!/usr/bin/env bash
set -euo pipefail

# --- Config ---
PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXAMPLE_DIR="$PLUGIN_ROOT/examples/bare"

CLEAN=false
REINSTALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --clean)     CLEAN=true; shift ;;
    --reinstall) REINSTALL=true; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

echo "🔧 Plugin root:     $PLUGIN_ROOT"
echo "🧪 Example app dir: $EXAMPLE_DIR"

# 1) Build the plugin's JS (if you have a build script; if not, this will be skipped gracefully)
if jq -e '.scripts.build' "$PLUGIN_ROOT/package.json" >/dev/null 2>&1; then
  echo "📦 Building plugin (yarn build)…"
  (cd "$PLUGIN_ROOT" && yarn build)
else
  echo "📦 No build script found, skipping TS build."
fi

# 2) Optionally reinstall example deps
if $REINSTALL || [ ! -d "$EXAMPLE_DIR/node_modules" ]; then
  echo "🧹 Reinstalling example deps…"
  (cd "$EXAMPLE_DIR" && rm -rf node_modules android/.gradle android/build && yarn)
fi

# 3) Optional Gradle clean
if $CLEAN; then
  echo "🧽 Gradle clean…"
  (cd "$EXAMPLE_DIR/android" && ./gradlew clean)
fi

# 4) Make sure Metro port is free
echo "🔌 Freeing Metro port 8081 (if taken)…"
if lsof -ti tcp:8081 >/dev/null 2>&1; then
  kill -9 $(lsof -ti tcp:8081) || true
fi

# 5) Improve device ↔ packager networking
echo "🔁 adb reverse 8081…"
adb reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true

# 6) Run the Android app (this will also start Metro)
echo "📱 Running Android app…"
(cd "$EXAMPLE_DIR" && npx react-native run-android)

# 7) Tail useful logs (press Ctrl+C to exit)
echo "🪵 Tail logs (RNDatazoom + RN + JS)…"
echo "    Tip: change the tag if you use a different one than RNDatazoom"
adb logcat *:S RNDatazoom:V ReactNative:V ReactNativeJS:V
