import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { C, clamp01 } from "./util";

export type CaptionWord = { w: string; s: number; e: number };
export type CaptionLine = {
  t: number;
  end: number;
  words: CaptionWord[];
  /** Indices of words drawn in red (use sparingly: one per line at most). */
  red?: number[];
  /** Hide this line (when the same words are already big on screen). */
  hide?: boolean;
  /** Clear the line at this time instead of the default linger. */
  until?: number;
};

/** Split a word into model-sized tokens: "Interactive" → "Inter" "act" "ive", trailing punctuation on its own. */
export const tokenize = (word: string): string[] => {
  const m = word.match(/^(.*?)([.,?!…:;]*)$/);
  const core = m?.[1] ?? word;
  const punct = m?.[2] ?? "";
  const out: string[] = [];
  if (core.length <= 4) out.push(core);
  else {
    let i = 0;
    let k = 0;
    while (i < core.length) {
      const left = core.length - i;
      let n = 3 + Math.floor(random(`tok-${core}-${k++}`) * 3);
      if (left <= 5 || left - n < 2) n = left;
      out.push(core.slice(i, i + n));
      i += n;
    }
  }
  if (punct) out.push(punct);
  return out.filter((x) => x.length > 0);
};

/** Token appearance times for one word: spread across the spoken word, punctuation lands as it ends. */
const tokenTimes = (w: CaptionWord, toks: string[]) => {
  const hasPunct = /^[.,?!…:;]+$/.test(toks[toks.length - 1]) && toks.length > 1;
  const n = toks.length - (hasPunct ? 1 : 0);
  const d = Math.min(0.34, Math.max(0.08, w.e - w.s)) * 0.85;
  return toks.map((_, k) => (k < n ? w.s + (d * k) / n : w.s + d));
};

const LINGER = 0.55;

/**
 * Captions that stream in like model output: token-sized chunks on the voice, a faint blinking caret,
 * clean white Hubot Sans, no box. Sits in the Meta-safe band (top 1236, two lines max).
 */
export const TokenCaptions: React.FC<{ lines: CaptionLine[]; top?: number; size?: number; width?: number }> = ({ lines, top = 1236, size = 58, width = 940 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const idx = lines.reduce((acc, l, i) => (t >= l.t - 0.02 ? i : acc), -1);
  if (idx < 0) return null;
  const line = lines[idx];
  if (line.hide) return null;
  const next = lines[idx + 1];
  const off = Math.min(next ? next.t - 0.03 : Infinity, line.until ?? line.end + LINGER);
  if (t >= off) return null;
  const fade = clamp01((off - t) / 0.08);
  const toks = line.words.map((w) => {
    const parts = tokenize(w.w);
    const times = tokenTimes(w, parts);
    return parts.map((p, k) => ({ p, at: times[k] }));
  });
  const flat = toks.flat();
  const shownCount = flat.filter((x) => t >= x.at).length;
  const lastAt = flat[shownCount - 1]?.at ?? line.t;
  const streaming = t - lastAt < 0.12;
  const blink = streaming || Math.floor(t * 3.4) % 2 === 0;
  let n = 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top,
          left: (1080 - width) / 2,
          width,
          textAlign: "center",
          fontFamily: C.sans,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.14,
          letterSpacing: "-0.025em",
          color: C.white,
          opacity: fade,
          textShadow: "0 2px 16px rgba(0,0,0,.9), 0 0 3px rgba(0,0,0,.8)",
        }}
      >
        {toks.map((parts, wi) => [
          <span key={wi} style={{ whiteSpace: "nowrap", color: line.red?.includes(wi) ? C.red : undefined }}>
            {parts.map(({ p, at }, k) => {
              n++;
              const age = t - at;
              const on = age >= 0;
              const k2 = clamp01(age / 0.07);
              const fresh = on ? clamp01(1 - age / 0.2) : 0;
              const caret = n === shownCount;
              return (
                <span key={k}>
                  <span
                    style={{
                      display: "inline-block",
                      opacity: on ? 0.25 + 0.75 * k2 : 0,
                      transform: `translateY(${(1 - k2) * 5}px)`,
                      textShadow: fresh > 0 ? `0 0 ${18 * fresh}px rgba(255,255,255,${0.6 * fresh}), 0 2px 16px rgba(0,0,0,.9)` : undefined,
                    }}
                  >
                    {p}
                  </span>
                  {caret && (
                    <span style={{ display: "inline-block", width: 0, position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: size * 0.07,
                          bottom: -size * 0.12,
                          width: size * 0.08,
                          height: size * 0.82,
                          background: C.white,
                          opacity: blink ? 0.5 : 0,
                          boxShadow: "0 0 10px rgba(0,0,0,.6)",
                        }}
                      />
                    </span>
                  )}
                </span>
              );
            })}
          </span>,
          wi < toks.length - 1 ? " " : null,
        ])}
      </div>
    </AbsoluteFill>
  );
};
