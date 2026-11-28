#!/usr/bin/env bash
# The Android leg's flows, run by reactivecircus/android-emulator-runner once the emulator
# is up (`_e2e-android.yml`, "Run flows on emulator").
#
# The first thing it does is leave a marker that the emulator booted. When the step fails
# without the marker, the boot itself failed and the workflow boots the emulator once
# more; when the marker is there, the flows ran and their result stands. Flows are never
# run a second time (zero retries, e2e/CONTEXT.md).
#
# hide_error_dialogs suppresses app crash/ANR dialogs. System-process ANRs (the launcher,
# "Quickstep isn't responding") are not covered by it and have shown up right after a
# cold boot on a busy runner, with the dialog then covering every flow; android-settle.sh
# waits for the guest load to drop and dismisses any such dialog before Maestro starts.
# (Do not wait for init.svc.bootanim == stopped: with -no-boot-anim that service never
# runs.)
#
# The emulator dies with the workflow step, so the post-mortem (a screenshot and the
# accessibility hierarchy of the app's default screen, i.e. what Maestro matches `id:`
# against) has to happen here, after Maestro, before the exit status reports a Maestro
# failure.
#
# Usage: android-run-flows.sh   (env: APP_ID; TAGS, a list of Maestro flags, may be empty)
set -euo pipefail

: > "${RUNNER_TEMP:-.}/emulator-booted"

adb shell settings put global hide_error_dialogs 1
adb install -r test-app/android/app/build/outputs/apk/debug/app-debug.apk
bash scripts/e2e/android-settle.sh 120
adb logcat -c
adb logcat > logcat.txt &
logcat_pid=$!

failed=0
# shellcheck disable=SC2086 # $TAGS is a list of flags and must word-split
maestro test -e APP_ID="$APP_ID" ${TAGS:-} --format junit --output e2e-report.xml \
  --debug-output "$PWD/maestro-debug" --flatten-debug-output e2e/flows/ || failed=1

mkdir -p post-mortem
adb shell am start -W -n "$APP_ID/com.microsoft.reacttestapp.MainActivity" > post-mortem/am-start.txt 2>&1 || true
sleep 6
adb exec-out screencap -p > post-mortem/default-screen.png || true
{ adb shell uiautomator dump /sdcard/hierarchy.xml > /dev/null 2>&1 && adb pull /sdcard/hierarchy.xml post-mortem/hierarchy.xml; } || true
adb shell dumpsys activity activities > post-mortem/activities.txt 2>&1 || true
kill "$logcat_pid" 2> /dev/null || true

exit "$failed"
