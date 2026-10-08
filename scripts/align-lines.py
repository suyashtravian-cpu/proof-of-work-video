#!/usr/bin/env python3
"""Map script lines onto a take's word timestamps, keeping the take's own timing.

  python3 scripts/align-lines.py <words.json> <lines.txt> <out.json>
"""
import difflib, json, sys

def norm(w):
    return w.lower().replace("-", "").strip(".,?!…'\" ")

words = json.load(open(sys.argv[1]))
lines = [l.strip() for l in open(sys.argv[2]) if l.strip()]
tok, owner = [], []
for i, l in enumerate(lines):
    for w in l.split():
        if norm(w):
            tok.append(norm(w)); owner.append(i)
sm = difflib.SequenceMatcher(a=tok, b=[norm(w["w"]) for w in words], autojunk=False)
got = {i: [] for i in range(len(lines))}
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        got[owner[a + k]].append(words[b + k])
out = []
for i, l in enumerate(lines):
    ws = sorted(got[i], key=lambda w: w["s"])
    if not ws:
        sys.exit(f"line not found in take: {l!r}")
    out.append({"text": l, "t": round(ws[0]["s"], 3), "end": round(ws[-1]["e"], 3),
                "words": [{"w": w["w"], "s": w["s"], "e": w["e"]} for w in ws]})
json.dump(out, open(sys.argv[3], "w"), indent=1, ensure_ascii=False)
for o in out:
    print(f"{o['t']:6.2f}-{o['end']:6.2f}  {o['text']}")
