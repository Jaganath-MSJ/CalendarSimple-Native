#!/usr/bin/env bash
# Records the four README GIFs on the iOS simulator into .github/assets/demo:
# views.gif, drag-and-resize.gif, dark-mode.gif and localization.gif.
#
# Needs macOS with Xcode (simctl, swift), Maestro, a booted iPhone simulator
# with Expo Go, and the example's Metro server (`npm run example -- start`).
# Turn off Expo Go's floating "Tools button" once (Expo Go menu → Tools
# button) so it does not show in the recording.
#
#   npm run readme:gifs            # every GIF
#   npm run readme:gifs -- drag    # only some: views, drag, theme, locale
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$ROOT/scripts/readme-gifs"
OUT="$ROOT/.github/assets/demo"
DEVICE="${DEVICE:-booted}"
URL="${EXPO_URL:-exp://127.0.0.1:8081}"
WIDTH=540 # GIF width in pixels (shown at 270 in the README: sharp on 2x screens)
FPS=10
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
DEMOS=("$@")
[ ${#DEMOS[@]} -eq 0 ] && DEMOS=(views drag theme locale)

maestro_run() { # <yaml body>
  printf 'appId: host.exp.Exponent\n---\n%s\n' "$1" >"$TMP/flow.yaml"
  maestro --device "$DEVICE" test "$TMP/flow.yaml" >/dev/null
}

open_demo() { # <demo>
  xcrun simctl openurl "$DEVICE" "$URL/--/?screen=readme-$1"
  maestro_run '- extendedWaitUntil:
    visible: { id: "calendar-header-title" }
    timeout: 120000'
}

start_video() {
  rm -f "$TMP/video.mp4"
  xcrun simctl io "$DEVICE" recordVideo --codec h264 --force "$TMP/video.mp4" \
    >/dev/null 2>&1 &
  VIDEO_PID=$!
  sleep 1
}

stop_video() {
  kill -INT "$VIDEO_PID"
  wait "$VIDEO_PID" || true
}

# <name> <start-s> <end-s> <frame-ms> <hold-last-ms> <max-still-ms>
encode() {
  rm -rf "$TMP/frames"
  xcrun swift "$HERE/frames.swift" "$TMP/video.mp4" "$TMP/frames" "$FPS" \
    "$WIDTH" "$2" "$3" 2>/dev/null
  node "$HERE/encode.mjs" "$TMP/frames" "$OUT/$1.gif" "$4" "$5" "$6"
}

# A clean status bar, light appearance, and Expo Go in UTC (the all-day
# row shows "GMT+00", not the Mac's time zone).
xcrun simctl status_bar "$DEVICE" override --time 9:41 --dataNetwork wifi \
  --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 \
  --batteryState charged --batteryLevel 100
xcrun simctl ui "$DEVICE" appearance light
xcrun simctl terminate "$DEVICE" host.exp.Exponent 2>/dev/null || true
SIMCTL_CHILD_TZ=UTC xcrun simctl launch "$DEVICE" host.exp.Exponent >/dev/null
open_demo drag

# The self-running demos step every 2.2 s from the moment they mount, so
# each recording starts just before the switch to it.
cycle() { # <demo> <gif name> <steps>
  open_demo drag # another demo first, so the next one mounts afresh
  start_video
  xcrun simctl openurl "$DEVICE" "$URL/--/?screen=readme-$1"
  sleep "$(echo "$3 * 2.2 + 2" | bc)"
  stop_video
  # From the first frame after the switch: one full cycle.
  encode "$2" 1.5 "$(echo "1.5 + $3 * 2.2" | bc)" 100 0 2200
}

drag() {
  open_demo views
  open_demo drag
  # "Team sync" (Tue 10:00–11:00): its frame in points.
  read -r X Y W H < <(maestro --device "$DEVICE" hierarchy | python3 -c '
import json, re, sys
def walk(n):
    a = n.get("attributes", {})
    if a.get("resource-id") == "calendar-sync-day-event-item":
        x1, y1, x2, y2 = map(int, re.findall(r"\d+", a["bounds"]))
        print(x1, y1, x2 - x1, y2 - y1); sys.exit()
    for c in n.get("children", []): walk(c)
walk(json.load(sys.stdin))')
  local cx=$((X + W / 2)) cy=$((Y + H / 2)) col=$((W + 4))
  start_video
  sleep 1
  # Long press, then a day later and an hour (the event's height) down.
  maestro_run "- swipe:
    start: $cx, $cy
    end: $((cx + col)), $((cy + H))
    duration: 3500"
  sleep 1
  # Long press near the new bottom edge, then 30 minutes longer.
  local bx=$((cx + col)) by=$((Y + H + H - 4))
  maestro_run "- swipe:
    start: $bx, $by
    end: $bx, $((by + H / 2))
    duration: 3000"
  sleep 1.5
  stop_video
  encode drag-and-resize 0.5 999 70 1500 1000
}

for demo in "${DEMOS[@]}"; do
  case "$demo" in
    views) cycle views views 4 ;;
    theme) cycle theme dark-mode 2 ;;
    locale) cycle locale localization 3 ;;
    drag) drag ;;
    *) echo "unknown demo: $demo (views, drag, theme, locale)" >&2; exit 2 ;;
  esac
done
