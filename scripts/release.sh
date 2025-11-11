#!/bin/bash

set -e

echo "[React Native Video] Starting release process"
echo "[React Native Video] Options: $@"

echo "[React Native Video] Checking if we are in the correct directory"
if [ ! -d "packages/react-native-video" ]; then
  echo "[React Native Video] Error: Not in the correct directory"
  exit 1
fi

# Check if options include --skip react-native-video
if [[ " $@ " =~ " --skip " ]] && [[ " $@ " =~ " react-native-video " ]]; then
  echo "[React Native Video] Skipping main package release"
else
  echo "[React Native Video] Publishing main package"
  cd packages/react-native-video
  bun run release $@
  cd ../..
fi

# Check if options include --skip drm-plugin
if [[ " $@ " =~ " --skip " ]] && [[ " $@ " =~ " drm-plugin " ]]; then
  echo "[DRM Plugin] Skipping drm plugin release"
else
  echo "[DRM Plugin] Publishing drm plugin"

  cd packages/drm-plugin
  bun run release $@
  cd ../..
fi

# Check if options include --skip github
if [[ " $@ " =~ " --skip " ]] && [[ " $@ " =~ " github " ]]; then
  echo "[React Native Video] Skipping GitHub release"
else
  echo "[React Native Video] Making Github Release"
  bun run release:github $@
fi

echo "[React Native Video] Done"