#!/usr/bin/env bash
# Settle a freshly booted Android emulator before Maestro runs.
#
# On a hosted runner the system launcher (Quickstep) can ANR while the emulator is still
# busy right after a cold boot; its "isn't responding" dialog then stays on top of every
# app and Maestro treats everything under it as invisible. hide_error_dialogs does not
# cover system-process ANRs. So: wait for the guest load to drop, then dismiss any such
# dialog by tapping "Wait" (which keeps the process), a few times if needed.
#
# Usage: android-settle.sh [max-seconds]   (default 120)
set -euo pipefail

max=${1:-120}
deadline=$((SECONDS + max))

echo "[settle] waiting for the guest 1-minute load to drop below 2.0 (max ${max}s)"
while [ "$SECONDS" -lt "$deadline" ]; do
  load=$(adb shell cat /proc/loadavg | tr -d '\r' | cut -d' ' -f1)
  if awk -v l="$load" 'BEGIN { exit !(l + 0 < 2.0) }'; then
    echo "[settle] load ${load}"
    break
  fi
  sleep 5
done

# Prints the centre of the first node whose text matches $1, from a uiautomator dump on
# stdin, or nothing.
node_centre() {
  local label=$1
  tr '>' '\n' \
    | grep -F "text=\"${label}\"" \
    | grep -oE 'bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' \
    | head -1 \
    | sed 's/\]\[/,/' \
    | tr -dc '0-9,' \
    | awk -F',' '{ printf "%d %d\n", ($1 + $3) / 2, ($2 + $4) / 2 }'
}

for attempt in 1 2 3 4 5 6; do
  if ! adb shell uiautomator dump /sdcard/settle.xml >/dev/null 2>&1; then
    sleep 3
    continue
  fi
  dump=$(adb shell cat /sdcard/settle.xml | tr -d '\r')
  if ! grep -q "isn't responding" <<<"$dump"; then
    echo "[settle] no system error dialog on screen"
    exit 0
  fi
  title=$(tr '>' '\n' <<<"$dump" | grep -oE "text=\"[^\"]*isn't responding\"" | head -1)
  centre=$(node_centre "Wait" <<<"$dump" || true)
  if [ -z "$centre" ]; then
    echo "[settle] ${title} on screen but no Wait button found; dump follows" >&2
    echo "$dump" >&2
    exit 1
  fi
  echo "[settle] ${title} — tapping Wait at ${centre} (attempt ${attempt})"
  # shellcheck disable=SC2086 # two integers
  adb shell input tap $centre
  sleep 4
done
echo "[settle] a system error dialog kept coming back" >&2
exit 1
