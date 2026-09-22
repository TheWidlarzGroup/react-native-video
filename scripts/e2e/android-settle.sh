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
settled=0
load=unknown
while [ "$SECONDS" -lt "$deadline" ]; do
  load=$(adb shell cat /proc/loadavg | tr -d '\r' | cut -d' ' -f1)
  if awk -v l="$load" 'BEGIN { exit !(l + 0 < 2.0) }'; then
    echo "[settle] load ${load}"
    settled=1
    break
  fi
  sleep 5
done
if [ "$settled" -eq 0 ]; then
  # Not fatal: the dialog check below still runs, and flows may pass on a busy guest.
  echo "[settle] load still ${load} after ${max}s; continuing anyway" >&2
fi

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

last_dump_attempt=0
for attempt in 1 2 3 4 5 6; do
  # One guest shell per attempt. `uiautomator dump` on a guest that is still busy right
  # after boot has returned 0 without writing the file ("could not get idle state";
  # nightly 2026-09-19, API 35), so the file, not the exit status, decides whether this
  # attempt produced a dump; the rm keeps a stale one from being read as this attempt's.
  dump=$(adb shell 'rm -f /sdcard/settle.xml; uiautomator dump /sdcard/settle.xml >/dev/null 2>&1; cat /sdcard/settle.xml 2>/dev/null' | tr -d '\r') || dump=""
  if [ -z "$dump" ]; then
    echo "[settle] no UI dump yet (attempt ${attempt}/6)"
    sleep 3
    continue
  fi
  last_dump_attempt=$attempt
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
# Only a dialog still on screen in the LAST dump fails the leg. No dump at all, or a
# dismissed dialog followed by dump-less attempts, is not a reason to stop before a
# single flow has run: Maestro's own driver start-up is the next check of the guest.
if [ "$last_dump_attempt" -eq 0 ]; then
  echo "[settle] could not get a UI dump in 6 attempts; continuing without the dialog check" >&2
  exit 0
fi
if [ "$last_dump_attempt" -lt 6 ]; then
  echo "[settle] Wait was tapped on attempt ${last_dump_attempt} and no later dump confirmed the screen; continuing" >&2
  exit 0
fi
echo "[settle] a system error dialog kept coming back" >&2
exit 1
