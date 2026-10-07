import { AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, easeOut, tween } from "../components/anim";
import { BrowserFrame } from "../components/BrowserFrame";
import { Paper, PAPER_H, PAPER_W } from "../components/Paper";
import { Shatter } from "../components/Shatter";
import { clip } from "../footage";
import { sec } from "../timing";
import { theme } from "../theme";

// Times are relative to this scene, which starts at 15.0s.
export const REVEAL = 0.95;
const FRAME_W = 1000;
const FRAME_H = (FRAME_W * 900) / 1440 + 46;
const FRAME_Y = -10;
const frameRect = { x: (1080 - FRAME_W) / 2, y: 960 + FRAME_Y - FRAME_H / 2, w: FRAME_W, h: FRAME_H };
const paperScale = 0.9;
const paperRect = { x: 540 - (PAPER_W * paperScale) / 2, y: 960 - (PAPER_H * paperScale) / 2, w: PAPER_W * paperScale, h: PAPER_H * paperScale };

// [scene start, scene end, clip, clip start sec, playbackRate, chip label]
export const CUTS: [number, number, string, number, number, string?][] = [
  [REVEAL, 1.7, "hero", 0.0, 1],
  [1.7, 2.15, "work", 3.2, 1, "LIVE BUILD 01 · BILTIB"],
  [2.15, 2.6, "work", 7.5, 1, "LIVE BUILD 02 · ICREATEEPIC"],
  [2.6, 3.15, "work", 11.8, 1, "LIVE BUILD 03 · MOOLANK 365"],
  [3.15, 5.15, "lab-archive", 1.0, 1.45, "03 / THE CONVERSION LAB"],
  [5.15, 7.15, "lab-archive", 11.5, 1.5, "07 / THE EXPERIMENT ARCHIVE"],
  [7.15, 9.75, "signals", 0.4, 1, "META ADS · MOOLANK 365"],
  [9.75, 13.1, "signals", 6.4, 1, "REDDIT ADS · ICREATEEPIC"],
];

const NUMERALS: { from: number; to: number; value: number; countFrom?: number; countTo?: number; label: string; sub?: string }[] = [
  { from: 1.7, to: 3.15, value: 3, label: "LIVE PRODUCTS" },
  { from: 3.2, to: 5.15, value: 4, label: "BRAND CONCEPTS" },
  { from: 5.3, to: 7.15, value: 10, label: "ORIGINAL EXPERIMENTS" },
  { from: 7.2, to: 9.75, value: 112, countFrom: 8.35, countTo: 9.1, label: "READING-REVEAL EVENTS", sub: "₹440 OF META ADS · 1–4 OCT" },
  { from: 9.8, to: 13.1, value: 1999, countFrom: 10.35, countTo: 11.1, label: "REDDIT CLICKS", sub: "FROM $59.17" },
];

const Numeral: React.FC<{ t: number }> = ({ t }) => {
  const n = NUMERALS.find((x) => t >= x.from && t < x.to);
  if (!n) return null;
  const k = tween(t, n.from, n.from + 0.3, 0, 1, easeExpo);
  const out = tween(t, n.to - 0.15, n.to, 0, 1);
  const shown = n.countFrom !== undefined ? Math.round(tween(t, n.countFrom, n.countTo!, 0, n.value, easeOut)) : n.value;
  const landed = n.countTo !== undefined && t >= n.countTo;
  const thump = landed ? Math.max(0, 1 - (t - n.countTo!) / 0.3) : 0;
  return (
    <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", opacity: k * (1 - out) }}>
      <div
        style={{
          fontFamily: theme.sans,
          fontWeight: 800,
          fontSize: shown >= 1000 ? 250 : 300,
          lineHeight: 0.9,
          letterSpacing: "-0.06em",
          color: landed ? theme.fg : "transparent",
          WebkitTextStroke: `3px ${theme.fg}`,
          transform: `scale(${(1.25 - 0.25 * k) * (1 + thump * 0.08)})`,
        }}
      >
        {shown.toLocaleString("en-US")}
      </div>
      <div style={{ fontFamily: theme.mono, fontSize: 30, letterSpacing: "0.22em", color: theme.fg, marginTop: 10 }}>{n.label}</div>
      {n.sub && <div style={{ fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.18em", color: theme.dim, marginTop: 10 }}>{n.sub}</div>}
    </div>
  );
};

// 15.0–28.1  "...and built this instead. Three live products. Four interactive brand concepts.
// Ten original experiments. And real campaigns, with real numbers. Almost 2,000 Reddit clicks, from $59."
export const Proof: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const reveal = tween(t, REVEAL, REVEAL + 0.25, 0, 1, easeOut);
  const settle = tween(t, REVEAL, REVEAL + 1.1, 0, 1, easeExpo);
  const drift = Math.sin(t * 0.7) * 3;
  const cut = CUTS.find(([a, b]) => t >= a && t < b);
  const sinceCut = cut ? t - cut[0] : 1;
  const flash = cut && cut[0] > REVEAL ? Math.max(0, 1 - sinceCut / 0.1) : 0;
  const punch = cut && cut[0] > REVEAL ? 1.06 - 0.06 * tween(sinceCut, 0, 0.4, 0, 1, easeExpo) : 1;
  const chip = cut?.[5];
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {t < 0.06 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `scale(${paperScale})`, filter: "brightness(.3)" }}>
            <Paper />
          </div>
        </AbsoluteFill>
      )}
      <Shatter from={paperRect} to={frameRect} at={0.03} />
      {t >= REVEAL && (
        <BrowserFrame
          width={FRAME_W}
          y={FRAME_Y}
          rotateX={(1 - settle) * 16 + 3}
          rotateY={drift}
          scale={0.96 + settle * 0.04}
          opacity={reveal}
        >
          {CUTS.map(([a, b, name, from, rate], i) => (
            <Sequence key={i} from={sec(a)} durationInFrames={sec(b) - sec(a)} layout="none">
              <OffthreadVideo
                src={clip(name)}
                trimBefore={sec(from)}
                playbackRate={rate}
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${punch})` }}
              />
            </Sequence>
          ))}
          <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.18 }} />
        </BrowserFrame>
      )}
      <Numeral t={t} />
      {chip && (
        <div
          style={{
            position: "absolute",
            top: frameRect.y + frameRect.h + 34,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: tween(sinceCut, 0, 0.2, 0, 1),
          }}
        >
          <div style={{ fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.16em", color: theme.bg, background: theme.fg, padding: "10px 18px", borderRadius: 6 }}>{chip}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
