#!/bin/bash

set -e

echo "[React Native Video] Starting release process"
echo "[React Native Video] Options: $@"

echo "[React Native Video] Checking if we are in the correct directory"
if [ ! -d "packages/react-native-video" ]; then
  echo "[React Native Video] Error: Not in the correct directory"
  exit 1
fi

# Each package's release-it bumps its package.json and copies LICENSE (and
# README.md) into the package, but does not commit. The next release-it step
# requires a clean working dir, and the root step bumps every package.json and
# makes the release commit, so drop these leftovers between steps and on exit.
clean_package_artifacts() {
  git checkout -- packages/react-native-video/package.json packages/drm-plugin/package.json
  rm -f packages/react-native-video/LICENSE packages/react-native-video/README.md packages/drm-plugin/LICENSE
}
trap clean_package_artifacts EXIT

clean_package_artifacts

# Check if options include --skip react-native-video
if [[ " $@ " =~ " --skip " ]] && [[ " $@ " =~ " react-native-video " ]]; then
  echo "[React Native Video] Skipping main package release"
else
  echo "[React Native Video] Publishing main package"
  cd packages/react-native-video
  bun run release $@
  cd ../..
  clean_package_artifacts
fi

# Check if options include --skip drm-plugin
if [[ " $@ " =~ " --skip " ]] && [[ " $@ " =~ " drm-plugin " ]]; then
  echo "[DRM Plugin] Skipping drm plugin release"
else
  echo "[DRM Plugin] Publishing drm plugin"

  cd packages/drm-plugin
  bun run release $@
  cd ../..
  clean_package_artifacts
fi

# Check if options include --skip github
if [[ " $@ " =~ " --skip " ]] && [[ " $@ " =~ " github " ]]; then
  echo "[React Native Video] Skipping GitHub release"
else
  echo "[React Native Video] Making Github Release"
  bun run release:github $@
fi

echo "[React Native Video] Done"