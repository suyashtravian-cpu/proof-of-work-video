#!/usr/bin/env bash
# capture/sheet.sh <video> [count=12] -> <video>.sheet.png : evenly spaced frames, timestamped.
set -euo pipefail
v="$1"; n="${2:-12}"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v")
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$v")
iw=${w%,*}; ih=${w#*,}
if [ "$iw" -gt "$ih" ]; then cols=3; tw=640; else cols=6; tw=300; fi
rows=$(( (n + cols - 1) / cols ))
fps=$(python3 -c "print($n/$dur)")
ffmpeg -loglevel error -y -i "$v" -vf "fps=$fps,scale=$tw:-1,drawtext=text='%{pts\:hms}':x=8:y=8:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}" -frames:v 1 "${v%.mp4}.sheet.png"
echo "${v%.mp4}.sheet.png"
