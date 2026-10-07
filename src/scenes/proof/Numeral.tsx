import { random, useCurrentFrame } from "remotion";
import { easeExpo, easeOut, tween } from "../../components/anim";
import { Scramble } from "../../fx/Scramble";
import { theme } from "../../theme";
import { CYAN } from "./geom";

export type Num = {
  from: number;
  to: number;
  value: number;
  countFrom?: number;
  countTo?: number;
  label: string;
  sub?: string;
  /** Big slammed line under the label, e.g. the spend. [text, accent part, at] */
  big?: [string, string, number];
  names?: string[];
};

export const NUM_TOP = 150;

/** Giant outlined numeral: slams in with chroma split, scrambles until the footage starts counting, then counts in sync and lands. */
export const Numeral: React.FC<{ n: Num | undefined; active?: number }> = ({ n, active = 0 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (!n) return null;
  const k = tween(t, n.from, n.from + 0.35, 0, 1, easeExpo);
  const out = tween(t, n.to - 0.12, n.to, 0, 1);
  const counting = n.countFrom !== undefined;
  const final = n.value.toLocaleString("en-US");
  let text = final;
  let scrambling = false;
  if (counting && t < n.countFrom!) {
    scrambling = true;
    text = [...final].map((ch, i) => (/\d/.test(ch) ? String(Math.floor(random(`nd${n.value}${i}${Math.floor(f / 2)}`) * 10)) : ch)).join("");
  } else if (counting) {
    text = Math.round(tween(t, n.countFrom!, n.countTo!, 0, n.value, easeOut)).toLocaleString("en-US");
  }
  const landedAt = counting ? n.countTo! : n.from + 0.3;
  const landed = t >= landedAt;
  const since = t - landedAt;
  const thump = landed ? Math.max(0, 1 - since / 0.35) : 0;
  const fill = counting ? (landed ? 1 : 0) : tween(t, n.from + 0.15, n.from + 0.45, 0, 1);
  const chroma = 34 * (1 - k) ** 2 + (counting ? 22 * thump * thump : 0) + (scrambling ? 3 + random(`nc${f}`) * 5 : 0);
  const size = final.length >= 5 ? 250 : 300;
  const push = 1 + 0.04 * tween(t, n.from, n.to, 0, 1);
  const scale = (1.5 - 0.5 * k) * (1 + thump * 0.12) * push * (1 + out * 0.12);
  const flashRed = counting && n.value > 1000 && landed && since < 0.12;
  const layer = (color: string, stroke: string, dx: number, op: number, blend?: React.CSSProperties["mixBlendMode"]) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        textAlign: "center",
        fontFamily: theme.sans,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 0.9,
        letterSpacing: "-0.06em",
        color,
        WebkitTextStroke: `3px ${stroke}`,
        transform: `translateX(${dx}px)`,
        opacity: op,
        mixBlendMode: blend,
        whiteSpace: "pre",
      }}
    >
      {text}
    </div>
  );
  const strokeCol = scrambling ? "#ffffff70" : theme.fg;
  return (
    <div style={{ position: "absolute", top: NUM_TOP, left: 0, right: 0, opacity: k * (1 - out) }}>
      <div style={{ position: "relative", height: size * 0.9, transform: `scale(${scale}) translateY(${out * -30}px)`, transformOrigin: "50% 55%" }}>
        {chroma > 0.5 && layer("transparent", theme.red, -chroma, 0.85, "screen")}
        {chroma > 0.5 && layer("transparent", CYAN, chroma, 0.85, "screen")}
        {layer("transparent", strokeCol, 0, 1)}
        {fill > 0 && layer(flashRed ? theme.red : theme.fg, flashRed ? theme.red : theme.fg, 0, fill)}
      </div>
      <div style={{ textAlign: "center", fontFamily: theme.mono, fontSize: 30, letterSpacing: "0.2em", color: theme.fg, marginTop: 14 }}>
        <Scramble text={n.label} at={n.from + 0.08} dur={0.45} />
      </div>
      {n.names && (
        <div style={{ display: "flex", justifyContent: "center", gap: 34, marginTop: 16, fontFamily: theme.mono, fontSize: 25, letterSpacing: "0.12em" }}>
          {n.names.map((nm, i) => (
            <div key={nm} style={{ color: i === active ? theme.fg : theme.dim, position: "relative", paddingBottom: 8 }}>
              <span style={{ color: i === active ? theme.red : theme.dim }}>{String(i + 1).padStart(2, "0")} </span>
              <Scramble text={nm} at={n.from + 0.15 + i * 0.1} dur={0.35} />
              <div style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: i === active ? "100%" : "0%", background: theme.red }} />
            </div>
          ))}
        </div>
      )}
      {n.sub && (
        <div style={{ textAlign: "center", fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.16em", color: theme.dim, marginTop: 14 }}>
          <Scramble text={n.sub} at={n.from + 0.3} dur={0.5} />
        </div>
      )}
      {n.big && t >= n.big[2] && <Big text={n.big[0]} accent={n.big[1]} at={n.big[2]} t={t} />}
    </div>
  );
};

const Big: React.FC<{ text: string; accent: string; at: number; t: number }> = ({ text, accent, at, t }) => {
  const k = tween(t, at, at + 0.28, 0, 1, easeExpo);
  const [a, b] = text.split(accent);
  return (
    <div
      style={{
        textAlign: "center",
        fontFamily: theme.sans,
        fontWeight: 800,
        fontSize: 78,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        color: theme.fg,
        marginTop: 16,
        opacity: k,
        transform: `scale(${1.7 - 0.7 * k})`,
      }}
    >
      {a}
      <span style={{ color: theme.red }}>{accent}</span>
      {b}
    </div>
  );
};
