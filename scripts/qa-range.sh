#!/usr/bin/env bash
# scripts/qa-range.sh <fromSec> <toSec> <name> [frames=14]
# Renders a slice of the edit at half scale and writes a timestamped contact sheet.
set -euo pipefail
from="$1"; to="$2"; name="$3"; n="${4:-14}"
a=$(python3 -c "print(round($from*30))"); b=$(python3 -c "print(round($to*30)-1)")
mkdir -p out/qa
node scripts/snapshot-code.mjs >/dev/null
npx remotion render ProofOfWorkVertical "out/qa/$name.mp4" --frames="$a-$b" --scale=0.5 --concurrency=2 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --log=error
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/qa/$name.mp4")
fps=$(python3 -c "print($n/$dur)")
ffmpeg -loglevel error -y -i "out/qa/$name.mp4" -vf "fps=$fps,scale=270:-1,drawtext=text='%{eif\:t+$from\:d}.%{eif\:mod((t+$from)*10\,10)\:d}s':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=7x$(( (n+6)/7 ))" -frames:v 1 "out/qa/$name.sheet.png"
echo "out/qa/$name.mp4  out/qa/$name.sheet.png"
