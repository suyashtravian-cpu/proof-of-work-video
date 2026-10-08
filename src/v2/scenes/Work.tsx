import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Scramble } from "../../fx/Scramble";
import { shakeAt } from "../../fx/shake";
import { LINES2 } from "../script";
import { theme2 } from "../theme";
import { SCENES2 } from "../timeline";
import { DrawBox, Marker } from "./manifesto-work/callouts";
import { DropBurst } from "./manifesto-work/DropBurst";
import {
  BEAT,
  Bokeh,
  Dust,
  IriRing,
  Letters,
  RecView,
  SkyPlate,
  type View,
  clamp01,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  mixView,
  prog,
  sp,
} from "./manifesto-work/kit";

// WORK (12.9 to 24.3). The music drops on frame 0: flash, rays, shock rings, the first
// card slams in. Three live builds, one shot each, timed to their captioned lines, joined
// by whips on the beat grid that ride the site's own carousel slide. Each card is a freeze
// of the real recording with a camera that punches in to the line being spoken, and lilac
// callouts locked to the UI.

const SCENE = SCENES2.find((s) => s.name === "Work")!;
const LEN = SCENE.to - SCENE.from;
const B = BEAT;
const WHIP = [6 * B, 14 * B]; // 3.078, 7.182: on the grid, just before each product's line
const EXIT = LEN - 0.42;

/** Scene-relative start time of the first word in a caption line that starts with `w`. */
const wordTime = (linePrefix: string, w: string) => {
  const l = LINES2.find((x) => x.text.startsWith(linePrefix))!;
  const words = l.text.split(" ");
  const times =
    l.words && l.words.length === words.length ? l.words.map((x) => x.s) : words.map((_, i) => l.t + ((l.end - l.t) * i) / words.length);
  const i = Math.max(0, words.findIndex((x) => x.toLowerCase().startsWith(w.toLowerCase())));
  return times[i] - SCENE.from;
};
const nearestBeat = (x: number) => Math.round(x / B) * B;
const beatBefore = (x: number) => Math.floor((x + 0.05) / B) * B;

const T_BUILT = nearestBeat(wordTime("Moolank", "built"));
const T_MARKETED = nearestBeat(wordTime("Moolank", "marketed"));
const T_HINDI = nearestBeat(wordTime("Moolank", "English"));
const T_CREATOR = nearestBeat(wordTime("iCreateEpic", "creator"));
const T_SEEDED = nearestBeat(wordTime("iCreateEpic", "seeded"));
const T_TEN = Math.max(T_SEEDED + B, beatBefore(wordTime("iCreateEpic", "ten")));

// Viewport (the floating card) on screen.
const VW = 1000;
const VH = 527;
const VX = 40;
const VY = 600;
const VCX = VX + VW / 2;
const VCY = VY + VH / 2;

// Freeze frames in the recording (seconds) and their card framings (recording px).
// Measured from public/v2/rec.mp4: cards are 1494 x 788 at y 211.
const SRC_BILTIB = 24.2; // card x -23..1471, at rest
const SRC_MOOLANK = 25.5; // card x 54..1548
const SRC_EPIC = 26.758; // card x 231..1725 (frame edge 1708), just before the page scrolls
const HOME_B: View = { cx: 735, cy: 605, w: 1471 };
const HOME_M: View = { cx: 801, cy: 605, w: 1494 };
const HOME_E: View = { cx: 969, cy: 605, w: 1477 };
const PUNCH_B: View = { cx: 1088, cy: 576, w: 600 };
const PUNCH_M1: View = { cx: 1166, cy: 598, w: 590 };
const PUNCH_M2: View = { cx: 1112, cy: 650, w: 440 };
const PUNCH_E: View = { cx: 1338, cy: 588, w: 600 };
const drift = (v: View, k = 0.93, dx = 12, dy = 4): View => ({ cx: v.cx + dx, cy: v.cy + dy, w: v.w * k });
const shrink = (v: View, k = 0.965): View => ({ ...v, w: v.w * k });

type Key = { t: number; v: View; ease?: (k: number) => number };
const VIEW_KEYS: Key[] = [
  { t: 0, v: HOME_B },
  { t: 2 * B, v: shrink(HOME_B) },
  { t: 2 * B + 0.5, v: PUNCH_B, ease: easeOutCubic },
  { t: WHIP[0] - 0.5, v: drift(PUNCH_B) },
  { t: WHIP[0] - 0.16, v: HOME_B, ease: easeInOutCubic },
  { t: WHIP[0] + 0.24, v: HOME_M },
  { t: 8 * B, v: shrink(HOME_M) },
  { t: 8 * B + 0.5, v: PUNCH_M1, ease: easeOutCubic },
  { t: T_MARKETED, v: drift(PUNCH_M1, 0.95) },
  { t: T_MARKETED + 0.45, v: PUNCH_M2, ease: easeInOutCubic },
  { t: WHIP[1] - 0.5, v: drift(PUNCH_M2, 0.94, 8, 2) },
  { t: WHIP[1] - 0.16, v: HOME_M, ease: easeInOutCubic },
  { t: WHIP[1] + 0.24, v: HOME_E },
  { t: T_CREATOR, v: shrink(HOME_E) },
  { t: T_CREATOR + 0.5, v: PUNCH_E, ease: easeOutCubic },
  { t: EXIT, v: drift(PUNCH_E, 0.9, 14, 6) },
  { t: LEN, v: drift(PUNCH_E, 0.86, 16, 10), ease: easeInCubic },
];
const viewAt = (t: number): View => {
  if (t <= VIEW_KEYS[0].t) return VIEW_KEYS[0].v;
  for (let i = 1; i < VIEW_KEYS.length; i++) {
    const a = VIEW_KEYS[i - 1];
    const b = VIEW_KEYS[i];
    if (t <= b.t) return mixView(a.v, b.v, (b.ease ?? ((k: number) => k))(prog(t, a.t, b.t)));
  }
  return VIEW_KEYS[VIEW_KEYS.length - 1].v;
};

/** Source time: freezes, joined by the site's real carousel slides, then the scroll-away. */
const srcAt = (t: number) =>
  interpolate(
    t,
    [WHIP[0] - 0.16, WHIP[0] + 0.24, WHIP[1] - 0.16, WHIP[1] + 0.24, EXIT, LEN],
    [24.33, SRC_MOOLANK, SRC_MOOLANK, SRC_EPIC, SRC_EPIC, 27.55],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
const srcFor = (t: number) => (t < WHIP[0] - 0.16 ? SRC_BILTIB : srcAt(t));

type Shot = {
  name: string;
  suffix?: string;
  size: number;
  num: string;
  start: number;
  end: number;
  chips: { text: string; at: number }[];
  ry: [number, number];
  rx: [number, number];
};
const SHOTS: Shot[] = [
  {
    name: "Biltib",
    size: 262,
    num: "01",
    start: 0,
    end: WHIP[0],
    chips: [
      { text: "Discovery platform", at: 0.3 },
      { text: "Built & published", at: B },
    ],
    ry: [-14, -4],
    rx: [9, 4],
  },
  {
    name: "Moolank",
    suffix: " 365",
    size: 163,
    num: "02",
    start: WHIP[0],
    end: WHIP[1],
    chips: [
      { text: "Built & marketed", at: T_MARKETED },
      { text: "English + Hindi", at: T_HINDI },
    ],
    ry: [13, 3],
    rx: [7, 3],
  },
  {
    name: "iCreateEpic",
    size: 180,
    num: "03",
    start: WHIP[1],
    end: LEN + 1,
    chips: [{ text: "Creator platform", at: T_CREATOR }],
    ry: [-11, 1],
    rx: [10, 4],
  },
];

const NAME_BASE = 440; // baseline of every product name

/** Whip offsets around the nearest whip: [x, rotateY, blur, out(0..1), in(0..1)]. */
const whipState = (t: number) => {
  let x = 0;
  let ry = 0;
  let blur = 0;
  for (const w of WHIP) {
    if (t >= w - 0.16 && t < w) {
      const k = easeInCubic(prog(t, w - 0.16, w));
      x += -k * 190;
      ry += k * 24;
      blur += k * 11;
    } else if (t >= w && t < w + 0.6) {
      const k = sp(t - w, 14, 0.72);
      x += (1 - k) * 230;
      ry += -(1 - k) * 24;
      blur += (1 - prog(t, w, w + 0.2)) * 11;
    }
  }
  return { x, ry, blur };
};

const Chip: React.FC<{ text: string; at: number; t: number }> = ({ text, at, t }) => {
  const k = sp(t - at, 15, 0.6);
  if (t < at) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 24px 12px",
        borderRadius: 40,
        border: "1.5px solid rgba(228,220,255,.38)",
        background: "rgba(24,22,64,.62)",
        boxShadow: "0 10px 30px rgba(3,4,18,.35), inset 0 1px 0 rgba(255,255,255,.08)",
        color: theme2.fg,
        fontFamily: theme2.sans,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: "-0.01em",
        transform: `translateY(${(1 - k) * 34}px) scale(${0.6 + 0.4 * k})`,
        transformOrigin: "0% 50%",
        opacity: clamp01(k * 2),
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 5, background: theme2.lilac, boxShadow: `0 0 10px ${theme2.lilac}` }} />
      {text}
    </div>
  );
};

/** Product name, live tag and chips for one shot (top of frame, above the card). */
const TopBlock: React.FC<{ shot: Shot; t: number; exitK: number }> = ({ shot, t, exitK }) => {
  if (t < shot.start - 0.01 || t > shot.end) return null;
  const first = shot.start === 0;
  const out = easeInCubic(prog(t, shot.end - 0.16, shot.end));
  const inK = first ? sp(t, 12, 0.5) : sp(t - shot.start, 13, 0.7);
  const x = first ? 0 : (1 - inK) * 300;
  const s = first ? lerp(1.7, 1, inK) : 1;
  const capTop = NAME_BASE - 0.7 * shot.size;
  const top = NAME_BASE - 0.85 * shot.size;
  const live = 0.55 + 0.45 * Math.sin(t * 7);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${x - out * 560}px, ${-exitK * 1700}px) skewX(${out * -10}deg)`,
        opacity: 1 - out * 0.85,
        filter: out > 0.02 ? `blur(${out * 10}px)` : undefined,
      }}
    >
      {/* live tag */}
      <div
        style={{
          position: "absolute",
          left: 64,
          top: capTop - 92,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: theme2.mono,
          fontSize: 25,
          letterSpacing: "0.16em",
          color: theme2.lilac,
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: theme2.lilac,
            opacity: live,
            boxShadow: `0 0 ${10 + 8 * live}px ${theme2.lilac}`,
          }}
        />
        <Scramble text={`LIVE BUILD ${shot.num} / 03`} at={shot.start + (first ? 0.12 : 0.05)} dur={0.4} seed={`lb${shot.num}`} />
      </div>
      {/* name */}
      <div
        style={{
          position: "absolute",
          left: 56,
          top,
          fontFamily: theme2.display,
          fontWeight: 800,
          fontSize: shot.size,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: theme2.paper,
          whiteSpace: "nowrap",
          transformOrigin: "0% 85%",
          transform: `scale(${s})`,
          textShadow: "0 12px 60px rgba(9,13,37,.6), 0 0 40px rgba(188,165,238,.18)",
          perspective: 900,
        }}
      >
        <Letters text={shot.name} at={shot.start + (first ? 0.0 : 0.02)} stagger={first ? 0.035 : 0.03} w={first ? 15 : 17} z={0.5} />
        {shot.suffix && (
          <Letters
            text={shot.suffix}
            at={shot.start + 0.02 + shot.name.length * 0.03}
            stagger={0.04}
            colorAt={() => theme2.lilac}
          />
        )}
      </div>
      {/* chips */}
      <div style={{ position: "absolute", left: 60, top: 474, display: "flex", gap: 14 }}>
        {shot.chips.map((c) => (
          <Chip key={c.text} text={c.text} at={c.at} t={t} />
        ))}
      </div>
    </div>
  );
};

const NAV = [
  { n: "01", label: "Biltib", x: 104, w: 236 },
  { n: "02", label: "Moolank 365", x: 356, w: 316 },
  { n: "03", label: "iCreateEpic", x: 688, w: 290 },
];
/** The site's own project tabs, with a lilac indicator that whips with the shots. */
const Nav: React.FC<{ t: number; exitK: number }> = ({ t, exitK }) => {
  const k = sp(t - WHIP[0], 13, 0.68) + sp(t - WHIP[1], 13, 0.68);
  const ix = interpolate(k, [0, 1, 2], NAV.map((n) => n.x));
  const iw = interpolate(k, [0, 1, 2], NAV.map((n) => n.w));
  const active = t < WHIP[0] ? 0 : t < WHIP[1] ? 1 : 2;
  const appear = (i: number) => sp(t - 0.18 - i * 0.06, 14, 0.7);
  const y = 1690 + exitK * 120;
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, height: 70, opacity: 1 - exitK }}>
      <div
        style={{
          position: "absolute",
          left: ix,
          top: 0,
          width: iw,
          height: 66,
          borderRadius: 33,
          background: theme2.lilac,
          boxShadow: "0 0 34px rgba(188,165,238,.55)",
          opacity: appear(0),
        }}
      />
      {NAV.map((n, i) => {
        const a = appear(i);
        return (
          <div
            key={n.n}
            style={{
              position: "absolute",
              left: n.x,
              top: 0,
              width: n.w,
              height: 66,
              borderRadius: 33,
              border: `1.5px solid ${i === active ? "rgba(188,165,238,0)" : "rgba(228,220,255,.22)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              fontFamily: theme2.sans,
              fontWeight: 700,
              fontSize: 27,
              color: i === active ? "#1a1640" : theme2.dim,
              transform: `translateY(${(1 - a) * 40}px)`,
              opacity: clamp01(a * 1.5),
            }}
          >
            <span style={{ fontFamily: theme2.mono, fontSize: 21, opacity: 0.7 }}>{n.n}</span>
            {n.label}
          </div>
        );
      })}
    </div>
  );
};

/** "10 original builds": an iridescent chrome badge that pops on the card. */
const TenBadge: React.FC<{ t: number; at: number; exitK: number }> = ({ t, at, exitK }) => {
  if (t < at) return null;
  const k = sp(t - at, 12, 0.5);
  const n = Math.min(10, Math.max(1, Math.round(1 + 9 * easeOutCubic(prog(t, at, at + 0.5)))));
  const size = 236;
  return (
    <div
      style={{
        position: "absolute",
        left: 846 - size / 2,
        top: 1142 - size / 2 - exitK * 1500,
        width: size,
        height: size,
        transform: `scale(${k}) rotate(${(1 - k) * -40 + Math.sin(t * 2) * 3}deg)`,
        filter: exitK > 0 ? `blur(${exitK * 10}px)` : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, rgba(60,50,130,.96), rgba(14,16,46,.97) 70%)",
          boxShadow: "0 30px 70px rgba(3,4,18,.7), 0 0 60px rgba(188,165,238,.45)",
        }}
      />
      <IriRing size={size} thickness={14} rotate={t * 140} style={{ left: 0, top: 0 }} />
      <IriRing size={size - 40} thickness={2} rotate={-t * 90} opacity={0.6} style={{ left: 20, top: 20 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: theme2.paper,
        }}
      >
        <div style={{ fontFamily: theme2.display, fontWeight: 800, fontSize: 116, lineHeight: 0.9, letterSpacing: "-0.04em" }}>{n}</div>
        <div
          style={{
            marginTop: 8,
            fontFamily: theme2.sans,
            fontWeight: 700,
            fontSize: 21,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme2.lilacSoft,
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          original
          <br />
          builds
        </div>
      </div>
    </div>
  );
};

export const Work: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const shotI = t < WHIP[0] ? 0 : t < WHIP[1] ? 1 : 2;
  const shot = SHOTS[shotI];
  const view = viewAt(t);
  const src = srcFor(t);
  const s = VW / view.w;
  const exitK = easeInCubic(prog(t, EXIT, LEN));

  // Beat breathing after the drop.
  const lastBeat = Math.floor(t / B) * B;
  const bump = Math.exp(-(t - lastBeat) * 9);
  const [shx, shy, shr] = shakeAt(t, [0], 22, 0.45);
  const [wx, wy, wr] = shakeAt(t, WHIP, 7, 0.25);

  // Card: slam on the drop, orbit through each shot, whip between them.
  const slam = sp(t, 12, 0.52);
  const local = prog(t, shot.start, Math.min(shot.end, LEN));
  const ry0 = lerp(shot.ry[0], shot.ry[1], easeInOutCubic(local));
  const rx0 = lerp(shot.rx[0], shot.rx[1], easeInOutCubic(local));
  const wh = whipState(t);
  const slamScale = lerp(1.85, 1, slam);
  const slamRx = (1 - slam) * 32;
  const slamBlur = (1 - clamp01(slam)) * 16;
  const float = Math.sin(t * 1.6) * 7;
  const cardBlur = Math.max(slamBlur, wh.blur) + exitK * 12;

  // Background parallax shifts on every whip.
  const skyShift = (sp(t - WHIP[0], 6, 0.9) + sp(t - WHIP[1], 6, 0.9)) * -70;
  const flash = 1 - easeOutCubic(prog(t, 0, 0.5));

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${shx + wx}px, ${shy + wy}px) rotate(${shr + wr + Math.sin(t * 0.45) * 0.5}deg) scale(${1.02 + 0.007 * bump * (t > 0.4 ? 1 : 0)})`,
        }}
      >
        <SkyPlate
          opacity={0.3 + 0.25 * flash}
          blur={4}
          scale={1.2 - 0.06 * slam + 0.004 * t}
          x={skyShift + Math.sin(t * 0.25) * 20}
          y={-exitK * 300}
          brightness={1 + 0.8 * flash}
        />
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(9,13,37,.88) 0%, rgba(9,13,37,.5) 30%, rgba(9,13,37,.42) 55%, rgba(9,13,37,.92) 100%)",
          }}
        />
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 62% 24% at 50% ${(VCY / 1920) * 100}%, rgba(188,165,238,${0.2 + 0.12 * bump}) 0%, rgba(188,165,238,0) 100%)`,
          }}
        />
        <Bokeh count={10} seed="wk" pulse={bump * 0.6} />
        <Dust count={70} seed="wkd" opacity={0.6} speed={1.4} />

        {/* ghost numeral, the site's oversized card index */}
        <div
          style={{
            position: "absolute",
            left: 520 + wh.x * 0.45 + Math.sin(t * 0.6) * 10,
            top: 980 - exitK * 900,
            fontFamily: theme2.display,
            fontWeight: 800,
            fontSize: 520,
            lineHeight: 1,
            letterSpacing: "-0.06em",
            color: "transparent",
            WebkitTextStroke: "2.5px rgba(188,165,238,.22)",
            opacity: clamp01(slam),
          }}
        >
          {shot.num}
        </div>

        {/* the card */}
        <div
          style={{
            position: "absolute",
            left: VX,
            top: VY,
            width: VW,
            height: VH,
            transform: `translate(${wh.x}px, ${float - exitK * 1500}px) perspective(2300px) rotateX(${rx0 + slamRx}deg) rotateY(${ry0 + wh.ry}deg) rotateZ(${Math.sin(t * 0.7) * 0.8}deg) scale(${slamScale})`,
            filter: cardBlur > 0.3 ? `blur(${cardBlur}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 24,
              overflow: "hidden",
              background: theme2.bg,
              border: "1.5px solid rgba(228,220,255,.4)",
              boxShadow: `0 60px 140px rgba(3,4,18,.82), 0 0 ${80 + 40 * bump}px rgba(188,165,238,${0.34 + 0.12 * bump})`,
              WebkitBoxReflect: "below 16px linear-gradient(transparent 70%, rgba(255,255,255,.14))",
            } as React.CSSProperties}
          >
            <RecView width={VW} height={VH} src={src} view={view}>
              {/* Biltib: the line being spoken */}
              <DrawBox t={t} at={3 * B} until={WHIP[0] - 0.42} x={912} y={507} w={346} h={104} s={s} />
              {/* Moolank 365: built + marketed, then English + Hindi */}
              <Marker
                t={t}
                at={T_BUILT}
                dur={0.7}
                until={WHIP[1] - 0.42}
                runs={[
                  { x: 1156, y: 625, w: 174, h: 19 },
                  { x: 1002, y: 644, w: 106, h: 19 },
                ]}
              />
              <DrawBox t={t} at={T_HINDI} until={WHIP[1] - 0.42} x={1027} y={674} w={56} h={20} s={s} label="ENGLISH + HINDI" labelSide="bottom" />
              {/* iCreateEpic: ten original builds seeded */}
              <Marker
                t={t}
                at={T_SEEDED}
                dur={0.6}
                runs={[
                  { x: 1292, y: 615, w: 215, h: 19 },
                  { x: 1179, y: 634, w: 46, h: 19 },
                ]}
              />
            </RecView>
            {/* glass sheen */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(${110 + t * 5}deg, rgba(255,255,255,0) ${20 + ((t * 18) % 60)}%, rgba(255,255,255,.1) ${28 + ((t * 18) % 60)}%, rgba(255,255,255,0) ${36 + ((t * 18) % 60)}%)`,
              }}
            />
          </div>
        </div>

        <TenBadge t={t} at={T_TEN} exitK={exitK} />

        {SHOTS.map((sh) => (
          <TopBlock key={sh.num} shot={sh} t={t} exitK={exitK} />
        ))}

        {/* whip streaks */}
        {WHIP.map((w) => {
          const k = prog(t, w - 0.14, w + 0.2);
          if (k <= 0 || k >= 1) return null;
          return (
            <div
              key={w}
              style={{
                position: "absolute",
                left: lerp(1400, -1600, easeInOutCubic(k)),
                top: VCY - 160,
                width: 1500,
                height: 320,
                background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(228,220,255,.5), rgba(188,165,238,0) 70%)",
                mixBlendMode: "screen",
              }}
            />
          );
        })}
      </AbsoluteFill>

      <Nav t={t} exitK={exitK} />
      <DropBurst t={t} cx={VCX} cy={VCY} />
    </AbsoluteFill>
  );
};
