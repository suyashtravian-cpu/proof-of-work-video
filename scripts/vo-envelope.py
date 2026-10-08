#!/usr/bin/env python3
"""Precompute a 30 fps loudness envelope of the ad voice for the v4 voice orb.

  python3 scripts/vo-envelope.py [public/v3/vo-fast.wav] [src/v4/vo-envelope.json]

The render never decodes audio: src/v4/kit/VoiceOrb.tsx reads this JSON.
Output: {"fps": 30, "source": ..., "duration": s, "level": [0..1 per frame]}.
Level = RMS over a 1/15 s window centred on each frame, in dB mapped from
-48 dB below the take's 99th-percentile peak to 1.0, then a fast-attack /
slower-release follower so the orb snaps open on syllables and settles softly.
Standard library + ffmpeg only.
"""
import array, json, math, subprocess, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "public/v3/vo-fast.wav"
OUT = sys.argv[2] if len(sys.argv) > 2 else "src/v4/vo-envelope.json"
FPS, SR, FLOOR_DB = 30, 24000, 48.0

raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
    check=True, capture_output=True,
).stdout
pcm = array.array("f")
pcm.frombytes(raw)
n = len(pcm)
hop = SR / FPS
frames = int(math.ceil(n / hop))
half = int(hop)  # window = 2 hops, centred

rms = []
for i in range(frames):
    c = int(i * hop + hop / 2)
    a, b = max(0, c - half), min(n, c + half)
    s = 0.0
    for k in range(a, b):
        v = pcm[k]
        s += v * v
    rms.append(math.sqrt(s / max(1, b - a)))

db = [20 * math.log10(r + 1e-9) for r in rms]
peak = sorted(db)[int(len(db) * 0.99)]
lin = [min(1.0, max(0.0, (d - (peak - FLOOR_DB)) / FLOOR_DB)) ** 1.6 for d in db]

level, y = [], 0.0
for x in lin:
    y += (x - y) * (0.75 if x > y else 0.28)
    level.append(round(y, 3))

json.dump(
    {"fps": FPS, "source": SRC.replace("public/", ""), "duration": round(n / SR, 3), "level": level},
    open(OUT, "w"),
    separators=(",", ":"),
)
print(f"{OUT}: {frames} frames, {n / SR:.2f}s, peak {peak:.1f} dBFS")
