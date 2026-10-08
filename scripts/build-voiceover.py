#!/usr/bin/env python3
"""
Place a single-take voiceover onto the edit, one script line per visual beat.

  python3 scripts/build-voiceover.py <vo.mp3> <vo-words.json> <out.wav> <out-timing.json>

vo-words.json holds word timestamps for the take (faster-whisper, word_timestamps=True:
[{"w","s","e"}...]). Each script line is matched to its words, long pauses inside a line
are tightened, and each line starts on its slot. Lines tied to a visual hit stay within a
few frames of it; the rest absorb any overrun by starting early, slipping late, or a speed-up
of at most 8 % (15 % as a last resort). The timing JSON gives every placed line and word in video seconds, so the
captions follow the real voice.
"""
import difflib, json, subprocess, sys
import numpy as np

SR = 48000
LENGTH = 48.7
GAP = 0.06            # minimum air between lines
MAX_PAUSE = 0.18      # internal pauses longer than this are shortened to it
MAX_SPEED = 1.08      # inaudible on TTS
HARD_SPEED = 1.15     # last resort

# Slot = video time the line's first word should land on (matches src/script.ts, joke shift applied).
SLOTS = [
    (0.2, "I stopped sending résumés."), (2.3, "Every application asks for the same thing."), (4.4, "Upload your résumé."),
    (6.0, "But a résumé only tells you where I've worked."), (8.8, "Not how I think."), (10.1, "Not what I can build."),
    (11.4, "Not what I can actually do."), (13.2, "So I opened ChatGPT..."), (14.95, "Make no mistakes."),
    (16.2, "and built this instead."), (17.9, "Three live products."), (19.4, "Four interactive brand concepts."),
    (21.5, "Ten original experiments."), (23.4, "And real campaigns, with real numbers."),
    (26.0, "Almost two thousand Reddit clicks, from fifty-nine dollars."), (29.4, "Not a list of skills."),
    (31.0, "Proof of them."), (32.7, "If I'm asking you to bet on what I can do..."), (35.4, "you should get more than a PDF."),
    (37.8, "Oh — and this video?"), (39.3, "I never opened an editor."), (41.0, "AI wrote the whole edit, in code."),
    (43.2, "I don't just talk about AI."), (44.9, "I ship with it."),
]
# Lines tied to a visual hit (kinetic slams, the joke, numerals, the ship beat).
ANCHORS = {0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 16, 22, 23}
NUM = {"three": "3", "four": "4", "ten": "10", "fifty-nine": "59", "two": "2000", "thousand": "", "dollars": "", "i'm": "i"}


def norm(w):
    w = w.lower().replace("$", "").replace(",", "").strip(".,?!—-…'\" ")
    return NUM.get(w, w)


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def stretch(x, factor):
    """Speed up by `factor` without changing pitch (ffmpeg atempo)."""
    out = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                          "-af", f"atempo={factor:.4f}", "-f", "f32le", "-"], input=x.tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).copy()


def main(vo_path, words_path, out_wav, out_json):
    words = json.load(open(words_path))
    audio = decode(vo_path)
    tok, owner = [], []
    for i, (_, text) in enumerate(SLOTS):
        for w in text.replace("—", " ").split():
            if norm(w):
                tok.append(norm(w)); owner.append(i)
    sm = difflib.SequenceMatcher(a=tok, b=[norm(w["w"]) for w in words], autojunk=False)
    line_words = {i: [] for i in range(len(SLOTS))}
    for a, b, size in sm.get_matching_blocks():
        for k in range(size):
            line_words[owner[a + k]].append(words[b + k])
    missing = [SLOTS[i][1] for i, ws in line_words.items() if not ws]
    if missing:
        sys.exit(f"could not find these lines in the take: {missing}")

    # Cut each line out of the take, tightening long internal pauses.
    clips = []
    for i in range(len(SLOTS)):
        ws = sorted(line_words[i], key=lambda w: w["s"])
        pieces, wtimes, cursor = [], [], 0.0
        for j, w in enumerate(ws):
            s = w["s"] - (0.04 if j == 0 else 0)
            e = w["e"] + (0.12 if j == len(ws) - 1 else 0)
            if j > 0:
                gap = w["s"] - ws[j - 1]["e"]
                keep = min(gap, MAX_PAUSE)
                if keep > 0:
                    pieces.append(np.zeros(int(keep * SR), np.float32)); cursor += keep
                s = w["s"]
            seg = audio[int(s * SR):int(e * SR)]
            wtimes.append((w["w"], cursor + (w["s"] - s), cursor + (w["e"] - s)))
            pieces.append(seg); cursor += len(seg) / SR
        clip = np.concatenate(pieces)
        n = int(0.008 * SR)
        clip[:n] *= np.linspace(0, 1, n); clip[-n:] *= np.linspace(1, 0, n)
        clips.append([clip, wtimes, 1.0])

    # Place on slots. Anchor lines land on a visual hit and may only move a few frames;
    # the others can start early into the gap before them or slip slightly late.
    # Overruns are resolved by (1) pulling the overrunning line earlier, (2) a gentle
    # speed-up, (3) pushing a soft next line later, (4) a firmer speed-up.
    starts = [s for s, _ in SLOTS]
    durs = [len(c[0]) / SR for c in clips]
    speed = [1.0] * len(SLOTS)
    win = [(-0.06, 0.12) if i in ANCHORS else (-0.40, 0.30) for i in range(len(SLOTS))]
    for _ in range(200):
        bad = [i for i in range(len(SLOTS) - 1) if starts[i] + durs[i] / speed[i] + GAP > starts[i + 1] + 2e-3]
        if not bad:
            break
        i = bad[0]
        over = starts[i] + durs[i] / speed[i] + GAP - starts[i + 1]
        prev_end = starts[i - 1] + durs[i - 1] / speed[i - 1] + GAP if i > 0 else 0.0
        early = min(over, starts[i] - max(prev_end, SLOTS[i][0] + win[i][0]))
        if early > 1e-3:
            starts[i] -= early; continue
        if speed[i] < MAX_SPEED - 1e-3:
            speed[i] = min(MAX_SPEED, durs[i] / (durs[i] / speed[i] - over - 1e-3)); continue
        late = min(over, SLOTS[i + 1][0] + win[i + 1][1] - starts[i + 1])
        if late > 1e-3:
            starts[i + 1] += late; continue
        if speed[i] < HARD_SPEED - 1e-3:
            speed[i] = min(HARD_SPEED, durs[i] / (durs[i] / speed[i] - over - 1e-3)); continue
        sys.exit(f"cannot fit line {i}: {SLOTS[i][1]!r} (over by {over:.2f}s)")
    for i in range(len(SLOTS)):
        if speed[i] > 1.0005:
            clip, wt, _ = clips[i]
            clips[i] = [stretch(clip, speed[i]), [(w, a / speed[i], b / speed[i]) for w, a, b in wt], speed[i]]

    bed = np.zeros(int(LENGTH * SR), np.float32)
    timing = []
    for i, (slot, text) in enumerate(SLOTS):
        clip, wt, factor = clips[i]
        a = int(starts[i] * SR)
        b = min(len(bed), a + len(clip))
        bed[a:b] += clip[:b - a]
        timing.append({"text": text, "slot": slot, "t": round(starts[i], 3), "end": round(starts[i] + len(clip) / SR, 3),
                       "speed": round(factor, 3), "words": [{"w": w, "s": round(starts[i] + s, 3), "e": round(starts[i] + e, 3)} for w, s, e in wt]})

    pcm = bed.tobytes()
    meter = subprocess.run(["ffmpeg", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                           input=pcm, capture_output=True).stderr.decode()
    lufs = float([l for l in meter.splitlines() if l.strip().startswith("I:")][-1].split()[1])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-af", f"volume={-16.0 - lufs:.2f}dB,alimiter=limit=0.89:level=false", "-ac", "2", out_wav], input=pcm, check=True)
    json.dump(timing, open(out_json, "w"), indent=1, ensure_ascii=False)
    for l in timing:
        d = l["t"] - l["slot"]
        moved = f"  (moved {d:+.2f}s)" if abs(d) > 0.005 else ""
        sped = f"  (x{l['speed']})" if l["speed"] > 1 else ""
        print(f"{l['t']:6.2f}-{l['end']:6.2f}  {l['text']}{moved}{sped}")


if __name__ == "__main__":
    main(*sys.argv[1:5])
