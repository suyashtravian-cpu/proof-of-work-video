#!/usr/bin/env python3
"""
Cut a music track to the edit's timeline (seconds below are video time).

  python3 scripts/build-music.py <track.mp3> <offset_seconds> <out.wav> [plain_length]

With plain_length, only align, trim and fade (for edits without the v1 beats).

offset = (track time of the track's drop) - 16.2, so the drop lands as the résumé
shatters into the site. The music file itself is never committed: Mixkit tracks are
free to use in videos but not to redistribute (Mixkit Stock Music Free License).
"""
import subprocess, sys
import numpy as np

SR = 48000
LENGTH = 48.7

JOKE = (14.85, 15.0, 16.2)          # fade out, silent, drop back in on the reveal
TAPE_STOP = (37.70, 38.05)          # "Oh — and this video?": the music winds down
REWIND = (38.12, 38.90, 7.8)        # sped-up reverse of the last 7.8 s while the film strip rewinds
RESUME = (38.95, 0.35)              # rebuild under the code reveal
SHIP = (44.55, 44.88, 44.90)        # duck, gap, then "I ship with it." hits with the music
FADE_OUT = (47.6, LENGTH)


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def at(t):
    return int(round(t * SR))


def main(src, offset, out, plain_length=None):
    track = decode(src)
    if plain_length:
        n = at(plain_length)
        a = at(offset)
        bed = np.zeros((n, 2), np.float32)
        seg = track[max(a, 0):max(a, 0) + n]
        bed[max(-a, 0):max(-a, 0) + len(seg)] = seg[:n - max(-a, 0)]
        t = np.arange(n) / SR
        bed *= np.clip((plain_length - t) / 1.6, 0, 1)[:, None]   # fade out
        bed *= np.clip(t / 0.08, 0, 1)[:, None]                   # click-free start
        return finish(bed, out)
    n = at(LENGTH)

    def music(t0, t1):
        """Track audio for video time [t0, t1), padded with silence outside the track."""
        a, b = at(t0 + offset), at(t1 + offset)
        seg = np.zeros((b - a, 2), np.float32)
        lo, hi = max(a, 0), min(b, len(track))
        if hi > lo:
            seg[lo - a:hi - a] = track[lo:hi]
        return seg

    bed = music(0, LENGTH)[:n]
    t = np.arange(n) / SR
    gain = np.ones(n, np.float32)

    # The joke: dead air, then the drop on the reveal.
    f0, f1, back = JOKE
    gain *= np.clip((f1 - t) / (f1 - f0), 0, 1) + (t >= back)

    # Tape stop: playback rate falls 1 -> 0, position p(u) = u - u^2 / (2T).
    s0, s1 = TAPE_STOP
    T = s1 - s0
    src_seg = music(s0, s1 + 0.01)
    u = np.arange(at(s1) - at(s0)) / SR
    pos = (u - u * u / (2 * T)) * SR
    for c in range(2):
        bed[at(s0):at(s1), c] = np.interp(pos, np.arange(len(src_seg)), src_seg[:, c])
    bed[at(s1) - at(0.04):at(s1)] *= np.linspace(1, 0, at(0.04))[:, None]

    # Rewind: the previous seconds of music, reversed and squeezed into the strip's rewind.
    r0, r1, span = REWIND
    rev = music(s0 - span, s0)[::-1]
    m = at(r1) - at(r0)
    idx = np.linspace(0, len(rev) - 1, m)
    rw = np.stack([np.interp(idx, np.arange(len(rev)), rev[:, c]) for c in range(2)], 1)
    rw *= (np.minimum(1, np.linspace(0, 6, m)) * np.minimum(1, np.linspace(6, 0, m)))[:, None] * 0.6
    resume_at, fade = RESUME
    gain[at(s1):] = 0
    gain[at(resume_at):] = np.clip((t[at(resume_at):] - resume_at) / fade, 0, 1)
    bed[at(s1):at(resume_at)] = 0
    bed *= gain[:, None]
    bed[at(r0):at(r1)] += rw.astype(np.float32)

    # Pre-hit duck so "I ship with it." lands with the music.
    d0, d1, hit = SHIP
    duck = np.ones(n, np.float32)
    w = (t >= d0) & (t < hit)
    duck[w] = np.interp(t[w], [d0, d1, hit - 1e-4], [1.0, 0.15, 0.0])
    bed *= duck[:, None]

    # Out.
    e0, e1 = FADE_OUT
    bed *= np.clip((e1 - t) / (e1 - e0), 0, 1)[:, None]

    finish(bed, out)


def finish(bed, out):
    # Linear gain to -16 LUFS (loudnorm's dynamic mode would flatten the intro/drop contrast),
    # with a limiter only to catch peaks.
    pcm = bed.astype(np.float32).tobytes()
    meter = subprocess.run(["ffmpeg", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                            "-af", "ebur128", "-f", "null", "-"], input=pcm, capture_output=True).stderr.decode()
    lufs = float([l for l in meter.splitlines() if l.strip().startswith("I:")][-1].split()[1])
    gain_db = -16.0 - lufs
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-af", f"volume={gain_db:.2f}dB,alimiter=limit=0.89:attack=2:release=60:level=false",
                    "-ar", str(SR), out], input=pcm, check=True)
    print(f"{out}: {lufs:.1f} LUFS -> -16 ({gain_db:+.1f} dB)")


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]), sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else None)
