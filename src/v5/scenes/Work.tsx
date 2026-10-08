import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Scramble } from "../../fx/Scramble";
import { shakeAt } from "../../fx/shake";
import { theme2 } from "../../v2/theme";
import { DrawBox } from "../../v2/scenes/manifesto-work/callouts";
import { DropBurst } from "../../v2/scenes/manifesto-work/DropBurst";
import {
  BEAT,
  Bokeh,
  Dust,
  Letters,
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
} from "../../v2/scenes/manifesto-work/kit";
import { RecView } from "../components/rec";
import { L, S, at } from "../timing";

// ONE (4.8 to 9.75): video 2's Work, re-timed to "One. I build products. From idea to live in
// days, not months." The drop lands on frame 0: flash, rays, shock rings, the Biltib card slams in.
// Three live builds, one shot each, joined by whips that ride the site's own carousel slide. Each
// card is a freeze of the real recording with a camera that punches in, and lilac callouts locked
// to the UI: Moolank 365's own "From an idea." boxes on "From idea", iCreateEpic's "Open live
// project" button on "live".

const LEN = S.one[1] - S.one[0];
const B = BEAT;
const WHIP = [1.62, 2.85]; // after "products." / after "to", the site's carousel slide
const EXIT = LEN - 0.42;
const T_BUILD = at("one", L.products, "build");
const T_FROM = at("one", L.days, "from");
const T_LIVE = at("one", L.days, "live");

// Viewport (the floating card) on screen: inside Meta's safe zone, above the captions (y 1270).
const VW = 960;
const VH = 506;
const VX = 60;
const VY = 740;
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
const PUNCH_M1: View = { cx: 1150, cy: 590, w: 600 };
const PUNCH_E: View = { cx: 1010, cy: 690, w: 980 };
const drift = (v: View, k = 0.93, dx = 12, dy = 4): View => ({ cx: v.cx + dx, cy: v.cy + dy, w: v.w * k });
const shrink = (v: View, k = 0.965): View => ({ ...v, w: v.w * k });

type Key = { t: number; v: View; ease?: (k: number) => number };
const VIEW_KEYS: Key[] = [
  { t: 0, v: HOME_B },
  { t: 0.34, v: shrink(HOME_B) },
  { t: 0.84, v: PUNCH_B, ease: easeOutCubic },
  { t: WHIP[0] - 0.32, v: drift(PUNCH_B) },
  { t: WHIP[0] - 0.16, v: HOME_B, ease: easeInOutCubic },
  { t: WHIP[0] + 0.24, v: HOME_M },
  { t: WHIP[0] + 0.66, v: PUNCH_M1, ease: easeOutCubic },
  { t: WHIP[1] - 0.32, v: drift(PUNCH_M1, 0.95) },
  { t: WHIP[1] - 0.16, v: HOME_M, ease: easeInOutCubic },
  { t: WHIP[1] + 0.24, v: HOME_E },
  { t: T_LIVE + 0.45, v: shrink(HOME_E, 0.97) },
  { t: T_LIVE + 1.2, v: PUNCH_E, ease: easeInOutCubic },
  { t: EXIT, v: drift(PUNCH_E, 0.95, 10, 4) },
  { t: LEN, v: drift(PUNCH_E, 0.9, 14, 8), ease: easeInCubic },
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
    [24.33, SRC_MOOLANK, SRC_MOOLANK, SRC_EPIC, SRC_EPIC, 27.1],
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
      { text: "Built & published", at: T_BUILD },
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
    chips: [{ text: "Built & marketed", at: WHIP[0] + 0.3 }],
    ry: [13, 3],
    rx: [7, 3],
  },
  {
    name: "iCreateEpic",
    size: 180,
    num: "03",
    start: WHIP[1],
    end: LEN + 1,
    chips: [{ text: "Creator platform", at: WHIP[1] + 0.3 }],
    ry: [-11, 1],
    rx: [10, 4],
  },
];

const NAME_BASE = 640; // baseline of every product name (the chapter label sits above, at y 290)

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
          left: 352,
          top: 306, // on the chapter label's row (the "1/4" pill sits at x 60 to ~330)
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
      <div style={{ position: "absolute", left: 60, top: NAME_BASE + 26, display: "flex", gap: 14 }}>
        {shot.chips.map((c) => (
          <Chip key={c.text} text={c.text} at={c.at} t={t} />
        ))}
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
            top: 800 - exitK * 900,
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
              {/* Biltib: the site's own line for it */}
              <DrawBox t={t} at={0.78} until={WHIP[0] - 0.3} x={912} y={507} w={346} h={104} s={s} />
              {/* Moolank 365: its headline "From an idea." on "From idea" */}
              <DrawBox t={t} at={T_FROM} until={WHIP[1] - 0.22} x={995} y={500} w={252} h={60} s={s} />
              {/* iCreateEpic: the "Open live project" button on "live" */}
              <DrawBox t={t} at={Math.max(T_LIVE, WHIP[1] + 0.22)} x={960} y={812} w={146} h={47} s={s} label="LIVE" labelSide="bottom" />
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

      <DropBurst t={t} cx={VCX} cy={VCY} />
    </AbsoluteFill>
  );
};
