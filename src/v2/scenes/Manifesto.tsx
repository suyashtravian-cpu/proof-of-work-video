import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LINES2 } from "../script";
import { theme2 } from "../theme";
import { SCENES2 } from "../timeline";
import {
  Bokeh,
  Dust,
  LightSweep,
  RecView,
  SkyPlate,
  type View,
  clamp01,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  iri,
  lerp,
  mixView,
  prog,
  sp,
  Letters,
} from "./manifesto-work/kit";

// MANIFESTO (9.2 to 12.9): "Human curiosity. Machine possibility. Real-world proof."
// Three kinetic beats stack into depth while the site's own headline lights up line by
// line in a floating window below (footage time-remapped so each line fills on its beat).
// The last beat ends in a push through the "o" of "proof." that whites out into the drop.

const SCENE = SCENES2.find((s) => s.name === "Manifesto")!;
export const MANIFESTO_LEN = SCENE.to - SCENE.from;
const LEN = MANIFESTO_LEN;
const LINE = LINES2.find((l) => l.text.startsWith("Human curiosity"))!;

/** Word start times, scene-relative (real VO word stamps when present, else an even read). */
const W: number[] = (() => {
  const n = 6;
  const raw =
    LINE.words && LINE.words.length === n
      ? LINE.words.map((w) => w.s)
      : Array.from({ length: n }, (_, i) => LINE.t + ((LINE.end - LINE.t) * i) / n);
  return raw.map((x) => x - SCENE.from);
})();

type BeatDef = { first: string; second: string; size: number; color: (i: number, n: number, t: number) => string };
const BEATS: BeatDef[] = [
  { first: "Human", second: "curiosity.", size: 226, color: () => theme2.paper },
  { first: "Machine", second: "possibility.", size: 196, color: () => theme2.lilac },
  { first: "Real-world", second: "proof.", size: 300, color: (i, n, t) => iri(i / (n + 2) + t * 0.22) },
];

// Layout of the active beat (px). The "o" of "proof." is centred on x = 540 by layout.
const BLOCK_TOP = 470;
const FIRST_SIZE = 84;
const PROOF_TOP = BLOCK_TOP + FIRST_SIZE - 4;
/** Urbanist: ascent .95em, descent .25em, x-height .5em → o centre sits .6em below a line-height:1 box top. */
const O_Y = PROOF_TOP + 0.6 * 300;
const O_X = 540;

// End push through the "o".
const ZA = LEN - 0.44;
const ZB = LEN;

// Footage: the site's headline section. Each line fills on its beat (source seconds).
const SRC_KEYS: [number, number][] = (() => {
  const k: [number, number][] = [
    [0, 17.75], // marquee band, headline still dim
    [W[0] + 0.25, 19.12], // line 1 begins to fill
    [W[1] + 0.3, 19.43], // HUMAN CURIOSITY. lit
    [W[2], 19.47],
    [W[3] + 0.25, 19.7], // MACHINE POSSIBILITY. lit
    [W[4], 19.71],
    [W[4] + 0.35, 19.76], // REAL-WORL…
    [W[5] - 0.02, 20.37], // (skip the site's pause)
    [W[5] + 0.3, 20.47], // …D PROOF. lit
    [LEN, 20.55],
  ];
  for (let i = 1; i < k.length; i++) k[i][0] = Math.max(k[i][0], k[i - 1][0] + 0.02);
  return k;
})();
const srcAt = (t: number) =>
  interpolate(
    t,
    SRC_KEYS.map((k) => k[0]),
    SRC_KEYS.map((k) => k[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

/** Top of headline line 1 in the recording at source time s (the page scrolls up as it fills). */
const lineTop = (s: number) =>
  interpolate(s, [17.7, 18.95, 19.0, 19.2, 19.35, 19.4, 19.45, 19.55, 19.6, 19.65, 20.6], [660, 660, 610, 541, 520, 466, 420, 411, 392, 358, 358], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const LINE_RIGHT = [1080, 1282, 1088];

const WIN_W = 1000;
const WIN_H = 560;
const WIN_Y = 960;
const VIEW_A: View = { cx: 850, cy: 600, w: 1640 };
const VIEW_B: View = { cx: 760, cy: 520, w: 1280 };

/** Lilac corner brackets that track whichever headline line is lighting up. */
const Tracker: React.FC<{ t: number; src: number }> = ({ t, src }) => {
  // Which line is active, as a continuous value so the bracket springs between lines.
  const k = sp(t - W[2] + 0.05, 13, 0.7) + sp(t - W[4] + 0.05, 13, 0.7);
  const top = lineTop(src) + 113.5 * k - 14;
  const right = interpolate(k, [0, 1, 2], LINE_RIGHT) + 16;
  const left = 96;
  const h = 100;
  const appear = easeOutCubic(prog(t, W[0] + 0.05, W[0] + 0.35));
  const fade = 1 - prog(t, ZA, ZA + 0.15);
  const c = 26;
  const sw = 4;
  const corner = (x: number, y: number, dx: number, dy: number) => `M ${x + dx * c} ${y} L ${x} ${y} L ${x} ${y + dy * c}`;
  const pulse = 0.55 + 0.45 * Math.sin(t * 9);
  return (
    <svg
      width={1708}
      height={1080}
      style={{ position: "absolute", left: 0, top: 0, opacity: appear * fade, overflow: "visible" }}
    >
      <rect x={left} y={top} width={right - left} height={h} rx={14} fill="rgba(188,165,238,0.10)" />
      <path
        d={[corner(left, top, 1, 1), corner(right, top, -1, 1), corner(left, top + h, 1, -1), corner(right, top + h, -1, -1)].join(" ")}
        stroke={theme2.lilac}
        strokeWidth={sw}
        fill="none"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 10px rgba(188,165,238,.9))" }}
      />
      <circle cx={right + 26} cy={top + h / 2} r={7} fill={theme2.lilac} opacity={pulse} />
    </svg>
  );
};

const BeatBlock: React.FC<{ i: number; t: number }> = ({ i, t }) => {
  const b = BEATS[i];
  const a = W[i * 2];
  const a2 = W[i * 2 + 1];
  if (t < a - 0.05) return null;
  // Age rises as later beats arrive: the block recedes up and back.
  let age = 0;
  for (let j = i + 1; j < BEATS.length; j++) age += sp(t - W[j * 2] + 0.02, 11, 0.78);
  const y = interpolate(age, [0, 1, 2], [0, -252, -384]);
  const s = interpolate(age, [0, 1, 2], [1, 0.44, 0.3]);
  const o = interpolate(age, [0, 1, 2], [1, 0.62, 0.36]);
  const float = Math.sin(t * 1.4 + i * 2) * 6 * (1 - prog(t, ZA - 0.2, ZA));
  const isProof = i === 2;
  const chars = [...b.second];
  const second = (
    <Letters
      text={b.second}
      at={a2 - 0.06}
      stagger={0.032}
      w={17}
      z={0.5}
      colorAt={(ci, n) => b.color(ci, n, t)}
    />
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: BLOCK_TOP,
        width: 1080,
        transformOrigin: "50% 0%",
        transform: `translateY(${y + float}px) scale(${s})`,
        opacity: o,
        filter: age > 0.15 ? `blur(${Math.min(2.5, age * 1.4)}px)` : undefined,
        textAlign: "center",
        perspective: 900,
      }}
    >
      <div
        style={{
          fontFamily: theme2.display,
          fontWeight: 700,
          fontSize: FIRST_SIZE,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: theme2.lilacSoft,
          height: FIRST_SIZE - 4,
        }}
      >
        <Letters text={b.first} at={a - 0.05} stagger={0.028} w={18} z={0.55} rise={0.7} />
      </div>
      <div
        style={{
          fontFamily: theme2.display,
          fontWeight: 800,
          fontSize: b.size,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          textShadow: "0 10px 60px rgba(9,13,37,.55)",
        }}
      >
        {isProof ? (
          // Three cells so the first "o" lands exactly on x = 540 (the portal).
          <div style={{ display: "flex", width: 1080 }}>
            <div style={{ flex: "1 1 0", textAlign: "right" }}>
              <Letters text="pr" at={a2 - 0.06} stagger={0.032} colorAt={(ci) => b.color(ci, chars.length, t)} />
            </div>
            <div style={{ letterSpacing: 0 }}>
              <Letters text="o" at={a2 - 0.06 + 0.064} colorAt={() => b.color(2, chars.length, t)} />
            </div>
            <div style={{ flex: "1 1 0", textAlign: "left" }}>
              <Letters text="of." at={a2 - 0.06 + 0.096} stagger={0.032} colorAt={(ci) => b.color(ci + 3, chars.length, t)} />
            </div>
          </div>
        ) : (
          second
        )}
      </div>
    </div>
  );
};

export const Manifesto: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const src = srcAt(t);
  const zk = prog(t, ZA, ZB);
  const zoom = 46 ** (zk ** 1.9);
  const zoomPull = easeInOutCubic(zk);
  const worldPush = 1 + 0.025 * t + 0.32 * easeInCubic(zk);

  // Floating window: rises in, orbits slowly, leans back.
  const enter = sp(t, 7.5, 0.8);
  const rx = lerp(34, 15, enter) - 3 * (t / LEN);
  const ry = lerp(-13, 7, t / LEN);
  const rz = lerp(-3, -1, t / LEN);
  const wy = lerp(220, 0, enter) + Math.sin(t * 1.3) * 8;
  const view = mixView(VIEW_A, VIEW_B, easeInOutCubic(prog(t, 0.2, LEN - 0.3)));

  // Light gathers in the portal, then the frame whites out into the drop.
  const portal = easeInCubic(prog(t, ZA + 0.1, ZB));
  const glowPulse = W.reduce((acc, w) => acc + Math.exp(-Math.max(0, t - w) * 5) * (t >= w ? 1 : 0), 0);

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${worldPush}) rotate(${Math.sin(t * 0.5) * 0.6}deg)` }}>
        <SkyPlate opacity={0.34 + 0.2 * zk} blur={5} scale={1.14 + 0.02 * t} x={Math.sin(t * 0.3) * 30 - t * 10} y={-30 + t * 6} brightness={1 + zk} />
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(9,13,37,.82) 0%, rgba(9,13,37,.35) 32%, rgba(9,13,37,.45) 60%, rgba(9,13,37,.9) 100%)",
          }}
        />
        <Bokeh count={10} seed="mf" opacity={0.9} pulse={Math.min(1, glowPulse)} />
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 60% 26% at 50% 37%, rgba(188,165,238,${0.16 + 0.1 * Math.min(1, glowPulse)}) 0%, rgba(188,165,238,0) 100%)`,
          }}
        />
        <Dust count={60} seed="mfd" opacity={0.55} speed={0.8} />

        {/* The site, floating */}
        <div
          style={{
            position: "absolute",
            left: (1080 - WIN_W) / 2,
            top: WIN_Y,
            width: WIN_W,
            height: WIN_H,
            transform: `translateY(${wy}px) perspective(2200px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
            transformOrigin: "50% 40%",
            opacity: 0.35 + 0.65 * clamp01(enter * 1.6),
            filter: zk > 0 ? `blur(${zk * 6}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 26,
              overflow: "hidden",
              background: theme2.bg,
              border: "1.5px solid rgba(228,220,255,.32)",
              boxShadow: "0 60px 140px rgba(3,4,18,.8), 0 0 90px rgba(188,165,238,.32)",
              WebkitBoxReflect: "below 14px linear-gradient(transparent 62%, rgba(255,255,255,.16))",
            } as React.CSSProperties}
          >
            <RecView width={WIN_W} height={WIN_H} src={src} view={view}>
              <Tracker t={t} src={src} />
            </RecView>
            {/* glass sheen */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(${115 + t * 6}deg, rgba(255,255,255,0) 30%, rgba(255,255,255,.07) 45%, rgba(255,255,255,0) 60%)`,
              }}
            />
          </div>
          {/* URL tag */}
          <div
            style={{
              position: "absolute",
              left: 26,
              top: -46,
              fontFamily: theme2.mono,
              fontSize: 22,
              letterSpacing: "0.08em",
              color: theme2.lilacSoft,
              opacity: 0.8 * clamp01(enter * 1.4),
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 5, background: theme2.lilac, boxShadow: `0 0 12px ${theme2.lilac}` }} />
            pilotaccess.com/suyashpow
          </div>
        </div>
      </AbsoluteFill>

      {/* Light that the portal opens onto (behind the type) */}
      <AbsoluteFill
        style={{
          opacity: portal,
          background: `radial-gradient(circle at 50% 50%, #ffffff 0%, ${theme2.lilacSoft} 38%, rgba(188,165,238,.9) 70%, rgba(188,165,238,.75) 100%)`,
        }}
      />

      {/* Kinetic manifesto */}
      <AbsoluteFill
        style={{
          transformOrigin: `${O_X}px ${O_Y}px`,
          transform: `translateY(${(960 - O_Y) * zoomPull}px) scale(${zoom})`,
        }}
      >
        {BEATS.map((_, i) => (
          <BeatBlock key={i} i={i} t={t} />
        ))}
      </AbsoluteFill>

      <LightSweep at={W[0] - 0.1} dur={0.9} opacity={0.14} />
      <LightSweep at={W[2] - 0.1} dur={0.9} angle={-16} opacity={0.14} />
      <LightSweep at={W[4] - 0.1} dur={0.9} opacity={0.18} />

      {/* Final white-out, handed to Work's flash at the drop */}
      <AbsoluteFill style={{ background: "#fbf9ff", opacity: easeInCubic(prog(t, ZB - 0.16, ZB - 0.03)) * 0.95 }} />
    </AbsoluteFill>
  );
};
