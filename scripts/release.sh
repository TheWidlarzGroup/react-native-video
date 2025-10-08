#!/bin/bash

set -e

echo "[React Native Video] Starting release process"
echo "[React Native Video] Options: $@"

echo "[React Native Video] Checking if we are in the correct directory"
if [ ! -d "packages/react-native-video" ]; then
  echo "[React Native Video] Error: Not in the correct directory"
  exit 1
fi

echo "[React Native Video] Publishing main package"
cd packages/react-native-video
bun run release $@
cd ../..

echo "[DRM Plugin] Publishing drm plugin"

cd packages/drm-plugin
bun run release $@
cd ../..

echo "[React Native Video] Making Github Release"
bun run release:github $@

echo "[React Native Video] Done"