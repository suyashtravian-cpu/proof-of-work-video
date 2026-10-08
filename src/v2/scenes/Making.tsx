import { AbsoluteFill } from "remotion";
import { Particles } from "../../fx/Particles";
import { shakeAt } from "../../fx/shake";
import { Sky } from "../components/Sky";
import { theme2 } from "../theme";
import { Bokeh, RecView, Streaks, Sweep, T, Tag, WhipDefs, eExpo, eIO, eIn, eOut, keys, kick, pulse, rim, tw, vo } from "./after-making-playground/kit";

// MAKING (40.4 to 43.2): "Beyond the usual." becomes a tunnel the camera dives into while
// "A little strategy." lands; a flash whips into the creative work while "A lot of making." slams.
// The line is kinetic (no caption), so this scene typesets it.

const LINE = vo("Making", "A little strategy");
export const MK = {
  a: LINE.word(0),
  little: LINE.word(1),
  strategy: LINE.word(2),
  lot: LINE.word(3),
  making: LINE.word(6),
};
export const MK_WHIP = MK.lot - 0.13;
export const MK_EXIT = 2.56;
const LEN = 2.8;

const W = { w: 1000, h: 650, cx: 540, cy: 1035 };

export const Making: React.FC = () => {
  const t = T();
  const B = MK_WHIP;
  const inB = t >= B;

  // Entry: rise in from below (After whips up), exit: whip left into Playground.
  const enter = tw(t, 0, 0.24, 1, 0, eOut);
  const exit = tw(t, MK_EXIT, LEN, 0, 1, eIn);
  const blurY = enter * 60;
  const blurX = exit * 90;
  const [sx, sy, sr] = shakeAt(t, [MK.making, MK.strategy], 14, 0.3);

  // Phase A camera: dive into the "Beyond the usual." tunnel.
  const camA = {
    s: keys(t, [[0, 1.4], [MK.strategy, 1.62], [B - 0.16, 2.05], [B + 0.04, 4.6]], eIO),
    x: 856,
    y: keys(t, [[0, 470], [B - 0.16, 545], [B + 0.04, 610]], eIO),
  };
  const twist = keys(t, [[0, 2], [B - 0.16, -4], [B + 0.04, -16]], eIO);
  const streak = tw(t, B - 0.5, B, 0, 1, eIn) * (inB ? 0 : 1);
  const flash = Math.max(tw(t, B - 0.14, B, 0, 1, eIn) * (inB ? 0 : 1), pulse(t, B, 0.28));

  // Phase B camera on the posters and reels.
  const camB = {
    s: keys(t, [[B, 1.22], [LEN, 1.3]], eIO),
    x: keys(t, [[B, 565], [LEN, 600]], eIO),
    y: keys(t, [[B, 812], [LEN, 800]], eIO),
  };
  const wIn = kick(t, B, 16, 7);
  const wPop = pulse(t, MK.making, 0.35);
  const wrx = (1 - wIn) * 38 + 7 + Math.sin(t * 1.4) * 2;
  const wry = -9 + Math.sin(t * 1.1 + 1) * 4;

  // Kinetic type.
  const aIn = kick(t, MK.a - 0.03, 18, 8);
  const littleIn = kick(t, MK.little - 0.03, 18, 8);
  const strIn = kick(t, MK.strategy - 0.04, 16, 7);
  // "A little strategy." morphs from the centre to a small header on the whip.
  const m = tw(t, B - 0.06, B + 0.32, 0, 1, eExpo);
  const headY = 1180 + (22 - 1180) * m;
  const headS = 1 + (0.42 - 1) * m;
  const lotIn = kick(t, MK.lot - 0.03, 16, 7);
  const mkIn = kick(t, MK.making - 0.04, 14, 6);

  // Mini cards: two frozen frames of the reels fly in on "making."
  const mc = [
    { at: MK.making + 0.04, x: 52, y: 1395, rot: -7, still: 45.9, cam: { x: 478, y: 330, s: 0.58 }, from: -700, label: "Reel" },
    { at: MK.making + 0.14, x: 600, y: 1488, rot: 6, still: 45.9, cam: { x: 1228, y: 392, s: 0.58 }, from: 700, label: "Reel" },
  ];

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <WhipDefs id="mk-whip" x={blurX} y={blurY} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${-exit * 1300 + sx}px, ${enter * 1500 + sy}px) rotate(${sr}deg)`,
          filter: blurX + blurY > 0.5 ? "url(#mk-whip)" : undefined,
        }}
      >
        {!inB ? (
          <>
            {/* Phase A: full-bleed tunnel */}
            <div style={{ position: "absolute", inset: 0, transform: `rotate(${twist}deg) scale(1.1)` }}>
              <RecView w={1080} h={1920} cam={camA} spans={[[40.15, 41.05]]} durations={[B + 0.1]} from={0}>
                <div style={{ position: "absolute", left: 0, top: 930, width: 1708, height: 150, background: "linear-gradient(180deg, rgba(8,10,26,0), #080a1a 80%)" }} />
              </RecView>
            </div>
            <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(9,13,37,0) 40%, rgba(9,13,37,.75) 100%)" }} />
            <Streaks cx={540} cy={1020} amount={streak} seed="mkst" />
          </>
        ) : (
          <>
            {/* Phase B: the creative work */}
            <div style={{ position: "absolute", inset: 0, transform: `scale(${1.12 - (t - B) * 0.03}) translateY(${-(t - B) * 30}px)` }}>
              <Sky opacity={0.5} zoom={1.15} />
            </div>
            <Bokeh seed="mkbk" dy={-(t - B) * 120} />
            <Particles count={50} color={theme2.lilacSoft} opacity={0.4} seed="mkpt" />
            <div
              style={{
                position: "absolute",
                left: W.cx - W.w / 2,
                top: W.cy - W.h / 2,
                width: W.w,
                height: W.h,
                transform: `perspective(2000px) translateY(${(1 - wIn) * 520}px) rotateX(${wrx}deg) rotateY(${wry}deg) scale(${(0.7 + 0.3 * wIn) * (1 + wPop * 0.04)})`,
                ...rim(1 + wPop),
                overflow: "hidden",
              }}
            >
              <RecView w={W.w} h={W.h} cam={camB} spans={[[44.42, 45.95]]} durations={[LEN - B]} from={B} />
              <Sweep a={B + 0.2} b={B + 1.1} strength={0.2} />
              <Sweep a={MK.making} b={MK.making + 0.7} angle={65} strength={0.18} />
            </div>
            <Tag
              style={{
                left: 92,
                top: W.cy - W.h / 2 - 26,
                opacity: tw(t, B + 0.3, B + 0.5) * (1 - exit),
                transform: `translateX(${(1 - tw(t, B + 0.3, B + 0.55, 0, 1, eOut)) * -40}px)`,
              }}
            >
              Posters
            </Tag>
            {mc.map((c, i) => {
              const k = kick(t, c.at, 15, 6.5);
              if (t < c.at) return null;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: c.x,
                    top: c.y,
                    width: 428,
                    height: 262,
                    transform: `perspective(1600px) translateX(${(1 - k) * c.from}px) translateY(${Math.sin(t * 2 + i) * 10}px) rotateZ(${c.rot * k}deg) rotateY(${(1 - k) * (i ? -50 : 50)}deg)`,
                    ...rim(0.8),
                    borderRadius: 22,
                    overflow: "hidden",
                  }}
                >
                  <RecView w={428} h={262} cam={c.cam} still={c.still} hideNav={false} />
                </div>
              );
            })}
            {mc.map((c, i) =>
              t > c.at + 0.2 ? (
                <Tag key={`t${i}`} style={{ left: c.x + (i ? 250 : 30), top: c.y - 24, fontSize: 19, padding: "8px 16px", opacity: tw(t, c.at + 0.2, c.at + 0.4) * (1 - exit) }}>
                  {c.label}
                </Tag>
              ) : null,
            )}
          </>
        )}

        {/* Kinetic type */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: headY,
            textAlign: "center",
            transform: `scale(${headS})`,
            transformOrigin: "50% 50%",
            fontFamily: theme2.display,
            color: theme2.fg,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: 26, fontWeight: 700, fontSize: 96, letterSpacing: "-0.03em", color: theme2.lilacSoft, height: 100 }}>
            {[
              ["A", aIn, MK.a],
              ["little", littleIn, MK.little],
            ].map(([w, k, at]) => (
              <span
                key={w as string}
                style={{
                  display: "inline-block",
                  opacity: t >= (at as number) - 0.03 ? Math.min(1, (k as number) * 2) : 0,
                  transform: `translateY(${(1 - (k as number)) * 60}px) rotateX(${(1 - (k as number)) * 70}deg)`,
                }}
              >
                {w}
              </span>
            ))}
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 196,
              letterSpacing: "-0.055em",
              lineHeight: 1.05,
              marginTop: 6,
              opacity: t >= MK.strategy - 0.04 ? Math.min(1, strIn * 2.5) : 0,
              transform: `scale(${1.45 - 0.45 * strIn})`,
              textShadow: `0 0 ${50 + pulse(t, MK.strategy, 0.5) * 80}px rgba(188,165,238,.7), 0 8px 40px rgba(3,4,18,.8)`,
            }}
          >
            strategy.
          </div>
        </div>

        {inB && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 268, textAlign: "center", fontFamily: theme2.display, color: theme2.fg, whiteSpace: "nowrap" }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 140,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                opacity: t >= MK.lot - 0.03 ? Math.min(1, lotIn * 2.5) : 0,
                transform: `translateY(${(1 - lotIn) * -120}px) scale(${1.3 - 0.3 * lotIn})`,
                textShadow: "0 8px 40px rgba(3,4,18,.8)",
              }}
            >
              A lot of
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 262,
                letterSpacing: "-0.06em",
                lineHeight: 0.95,
                marginTop: -6,
                color: theme2.paper,
                opacity: t >= MK.making - 0.04 ? Math.min(1, mkIn * 3) : 0,
                transform: `scale(${1.9 - 0.9 * mkIn})`,
                textShadow: `0 0 ${60 + pulse(t, MK.making, 0.6) * 120}px rgba(188,165,238,.85), 0 10px 50px rgba(3,4,18,.85)`,
              }}
            >
              making.
            </div>
          </div>
        )}
      </div>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 52%, rgba(248,247,243,${0.95 * flash}) 0%, rgba(188,165,238,${0.8 * flash}) 40%, rgba(9,13,37,${0.2 * flash}) 85%)` }} />
    </AbsoluteFill>
  );
};
