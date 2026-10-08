import { AbsoluteFill } from "remotion";
import { Particles } from "../../fx/Particles";
import { shakeAt } from "../../fx/shake";
import { Sky } from "../../v2/components/Sky";
import { theme2 } from "../../v2/theme";
import { Bokeh, RecView, Streaks, Sweep, T, Tag, WhipDefs, eIO, eIn, eOut, keys, kick, pulse, rim, tw } from "../../v2/scenes/after-making-playground/kit";
import { L, THREE_SPLIT, at } from "../timing";

// THREE, part 1 (15.45 to 17.45): video 2's Making. "Beyond the usual." becomes a tunnel the camera
// dives into while "Three." lands; a flash whips into the creative work (the site's posters and
// reels) while "Creative" slams and "and content" follows. The line is kinetic (no caption), so
// this scene and Playground typeset it.

const w = (s: string) => at("three", L.creative, s);
export const MK = {
  three: w("three"),
  creative: w("creative"),
  and: w("and"),
  content: w("content"),
};
export const MK_WHIP = MK.creative - 0.13;
export const MK_EXIT = THREE_SPLIT - 0.2;
const LEN = THREE_SPLIT;

const W = { w: 1000, h: 540, cx: 540, cy: 1022 };

export const Making: React.FC = () => {
  const t = T();
  const B = MK_WHIP;
  const inB = t >= B;

  // Entry: rise in from below (After whips up), exit: whip left into Playground.
  const enter = tw(t, 0, 0.24, 1, 0, eOut);
  const exit = tw(t, MK_EXIT, LEN, 0, 1, eIn);
  const blurY = enter * 60;
  const blurX = exit * 90;
  const [sx, sy, sr] = shakeAt(t, [MK.creative], 14, 0.3);

  // Phase A camera: dive into the "Beyond the usual." tunnel.
  const camA = {
    s: keys(t, [[0, 1.4], [MK.three, 1.55], [B - 0.16, 2.05], [B + 0.04, 4.6]], eIO),
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
  const wPop = pulse(t, MK.creative, 0.35);
  const wrx = (1 - wIn) * 38 + 7 + Math.sin(t * 1.4) * 2;
  const wry = -9 + Math.sin(t * 1.1 + 1) * 4;

  // Kinetic type.
  const strIn = kick(t, MK.three - 0.04, 16, 7);
  // "Three." flies past the lens as the camera dives through the tunnel.
  const m = tw(t, B - 0.2, B + 0.08, 0, 1, eIn);
  const headY = 1150;
  const headS = 1 + 1.6 * m;
  const andIn = kick(t, MK.and - 0.03, 16, 7);
  const contentIn = kick(t, MK.content - 0.03, 16, 7);
  const mkIn = kick(t, MK.creative - 0.04, 14, 6);

  // Mini cards: two frozen frames of the reels fly in on "making."
  const mc = [
    { at: MK.and + 0.1, x: 52, y: 1150, rot: -7, still: 45.9, cam: { x: 478, y: 330, s: 0.58 }, from: -700, label: "Reel" },
    { at: MK.and + 0.2, x: 600, y: 1232, rot: 6, still: 45.9, cam: { x: 1228, y: 392, s: 0.58 }, from: 700, label: "Reel" },
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
              <Sweep a={MK.creative} b={MK.creative + 0.7} angle={65} strength={0.18} />
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

        {/* Kinetic type: "Three." */}
        {!inB && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: headY,
              textAlign: "center",
              transform: `scale(${headS})`,
              transformOrigin: "50% 60%",
              fontFamily: theme2.display,
              color: theme2.fg,
              whiteSpace: "nowrap",
              opacity: 1 - m,
              filter: m > 0.05 ? `blur(${(m * 14).toFixed(1)}px)` : undefined,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 220,
                letterSpacing: "-0.055em",
                lineHeight: 1.05,
                opacity: t >= MK.three - 0.04 ? Math.min(1, strIn * 2.5) : 0,
                transform: `scale(${1.45 - 0.45 * strIn})`,
                textShadow: `0 0 ${50 + pulse(t, MK.three, 0.5) * 80}px rgba(188,165,238,.7), 0 8px 40px rgba(3,4,18,.8)`,
              }}
            >
              Three.
            </div>
          </div>
        )}

        {inB && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 372, textAlign: "center", fontFamily: theme2.display, color: theme2.fg, whiteSpace: "nowrap" }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 240,
                letterSpacing: "-0.06em",
                lineHeight: 0.95,
                color: theme2.paper,
                opacity: t >= MK.creative - 0.04 ? Math.min(1, mkIn * 3) : 0,
                transform: `scale(${1.9 - 0.9 * mkIn})`,
                textShadow: `0 0 ${60 + pulse(t, MK.creative, 0.6) * 120}px rgba(188,165,238,.85), 0 10px 50px rgba(3,4,18,.85)`,
              }}
            >
              Creative
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 34, marginTop: 14, fontWeight: 800, fontSize: 132, letterSpacing: "-0.05em", lineHeight: 1 }}>
              {(
                [
                  ["and", andIn, MK.and, theme2.lilacSoft],
                  ["content", contentIn, MK.content, theme2.lilac],
                ] as const
              ).map(([word, k, at, color]) => (
                <span
                  key={word}
                  style={{
                    display: "inline-block",
                    color,
                    opacity: t >= at - 0.03 ? Math.min(1, k * 2.5) : 0,
                    transform: `translateY(${(1 - k) * -120}px) scale(${1.3 - 0.3 * k})`,
                    textShadow: `0 0 ${word === "content" ? 50 + pulse(t, at, 0.5) * 80 : 30}px rgba(188,165,238,.6), 0 8px 40px rgba(3,4,18,.8)`,
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 52%, rgba(248,247,243,${0.95 * flash}) 0%, rgba(188,165,238,${0.8 * flash}) 40%, rgba(9,13,37,${0.2 * flash}) 85%)` }} />
    </AbsoluteFill>
  );
};
