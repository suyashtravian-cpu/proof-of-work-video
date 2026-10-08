import { AbsoluteFill, random } from "remotion";
import { Particles } from "../../fx/Particles";
import { Sky } from "../components/Sky";
import { theme2 } from "../theme";
import { Bokeh, RecView, Ripple, Sweep, T, Tag, WhipDefs, eExpo, eIO, eIn, eOut, keys, kick, pulse, rim, tw, vo } from "./after-making-playground/kit";

// PLAYGROUND (43.2 to 47.8): the playground footage as a joyful rush, counting the ten
// experiments as they fly past, then "curiosity deserves a URL": a URL bar types the real address.

const LINE = vo("Playground", "And a playground");
const LEN = 4.6;
export const PG_BAR = LINE.word(6) - 0.06; // "because"
export const PG_ENTER = LINE.word(10); // "URL."
const TYPE_A = PG_BAR + 0.22;
const TYPE_B = PG_ENTER - 0.3;
export const PG_EXIT = 4.34;
export const URL_TEXT = "pilotaccess.com/suyashpow";

// Count times follow the footage: a pan across cards 1 to 5, then 6 to 10 as the carousel rushes by.
export const COUNT = [0.85, 1.04, 1.23, 1.42, 1.61, 1.751, 1.873, 2.009, 2.162, 2.33];
const NAMES = ["Atlas AI", "Lexis", "Open Interest", "Moolank 365", "Homeward", "Words for Love", "Time Machine Love Letter", "Eyeline", "Rank Please", "Somewhere, a Word"];
export const TYPE_TICKS = Array.from({ length: 8 }, (_, i) => +(TYPE_A + ((TYPE_B - TYPE_A) * (i + 0.5)) / 8).toFixed(3));

const SPANS: [number, number][] = [
  [49.3, 50.7], // "Always in motion." floating cards
  [53.5, 54.5], // the page scrolls to the carousel
  [54.55, 55.25], // cards 1 to 5, held while the camera pans
  [56.6, 58.2], // cards 6 to 10 rush past
  [58.2, 58.46], // the page zooms back out to "Curiosity, with a URL."
];
const CUTS = [0, 0.6, 0.85, 1.65, 2.35, 2.6];
const STILL = 58.467;

const WIN = { left: 40, top: 250, w: 1000, h: 1140 };
const WC = { x: WIN.left + WIN.w / 2, y: WIN.top + WIN.h / 2 };
const BAR = { left: 70, top: 1172, w: 940, h: 130 };
const URL_BOX = { x: 244, y: 290, w: 170, h: 72 }; // "URL." in the frozen frame (recording px)

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

  // Entry from the right (Making whips left), exit: zoom through the URL bar.
  const enter = tw(t, 0, 0.22, 1, 0, eOut);
  const exit = tw(t, PG_EXIT, LEN, 0, 1, eIn);
  const blurX = enter * 80;

  // Count.
  let n = 0;
  COUNT.forEach((c, i) => {
    if (t >= c - 0.02) n = i + 1;
  });
  const lastAt = n > 0 ? COUNT[n - 1] : 0;
  const ck = n > 0 ? kick(t, lastAt - 0.02, 26, 9) : 0;
  const isTen = n === 10;
  const tenGlow = pulse(t, COUNT[9], 0.7);

  // Camera inside the page.
  const panX = keys(t, [[COUNT[0], 335], [COUNT[4], 1495]], (x) => x);
  const cam = {
    s: keys(t, [[0, 1.08], [0.6, 1.26], [0.85, 2.0], [1.62, 2.0], [1.68, 1.42], [2.35, 1.42], [2.85, 2.35], [PG_EXIT, 2.52], [LEN, 3.4]], eIO),
    x: t < 0.85 ? keys(t, [[0, 760], [0.6, 900], [0.85, 335]], eIO) : t < 1.65 ? panX : keys(t, [[1.65, 1000], [2.35, 1000], [2.85, 232], [LEN, 246]], eIO),
    y: keys(t, [[0, 520], [0.6, 470], [0.85, 660], [1.65, 660], [1.68, 675], [2.35, 675], [2.85, 300], [LEN, 300]], eIO),
  };
  const rush = tw(t, 1.65, 1.8) * tw(t, 2.2, 2.4, 1, 0);

  // Window motion.
  const countPop = n > 0 ? pulse(t, lastAt, 0.18) : 0;
  const rx = 6 + Math.sin(t * 1.2) * 2 - pulse(t, PG_ENTER, 0.5) * 3;
  const ry = -4 + Math.sin(t * 0.9) * 4 + rush * 6;
  const wsc = 0.97 + countPop * 0.015 + tenGlow * 0.02 + pulse(t, PG_ENTER, 0.4) * 0.03;

  // URL bar.
  const barIn = kick(t, PG_BAR, 15, 7);
  const typed = Math.max(0, Math.min(URL_TEXT.length, Math.floor(tw(t, TYPE_A, TYPE_B, 0, 1, (x) => x) * URL_TEXT.length + 0.001)));
  const entered = t >= PG_ENTER;
  const eFlash = pulse(t, PG_ENTER, 0.45);
  const caretOn = !entered && (t < TYPE_B + 0.05 || Math.floor((t - TYPE_B) * 4) % 2 === 1);
  const box = tw(t, PG_ENTER - 0.06, PG_ENTER + 0.3, 0, 1, eOut);
  // "URL." in screen space (frozen frame) for the callout line.
  const bx = WC.x + (URL_BOX.x + URL_BOX.w / 2 - cam.x) * cam.s;
  const by = WC.y + (URL_BOX.y + URL_BOX.h - cam.y) * cam.s;

  const zoomOut = 1 + exit * 1.2;

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <WhipDefs id="pg-whip" x={blurX} y={0} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `540px ${BAR.top + BAR.h / 2}px`,
          transform: `translateX(${enter * 1300}px) scale(${zoomOut})`,
          filter: blurX > 0.5 ? "url(#pg-whip)" : undefined,
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
            ...rim(1 + countPop + tenGlow + eFlash),
            overflow: "hidden",
          }}
        >
          {t < CUTS[5] + 0.04 && <RecView w={WIN.w} h={WIN.h} cam={cam} spans={SPANS} durations={CUTS.slice(1).map((c, i) => c - CUTS[i])} from={0} />}
          {t >= CUTS[5] && (
            <div style={{ position: "absolute", inset: 0 }}>
              <RecView w={WIN.w} h={WIN.h} cam={cam} still={STILL}>
                {box > 0 && (
                  <svg width={1708} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                    <rect x={URL_BOX.x} y={URL_BOX.y} width={URL_BOX.w} height={URL_BOX.h} rx={10} fill={`rgba(188,165,238,${0.16 * box})`} stroke={theme2.lilac} strokeWidth={2.5} opacity={box} strokeDasharray={480} strokeDashoffset={480 * (1 - box)} style={{ filter: "drop-shadow(0 0 6px rgba(188,165,238,.9))" }} />
                  </svg>
                )}
              </RecView>
            </div>
          )}
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
          <Sweep a={0.05} b={0.75} strength={0.14} />
          <Sweep a={COUNT[9] - 0.05} b={COUNT[9] + 0.6} angle={70} strength={0.22} />
          <Sweep a={PG_ENTER} b={PG_ENTER + 0.55} strength={0.25} />
        </div>

        {/* Top: "The playground" tag, then the count */}
        <Tag
          style={{
            left: 60,
            top: 120,
            opacity: tw(t, 0.08, 0.28) * tw(t, COUNT[0] - 0.12, COUNT[0], 1, 0),
            transform: `translateY(${(1 - tw(t, 0.08, 0.32, 0, 1, eOut)) * 24}px)`,
          }}
        >
          The playground
        </Tag>
        {n > 0 && (
          <div style={{ position: "absolute", left: 56, top: 58, height: 180, display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "baseline" }}>
              <div
                style={{
                  fontFamily: theme2.display,
                  fontWeight: 800,
                  fontSize: 176,
                  lineHeight: 1,
                  letterSpacing: "-0.05em",
                  color: theme2.paper,
                  transform: `translateY(${(1 - ck) * 70}px) scale(${1 + (1 - ck) * 0.25 + tenGlow * 0.12})`,
                  transformOrigin: "50% 80%",
                  opacity: Math.min(1, ck * 3),
                  textShadow: `0 0 ${40 + tenGlow * 120}px rgba(188,165,238,${0.6 + tenGlow * 0.4}), 0 8px 30px rgba(3,4,18,.8)`,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(n).padStart(2, "0")}
              </div>
              <div style={{ fontFamily: theme2.display, fontWeight: 700, fontSize: 58, color: theme2.lilac, marginLeft: 8, letterSpacing: "-0.03em" }}>/10</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "hidden", paddingTop: 18 }}>
              <div style={{ fontFamily: theme2.mono, fontSize: 21, letterSpacing: "0.16em", color: theme2.lilac, textTransform: "uppercase" }}>
                {isTen ? "Original builds" : "Experiment"}
              </div>
              <div
                style={{
                  fontFamily: theme2.display,
                  fontWeight: 700,
                  fontSize: isTen ? 54 : 46,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  color: isTen ? theme2.lilacSoft : theme2.fg,
                  whiteSpace: "nowrap",
                  transform: `translateY(${(1 - Math.min(1, ck * 1.3)) * 40}px)`,
                  opacity: Math.min(1, ck * 2),
                }}
              >
                {isTen ? "Ten experiments" : NAMES[n - 1]}
              </div>
            </div>
          </div>
        )}
        {COUNT.map((c, i) => (
          <Sparks key={i} x={150} y={150} at={c} seed={`pgsp${i}`} n={i === 9 ? 22 : 8} spread={i === 9 ? 420 : 200} />
        ))}

        {/* URL bar */}
        {t >= PG_BAR - 0.02 && (
          <div
            style={{
              position: "absolute",
              left: BAR.left,
              top: BAR.top,
              width: BAR.w,
              height: BAR.h,
              borderRadius: BAR.h / 2,
              display: "flex",
              alignItems: "center",
              gap: 26,
              padding: "0 30px",
              boxSizing: "border-box",
              background: eFlash > 0.02 ? `rgba(188,165,238,${0.2 + eFlash * 0.75})` : entered ? "rgba(32,26,70,.95)" : "rgba(15,17,45,.94)",
              border: `2px solid rgba(228,220,255,${0.45 + eFlash * 0.5})`,
              boxShadow: `0 40px 90px rgba(3,4,18,.85), 0 0 ${70 + eFlash * 160}px rgba(188,165,238,${0.45 + eFlash * 0.5})`,
              transform: `perspective(1600px) translateY(${(1 - barIn) * 260}px) rotateX(${(1 - barIn) * -50}deg) scale(${(0.86 + 0.14 * barIn) * (1 + eFlash * 0.05)})`,
              opacity: Math.min(1, barIn * 2.5),
            }}
          >
            <div style={{ width: 70, height: 70, borderRadius: 35, flexShrink: 0, background: `radial-gradient(circle at 35% 30%, ${theme2.lilacSoft}, ${theme2.lilac} 60%, #8d74d6)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 26px rgba(188,165,238,.7)` }}>
              <svg width={32} height={36} viewBox="0 0 16 18">
                <rect x={2} y={8} width={12} height={9} rx={2} fill={theme2.ink} />
                <path d="M4.5 8 V5.5 a3.5 3.5 0 0 1 7 0 V8" fill="none" stroke={theme2.ink} strokeWidth={2} />
              </svg>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", fontFamily: theme2.sans, fontWeight: 700, fontSize: 50, letterSpacing: "-0.01em", color: eFlash > 0.35 ? theme2.ink : theme2.paper, whiteSpace: "nowrap" }}>
              <span>{URL_TEXT.slice(0, typed)}</span>
              {caretOn && <div style={{ width: 5, height: 58, marginLeft: 4, borderRadius: 3, background: theme2.lilac, boxShadow: `0 0 12px ${theme2.lilac}` }} />}
            </div>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 22,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: entered ? theme2.paper : "rgba(228,220,255,.1)",
                border: "1.5px solid rgba(228,220,255,.4)",
                transform: `scale(${1 - pulse(t, PG_ENTER - 0.04, 0.16) * 0.2})`,
              }}
            >
              <svg width={36} height={36} viewBox="0 0 24 24">
                <path d="M20 5 V13 H6 M10 9 L6 13 L10 17" fill="none" stroke={entered ? theme2.ink : theme2.lilacSoft} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )}
        {/* callout from the bar to "URL." on the page */}
        {box > 0 && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <line x1={540} y1={BAR.top} x2={bx + (540 - bx) * (1 - box)} y2={by + (BAR.top - by) * (1 - box)} stroke={theme2.lilac} strokeWidth={3} strokeDasharray="10 9" opacity={0.9} />
            <circle cx={bx} cy={by} r={8 * box} fill={theme2.lilacSoft} style={{ filter: `drop-shadow(0 0 8px ${theme2.lilac})` }} />
          </svg>
        )}
        <Ripple x={540} y={BAR.top + BAR.h / 2} at={PG_ENTER} rings={3} max={760} />
        <Sparks x={540} y={BAR.top + BAR.h / 2} at={PG_ENTER} seed="pgenter" n={18} spread={520} />
      </div>
      <AbsoluteFill style={{ background: `rgba(228,220,255,${pulse(t, PG_ENTER, 0.22) * 0.25})`, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
