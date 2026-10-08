import { AbsoluteFill, random } from "remotion";
import { Particles } from "../../fx/Particles";
import { shakeAt } from "../../fx/shake";
import { Sky } from "../../v2/components/Sky";
import { theme2 } from "../../v2/theme";
import { Bokeh, RecView, Ripple, Sweep, T, Tag, WhipDefs, eIO, eIn, eOut, keys, kick, pulse, rim, tw } from "../../v2/scenes/after-making-playground/kit";
import { L, S, THREE_SPLIT, at } from "../timing";

// THREE, part 2 (17.45 to 19.22): video 2's Playground. The site's playground carousel rushes past
// in the floating window while "people actually" lands; on "stop" the rush freezes dead (the
// creative people actually stop for), "stop for." slams under it, then a zoom-through into Four.

const LEN = S.three[1] - S.three[0] - THREE_SPLIT;
const w = (s: string) => at("three", L.creative, s) - THREE_SPLIT;
export const PG = {
  people: w("people"),
  actually: w("actually"),
  stop: w("stop"),
  for: w("for"),
};
export const PG_EXIT = LEN - 0.27;

// Footage: cards 1 to 5 held while the camera pans, then the carousel rushes, then a freeze on "stop".
const RUSH = 0.3;
const SPANS: [number, number][] = [
  [54.55, 55.25], // cards 1 to 5
  [56.6, 57.8], // cards 6 to 10 rush past
];
const CUTS = [0, RUSH, PG.stop];
const STILL = 57.8;

const WIN = { left: 40, top: 384, w: 1000, h: 770 };
const TEXT_TOP = 1186;

const Sparks: React.FC<{ x: number; y: number; at: number; seed: string; n?: number; spread?: number }> = ({ x, y, at, seed, n = 10, spread = 260 }) => {
  const t = T();
  const d = t - at;
  if (d < 0 || d > 0.5) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = 0.45 + random(`${seed}v${i}`) * 0.55;
        const p = eOut(d / 0.5);
        const r = 8 + random(`${seed}r${i}`) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.cos(a) * spread * v * p - r / 2,
              top: y + Math.sin(a) * spread * v * p - r / 2,
              width: r,
              height: r,
              background: i % 3 ? theme2.lilac : theme2.paper,
              transform: `rotate(45deg) scale(${1 - p * 0.7})`,
              opacity: 1 - d / 0.5,
              boxShadow: `0 0 14px ${theme2.lilac}`,
            }}
          />
        );
      })}
    </>
  );
};

export const Playground: React.FC = () => {
  const t = T();

  // Entry from the right (Making whips left), exit: zoom through the window.
  const enter = tw(t, 0, 0.22, 1, 0, eOut);
  const exit = tw(t, PG_EXIT, LEN, 0, 1, eIn);
  const blurX = enter * 80;
  const stopped = t >= PG.stop;
  const [sx, sy, sr] = shakeAt(t, [PG.stop], 18, 0.32);

  // Camera inside the page: pan across cards 1 to 5, ride the rush, punch in on the freeze.
  const cam = {
    s: keys(t, [[0, 1.5], [RUSH, 1.62], [RUSH + 0.03, 1.42], [PG.stop, 1.36], [PG.stop + 0.22, 1.74], [PG_EXIT, 1.82], [LEN, 2.6]], eIO),
    x: t < RUSH ? keys(t, [[0, 360], [RUSH, 1180]], (x) => x) : keys(t, [[RUSH, 1000], [PG.stop, 1000], [PG.stop + 0.22, 960], [LEN, 975]], eIO),
    y: t < RUSH ? 660 : keys(t, [[RUSH, 690], [PG.stop, 700], [PG.stop + 0.22, 760], [LEN, 765]], eIO),
  };
  const rush = tw(t, RUSH, RUSH + 0.12) * (stopped ? 0 : 1);

  // Window motion.
  const hit = pulse(t, PG.stop, 0.5);
  const rx = 6 + Math.sin(t * 1.2) * 2 - hit * 4;
  const ry = -4 + Math.sin(t * 0.9) * 4 + rush * 7;
  const wsc = 0.97 + hit * 0.04;

  // Kinetic type: "people actually / stop for."
  const peopleIn = kick(t, PG.people - 0.03, 16, 7);
  const actuallyIn = kick(t, PG.actually - 0.03, 16, 7);
  const stopIn = kick(t, PG.stop - 0.04, 14, 6);
  const forIn = kick(t, PG.for - 0.03, 16, 7);

  const zoomOut = 1 + exit * 1.2;

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <WhipDefs id="pg5-whip" x={blurX} y={0} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `540px ${WIN.top + WIN.h / 2}px`,
          transform: `translate(${enter * 1300 + sx}px, ${sy}px) rotate(${sr}deg) scale(${zoomOut})`,
          filter: blurX > 0.5 ? "url(#pg5-whip)" : undefined,
          opacity: 1 - exit * 0.55,
        }}
      >
        <div style={{ position: "absolute", inset: 0, transform: `scale(${1.08 + t * 0.02}) translateX(${-(cam.x - 700) * 0.04}px)` }}>
          <Sky opacity={0.45} zoom={1.1} />
        </div>
        <Bokeh seed="pgbk" dx={-(cam.x - 700) * 0.25} />
        <Particles count={60} color={theme2.lilacSoft} opacity={0.4} seed="pgpt" />

        {/* Footage window */}
        <div
          style={{
            position: "absolute",
            left: WIN.left,
            top: WIN.top,
            width: WIN.w,
            height: WIN.h,
            transform: `perspective(2400px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${wsc})`,
            ...rim(1 + hit * 1.6),
            overflow: "hidden",
          }}
        >
          {!stopped && <RecView w={WIN.w} h={WIN.h} cam={cam} spans={SPANS} durations={CUTS.slice(1).map((c, i) => c - CUTS[i])} from={0} />}
          {stopped && <RecView w={WIN.w} h={WIN.h} cam={cam} still={STILL} />}
          {/* rush speed lines */}
          {rush > 0.02 && (
            <svg width={WIN.w} height={WIN.h} style={{ position: "absolute", inset: 0 }}>
              {Array.from({ length: 22 }, (_, i) => {
                const y = random(`pgl${i}`) * WIN.h;
                const len = 120 + random(`pgw${i}`) * 300;
                const x = WIN.w - (((random(`pgx${i}`) + t * (2.5 + random(`pgv${i}`) * 2)) % 1) * (WIN.w + len));
                return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke="rgba(228,220,255,.8)" strokeWidth={1.5 + random(`pgs${i}`) * 2.5} opacity={rush * 0.5} strokeLinecap="round" />;
              })}
            </svg>
          )}
          {/* the freeze: a lilac flash frame on "stop" */}
          {hit > 0.01 && <div style={{ position: "absolute", inset: 0, background: `rgba(228,220,255,${hit * 0.55})`, mixBlendMode: "screen" }} />}
          <Sweep a={0.05} b={0.75} strength={0.14} />
          <Sweep a={PG.stop} b={PG.stop + 0.55} angle={70} strength={0.25} />
        </div>

        <Tag
          style={{
            right: 64,
            top: 312,
            opacity: tw(t, 0.08, 0.28) * (1 - exit),
            transform: `translateY(${(1 - tw(t, 0.08, 0.32, 0, 1, eOut)) * 24}px)`,
          }}
        >
          The playground
        </Tag>

        {/* kinetic type */}
        <div style={{ position: "absolute", left: 0, right: 0, top: TEXT_TOP, textAlign: "center", fontFamily: theme2.display, whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 28, fontWeight: 800, fontSize: 96, letterSpacing: "-0.04em", lineHeight: 1, color: theme2.fg }}>
            {(
              [
                ["people", peopleIn, PG.people],
                ["actually", actuallyIn, PG.actually],
              ] as const
            ).map(([word, k, at]) => (
              <span
                key={word}
                style={{
                  display: "inline-block",
                  opacity: t >= at - 0.03 ? Math.min(1, k * 2.5) : 0,
                  transform: `translateY(${(1 - k) * 60}px) rotateX(${(1 - k) * 70}deg)`,
                  textShadow: "0 0 30px rgba(188,165,238,.35), 0 8px 40px rgba(3,4,18,.85)",
                }}
              >
                {word}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 36, marginTop: 6, fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 1 }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 210,
                color: theme2.lilac,
                opacity: t >= PG.stop - 0.04 ? Math.min(1, stopIn * 3) : 0,
                transform: `scale(${2.2 - 1.2 * stopIn})`,
                transformOrigin: "50% 70%",
                textShadow: `0 0 ${60 + pulse(t, PG.stop, 0.7) * 130}px rgba(188,165,238,.9), 0 10px 50px rgba(3,4,18,.85)`,
              }}
            >
              stop
            </span>
            <span
              style={{
                display: "inline-block",
                fontSize: 150,
                color: theme2.paper,
                opacity: t >= PG.for - 0.03 ? Math.min(1, forIn * 2.5) : 0,
                transform: `translateY(${(1 - forIn) * 80}px)`,
                textShadow: "0 0 30px rgba(188,165,238,.35), 0 8px 40px rgba(3,4,18,.85)",
              }}
            >
              for.
            </span>
          </div>
        </div>
        <Ripple x={540} y={TEXT_TOP + 230} at={PG.stop} rings={3} max={700} />
        <Sparks x={540} y={TEXT_TOP + 230} at={PG.stop} seed="pgstop" n={18} spread={480} />
      </div>
      <AbsoluteFill style={{ background: `rgba(228,220,255,${pulse(t, PG.stop, 0.22) * 0.25})`, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
