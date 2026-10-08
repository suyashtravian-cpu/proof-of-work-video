#!/usr/bin/env python3
"""
Final mix: sound effects (from an `audio: "sfx"` render) + voiceover + music ducked under the voice.

  python3 scripts/mix-audio.py <sfx-source.mp4|wav> <voiceover.wav|-> <music.wav> <out.wav> [length_seconds]

Pass "-" for the voiceover to mix music and sound effects only (no ducking).

The music dips DUCK_DB under speech (fast attack, slow release) and the whole mix is
normalised linearly to -14 LUFS with a -1 dBTP limiter, the usual target for social video.
"""
import subprocess, sys
import numpy as np

SR = 48000
LENGTH = 48.7
MUSIC_GAIN_DB = -2.9
SFX_GAIN_DB = -1.5
DUCK_DB = -9.0
ATTACK, RELEASE = 0.06, 0.35


def decode(path, ch=2, length=None):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, ch)
    n = int((length or LENGTH) * SR)
    out = np.zeros((n, ch), np.float32)
    out[:min(n, len(x))] = x[:n]
    return out


def db(x):
    return 10 ** (x / 20)


def main(sfx_path, vo_path, music_path, out, length=None):
    length = float(length) if length else None
    sfx, music = decode(sfx_path, length=length), decode(music_path, length=length)
    vo = decode(vo_path, length=length) if vo_path != "-" else np.zeros_like(sfx)
    # Voice activity from a 30 ms RMS envelope.
    win = int(0.03 * SR)
    mono = vo.mean(1)
    rms = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, mode="same"))
    active = (rms > db(-42)).astype(np.float32)
    # One-pole attack/release smoothing of the duck amount.
    env = np.zeros_like(active)
    a, r = np.exp(-1 / (ATTACK * SR)), np.exp(-1 / (RELEASE * SR))
    v = 0.0
    for i, x in enumerate(active):
        c = a if x > v else r
        v = c * v + (1 - c) * x
        env[i] = v
    duck = 1 - (1 - db(DUCK_DB)) * env
    mix = sfx * db(SFX_GAIN_DB) + vo + music * db(MUSIC_GAIN_DB) * duck[:, None]
    pcm = mix.astype(np.float32).tobytes()
    meter = subprocess.run(["ffmpeg", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                           input=pcm, capture_output=True).stderr.decode()
    lufs = float([l for l in meter.splitlines() if l.strip().startswith("I:")][-1].split()[1])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-af", f"volume={-14.0 - lufs:.2f}dB,alimiter=limit=0.89:attack=3:release=80:level=false", out],
                   input=pcm, check=True)
    print(f"{out}: {lufs:.1f} LUFS -> -14")


if __name__ == "__main__":
    main(*sys.argv[1:6])
