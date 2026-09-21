#!/bin/sh
# Rebuilds voice/clips.json from whatever recordings are sitting in voice/.
#   tools/voice-manifest.sh [ekstensi]      (default: m4a)
set -e
ext="${1:-m4a}"
cd "$(dirname "$0")/.."
list=$(ls voice/*."$ext" 2>/dev/null | sed "s|voice/||; s|\.$ext\$||" | sort \
  | awk '{printf "%s\n    \"%s\"", (NR>1 ? "," : ""), $0}')
printf '{\n  "ext": "%s",\n  "have": [%s\n  ]\n}\n' "$ext" "$list" > voice/clips.json
printf 'voice/clips.json: %s rekaman .%s\n' "$(ls voice/*."$ext" 2>/dev/null | wc -l | tr -d ' ')" "$ext"
