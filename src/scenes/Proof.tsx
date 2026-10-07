import { AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, tween } from "../components/anim";
import { BrowserFrame } from "../components/BrowserFrame";
import { Paper, PAPER_H, PAPER_W } from "../components/Paper";
import { Shatter } from "../components/Shatter";
import { FloatingCode } from "../fx/FloatingCode";
import { GridBg } from "../fx/GridBg";
import { Particles } from "../fx/Particles";
import { Scramble } from "../fx/Scramble";
import { shakeAt } from "../fx/shake";
import { clip } from "../footage";
import { sec } from "../timing";
import { theme } from "../theme";
import { Carousel, focusAt, ringSpeed, TRI_IN, TRI_OUT } from "./proof/Carousel";
import { CodePanel } from "./proof/CodePanel";
import { Impact, Slices, Streaks } from "./proof/Fx";
import { CYAN, easeIn3, FCY, footRect, frameRect, FW, View, whip } from "./proof/geom";
import { Num, NUM_TOP, Numeral } from "./proof/Numeral";
import { Track } from "./proof/Track";
import { Rulers, Warp } from "./proof/Warp";

// Times are relative to this scene (global 16.2–29.3).
export const REVEAL = 0.95;
const lin = (k: number) => k;
const punch = (t: number, at: number, amt: number, dur = 0.35) => (t >= at ? amt * Math.max(0, 1 - (t - at) / dur) ** 2 : 0);

type Seg = { a: number; b: number; clip: string; from: number; rate: number; chip: string; zoom: (t: number) => number; ox: number; oy: number };

// Main-window shots. Footage counters: Moolank 112 lands at clip 2.4 (scene 9.15), Reddit 1,999 at clip 7.8 (scene 11.15).
const SEGS: Seg[] = [
  { a: REVEAL, b: TRI_IN, clip: "hero", from: 0, rate: 1, chip: "PROOF OF WORK · LIVE", zoom: (t) => 1 + 0.06 * tween(t, REVEAL, TRI_IN, 0, 1, lin), ox: 500, oy: 312 },
  { a: TRI_OUT, b: 5.15, clip: "lab-archive", from: 1.3, rate: 1.7, chip: "03 / THE CONVERSION LAB", zoom: (t) => 1.02 + 0.05 * tween(t, TRI_OUT, 5.15, 0, 1, lin), ox: 500, oy: 300 },
  { a: 5.15, b: 7.15, clip: "lab-archive", from: 11.5, rate: 1.5, chip: "07 / THE EXPERIMENT ARCHIVE", zoom: (t) => 1.02 + 0.08 * tween(t, 5.15, 7.15, 0, 1, lin), ox: 500, oy: 440 },
  {
    a: 7.15,
    b: 9.75,
    clip: "signals",
    from: 0.4,
    rate: 1,
    chip: "04 / CAMPAIGNS · META ADS",
    zoom: (t) => 1 + 0.3 * tween(t, 8.2, 9.05, 0, 1, easeInOut) + 0.03 * tween(t, 9.1, 9.75, 0, 1, lin) + punch(t, 9.1, 0.05),
    ox: 632,
    oy: 450,
  },
  {
    a: 9.75,
    b: 13.1,
    clip: "signals",
    from: 6.4,
    rate: 1,
    chip: "04 / CAMPAIGNS · REDDIT ADS",
    zoom: (t) => 1 + 0.3 * tween(t, 10.25, 11.05, 0, 1, easeInOut) + punch(t, 11.1, 0.12, 0.45) + 0.05 * tween(t, 11.1, 13.1, 0, 1, lin),
    ox: 680,
    oy: 450,
  },
];

// [cut, distance, direction, axis]
const WHIPS: [number, number, number, "x" | "y"][] = [
  [5.15, 1300, 1, "x"],
  [7.15, 1900, 1, "y"],
  [9.75, 1300, -1, "x"],
  [13.1, 1900, 1, "y"],
];
const CUTS = [TRI_OUT, 5.15, 7.15, 9.75];

// Tracking boxes on the footage, in 1440×900 capture pixels.
type Tag = { at: number; until: number; r: [number, number, number, number]; label: string; color?: string; ink?: string; pos?: "top" | "bottom" };
const RED = theme.red;
const TAGS: Tag[] = [
  { at: 1.18, until: 1.58, r: [600, 150, 1320, 750], label: "3 LIVE BUILDS", color: CYAN },
  { at: 3.38, until: 3.8, r: [72, 452, 1368, 672], label: "CONCEPT 01 · THE WHOLE TRUTH" },
  { at: 4.46, until: 5.03, r: [156, 196, 396, 356], label: "02 · FIX MY CURLS" },
  { at: 4.56, until: 5.03, r: [156, 420, 396, 580], label: "03 · THE PANT PROJECT" },
  { at: 4.66, until: 5.03, r: [156, 644, 396, 800], label: "04 · DRINKPRIME" },
  { at: 5.36, until: 5.74, r: [72, 536, 1368, 850], label: "EXPERIMENT ARCHIVE · 10 ORIGINAL BUILDS", color: CYAN },
  { at: 5.74, until: 7.02, r: [72, 536, 486, 850], label: "ATLAS AI" },
  { at: 5.86, until: 7.02, r: [512, 536, 926, 850], label: "LEXIS" },
  { at: 5.98, until: 7.02, r: [952, 536, 1368, 850], label: "OPEN INTEREST" },
  { at: 7.45, until: 8.25, r: [72, 426, 288, 476], label: "CAMPAIGN · MOOLANK 365", color: RED, ink: "#fff" },
  { at: 8.35, until: 9.6, r: [752, 532, 1075, 725], label: "READING-REVEAL EVENTS", color: RED, ink: "#fff" },
  { at: 9.12, until: 9.6, r: [750, 776, 866, 836], label: "TOTAL SPEND", color: RED, ink: "#fff", pos: "bottom" },
  { at: 9.98, until: 10.42, r: [504, 426, 720, 476], label: "→ 03 / REDDIT", color: RED, ink: "#fff" },
  { at: 10.35, until: 12.95, r: [752, 532, 1215, 725], label: "CLICKS TO ICREATEEPIC", color: RED, ink: "#fff" },
  { at: 11.22, until: 12.95, r: [750, 776, 846, 836], label: "TOTAL SPEND", color: RED, ink: "#fff", pos: "bottom" },
  { at: 11.5, until: 12.95, r: [958, 776, 1050, 836], label: "AVG CPC", color: RED, ink: "#fff", pos: "bottom" },
];

const NUMS: Num[] = [
  { from: 1.72, to: 3.12, value: 3, label: "LIVE PRODUCTS", names: ["BILTIB", "ICREATEEPIC", "MOOLANK 365"] },
  { from: 3.2, to: 5.12, value: 4, label: "INTERACTIVE BRAND CONCEPTS", sub: "SELF-INITIATED · NOT CLIENT WORK" },
  { from: 5.28, to: 7.12, value: 10, label: "ORIGINAL EXPERIMENTS", sub: "07 / THE EXPERIMENT ARCHIVE" },
  { from: 7.2, to: 9.72, value: 112, countFrom: 8.35, countTo: 9.1, label: "READING-REVEAL EVENTS", sub: "FROM ₹440.12 OF META ADS · 1–4 OCT 2026" },
  { from: 9.8, to: 12.97, value: 1999, countFrom: 10.35, countTo: 11.1, label: "REDDIT CLICKS · ICREATEEPIC", big: ["FROM $59.17", "$59.17", 11.22] },
];

const paperScale = 0.9;
const paperRect = { x: 540 - (PAPER_W * paperScale) / 2, y: 960 - (PAPER_H * paperScale) / 2, w: PAPER_W * paperScale, h: PAPER_H * paperScale };

/** Main window pose: reveal settle, fly-through from depth, whip pans at every cut. */
const mainPose = (t: number) => {
  let x = 0;
  let y = 0;
  let z = 0;
  let rx = 2 + Math.sin(t * 0.9) * 0.6;
  let ry = Math.sin(t * 0.7) * 1.4;
  let s = 1;
  let op = 1;
  let speed = 0;
  let axis: "x" | "y" = "x";
  let sign = 1;
  if (t < TRI_IN) {
    const settle = tween(t, REVEAL, REVEAL + 1.0, 0, 1, easeExpo);
    rx += (1 - settle) * 16;
    s = 0.96 + 0.04 * settle;
    op = tween(t, REVEAL, REVEAL + 0.2, 0, 1);
    const u = tween(t, 1.56, TRI_IN, 0, 1, easeIn3);
    x = -u * 1300;
    ry -= u * 30;
    speed = u;
  } else {
    const v = tween(t, TRI_OUT, TRI_OUT + 0.42, 0, 1, easeExpo);
    z = -(1 - v) * 2600;
    rx += (1 - v) * 24;
    op = tween(t, TRI_OUT, TRI_OUT + 0.07, 0, 1);
    for (const [c, D, sg, ax] of WHIPS) {
      const w = whip(t, c, D, sg);
      if (!w) continue;
      speed = w.speed;
      axis = ax;
      sign = sg;
      if (ax === "x") {
        x += w.off;
        ry += (w.off / D) * 26;
      } else {
        y += w.off;
        rx -= (w.off / D) * 20;
      }
    }
  }
  return { x, y, z, rx, ry, s, op, speed, axis, sign };
};

const TopStatus: React.FC<{ t: number }> = ({ t }) => {
  if (t > TRI_IN + 0.02) return null;
  const k = tween(t, 0.06, 0.25, 0, 1);
  const out = tween(t, 1.52, 1.68, 0, 1);
  const prog = tween(t, 0.1, 0.92, 0, 1, easeInOut);
  const done = t >= REVEAL;
  return (
    <div style={{ position: "absolute", top: 236, left: 0, right: 0, textAlign: "center", opacity: k * (1 - out), transform: `translateY(${-out * 40}px)` }}>
      <div style={{ fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.2em", color: done ? theme.fg : theme.dim, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
        {done && <span style={{ width: 14, height: 14, borderRadius: 7, background: theme.red }} />}
        <Scramble key={done ? "d" : "b"} text={done ? "DEPLOYED · LIVE ON THE WEB" : "COMPILING  RESUME.PDF → WEBSITE"} at={done ? REVEAL : 0.06} dur={0.35} />
      </div>
      <div style={{ width: 660, height: 6, margin: "18px auto 0", background: "#ffffff1c", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: done ? theme.red : CYAN }} />
      </div>
      <div style={{ fontFamily: theme.mono, fontSize: 18, letterSpacing: "0.14em", color: theme.dim, marginTop: 12 }}>
        {`${String(Math.round(prog * 100)).padStart(3, "0")}% · ${String(Math.round(prog * 3072)).padStart(4, "0")}/3072 FRAGMENTS`}
      </div>
      {done && (
        <div style={{ fontFamily: theme.mono, fontSize: 48, letterSpacing: "-0.01em", color: theme.fg, marginTop: 26 }}>
          <Scramble text="pilotaccess.com/proofofwork" at={REVEAL + 0.05} dur={0.45} />
        </div>
      )}
    </div>
  );
};

const add = (...v: [number, number, number][]) => v.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0] as [number, number, number]);

// "...and built this instead. Three live products. Four interactive brand concepts.
// Ten original experiments. And real campaigns, with real numbers. Almost 2,000 Reddit clicks, from $59."
export const Proof: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const m = mainPose(t);
  const seg = SEGS.find((s) => t >= s.a && t < s.b);
  const zoom = seg ? seg.zoom(t) : 1;
  const showMain = !!seg;
  const view: View = { w: FW, cy: FCY + m.y, x: m.x, s: m.s, zoom, ox: seg?.ox, oy: seg?.oy };

  // camera: drift + section push + shakes on impacts
  const sh = add(shakeAt(t, [REVEAL, TRI_OUT + 0.18], 12), shakeAt(t, [5.15, 7.15, 9.75], 7, 0.2), shakeAt(t, [9.1], 13), shakeAt(t, [11.1], 36, 0.55));
  const starts = [0, REVEAL, TRI_IN, TRI_OUT, 5.15, 7.15, 9.75, 13.1];
  const si = starts.findIndex((s, i) => t >= s && t < starts[i + 1]);
  const secPush = si >= 0 ? 0.03 * ((t - starts[si]) / (starts[si + 1] - starts[si])) : 0;
  const camS = 1 + secPush + punch(t, 11.1, 0.07, 0.5) + punch(t, 9.1, 0.025);
  const camX = Math.sin(t * 0.9) * 8 + sh[0];
  const camY = Math.cos(t * 0.7) * 6 + sh[1];
  const camR = Math.sin(t * 0.5) * 0.35 + sh[2];

  const num = NUMS.find((n) => t >= n.from && t < n.to);
  const active = Math.max(0, Math.min(2, Math.round(focusAt(t))));
  const rs = t >= TRI_IN && t < TRI_OUT ? ringSpeed(t) : 0;
  const cutFlash = Math.max(...CUTS.map((c) => (t >= c && t < c + 0.12 ? 0.25 * (1 - (t - c) / 0.12) : 0)), 0);
  const flash = Math.max(punch(t, 11.1, 0.62, 0.22), punch(t, 9.1, 0.25, 0.15), punch(t, REVEAL, 0.3, 0.2), punch(t, TRI_OUT, 0.22, 0.15));
  const clipT = seg ? seg.from + (t - seg.a) * seg.rate : 0;
  const frameTop = frameRect.y + m.y;

  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      {/* depth layers (parallax: they move less than the camera) */}
      <AbsoluteFill style={{ transform: `translate(${camX * 0.3}px, ${camY * 0.3}px) scale(${1 + secPush * 0.4})` }}>
        <GridBg opacity={0.09} horizon={1360} speed={1.4} />
        <Warp cy={FCY} opacity={t < 0.9 ? 0.45 : 0.9} />
        <FloatingCode count={16} opacity={0.075} seed="proofcode" speed={1.5} />
        <Particles count={34} opacity={0.22} seed="proofdust" />
        <Rulers t={t} />
      </AbsoluteFill>

      {/* camera */}
      <AbsoluteFill style={{ transform: `translate(${camX}px, ${camY}px) rotate(${camR}deg) scale(${camS})` }}>
        {t < 0.06 && (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: `scale(${paperScale})`, filter: "brightness(.3)" }}>
              <Paper />
            </div>
          </AbsoluteFill>
        )}
        <Shatter from={paperRect} to={frameRect} at={0.03} />

        {showMain && seg && (
          <>
            <BrowserFrame width={FW} x={m.x} y={FCY - 960 + m.y} z={m.z} rotateX={m.rx} rotateY={m.ry} scale={m.s} opacity={m.op} live glow={0.4}>
              <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `${seg.ox}px ${seg.oy}px` }}>
                {SEGS.map((sg, i) => (
                  <Sequence key={i} from={sec(sg.a)} durationInFrames={sec(sg.b) - sec(sg.a)} layout="none">
                    <OffthreadVideo src={clip(sg.clip)} trimBefore={sec(sg.from)} playbackRate={sg.rate} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Sequence>
                ))}
              </div>
              <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, #00000014 0px, #00000014 1px, transparent 1px, transparent 4px)" }} />
              <AbsoluteFill style={{ background: "#fff", opacity: cutFlash }} />
            </BrowserFrame>
            {/* frame-attached HUD: section chip + live source readout */}
            <div style={{ position: "absolute", left: frameRect.x + m.x, top: frameTop - 50, opacity: m.op * tween(t, seg.a, seg.a + 0.15, 0, 1) }}>
              <div style={{ fontFamily: theme.mono, fontSize: 21, letterSpacing: "0.14em", color: theme.bg, background: theme.fg, padding: "7px 12px", borderRadius: 4, whiteSpace: "pre" }}>
                <Scramble key={seg.chip} text={seg.chip} at={seg.a} dur={0.35} />
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: frameRect.x + m.x + FW - 420,
                width: 420,
                textAlign: "right",
                top: frameTop - 40,
                fontFamily: theme.mono,
                fontSize: 15,
                letterSpacing: "0.1em",
                color: theme.dim,
                opacity: m.op,
              }}
            >
              {`SRC ${seg.clip.toUpperCase()}.MP4 · ${clipT.toFixed(2).padStart(5, "0")}s · ×${seg.rate.toFixed(2)}`}
            </div>
            <Streaks speed={m.speed} axis={m.axis} sign={m.sign} band={m.axis === "x" ? { x: 0, y: FCY - 430, w: 1080, h: 860 } : { x: 40, y: 0, w: 1000, h: 1920 }} seed="mw" />
            {CUTS.map((c) => (
              <Slices key={c} cut={c} r={frameRect} seed={`sl${c}`} />
            ))}
            {TAGS.filter((g) => t >= g.at && t <= g.until).map((g) => (
              <Track key={g.label + g.at} r={footRect(view, ...g.r)} at={g.at} until={g.until} label={g.label} color={g.color} ink={g.ink} pos={g.pos} />
            ))}
          </>
        )}

        <Carousel t={t} />
        <Streaks speed={rs} axis="x" sign={1} band={{ x: 0, y: 700, w: 1080, h: 620 }} seed="ring" />

        <Numeral n={num} active={active} />
        <Impact at={9.1} cx={540} cy={NUM_TOP + 135} power={0.6} seed="i112" />
        <Impact at={11.1} cx={540} cy={NUM_TOP + 112} power={1.15} seed="i1999" />
        <TopStatus t={t} />
      </AbsoluteFill>

      <CodePanel />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
