import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, tween } from "../components/anim";
import { FloatingCode } from "../fx/FloatingCode";
import { GridBg } from "../fx/GridBg";
import { Particles } from "../fx/Particles";
import { Scramble } from "../fx/Scramble";
import { theme } from "../theme";
import { KeySparks, Stroke } from "./resume-prompt/KeySparks";
import { TokenBurst } from "./resume-prompt/TokenBurst";

export const PROMPT =
  "Build me a proof-of-work website. My products, my experiments, my campaigns. Real evidence, not a résumé.";
export const JOKE_LINE = "Make no mistakes.";
const TYPE_FROM = 0.25;
const TYPE_TO = 1.6;
const JOKE_FROM = 1.95; // after a beat of caret blinking
const JOKE_TO = 2.8; // typed slowly, one deliberate key at a time
const SEND_AT = 3.03;
const CYAN = "#33e1ff";

const typedAt = (t: number) => Math.round(tween(t, TYPE_FROM, TYPE_TO, 0, PROMPT.length, (k) => k));
const jokeAt = (t: number) => Math.round(tween(t, JOKE_FROM, JOKE_TO, 0, JOKE_LINE.length, (k) => k));

// 13.0–16.25  "So I opened ChatGPT... Make no mistakes."
// Neutral composer (no third-party branding) floating in 3D over code and a grid floor.
// The camera punches in on the joke line, holds in silence, then whips back out on send,
// and the agent's output rushes past the camera into the cut.
export const Prompt: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const enter = tween(t, 0, 0.3, 0, 1, easeExpo);
  const n = typedAt(t);
  const j = jokeAt(t);
  const zoomIn = tween(t, JOKE_FROM - 0.05, JOKE_FROM + 0.3, 0, 1, easeExpo);
  const zoomOut = tween(t, SEND_AT, SEND_AT + 0.16, 0, 1, easeInOut);
  const zoom = 1 + 0.85 * zoomIn * (1 - zoomOut);
  const press = t >= SEND_AT ? Math.max(0, 1 - (t - SEND_AT) / 0.15) : 0;
  const caret = Math.floor(t * 2.5) % 2 === 0 && t < SEND_AT;
  const wink = tween(t, JOKE_TO + 0.05, JOKE_TO + 0.2, 0, 1) * (1 - zoomOut);
  const ready = n === PROMPT.length;

  // keystrokes in the last few frames -> sparks + rim glow
  const strokes: Stroke[] = [];
  for (let a = 0; a < 9; a++) {
    const ff = f - a;
    const now = typedAt(ff / 30) + jokeAt(ff / 30);
    const prev = typedAt((ff - 1) / 30) + jokeAt((ff - 1) / 30);
    if (now > prev) strokes.push({ age: (a + 0.5) / 30, seed: ff, heavy: ff / 30 >= JOKE_FROM });
  }
  const glow = strokes.reduce((m, s) => Math.max(m, 1 - s.age / 0.2), 0);

  // 3D float: tilted while typing, flat for the punch-in so the joke reads dead-on.
  const flat = zoomIn * (1 - zoomOut);
  const away = tween(t, SEND_AT + 0.05, SEND_AT + 0.21, 0, 1, Easing.in(Easing.cubic));
  const rx = (1 - enter) * 55 + (10 + Math.sin(t * 1.4) * 2) * (1 - flat) + away * 25;
  const ry = (-12 + Math.sin(t * 0.9) * 3) * (1 - flat);
  const rz = (-1.5 + Math.sin(t * 0.7) * 0.6) * (1 - flat);
  const bob = Math.sin(t * 1.6) * 8 * (1 - flat);

  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + 0.18 * zoomIn * (1 - zoomOut) + t * 0.02})`, transformOrigin: "50% 55%" }}>
        <GridBg opacity={0.16} speed={1.6} horizon={1230} />
        <FloatingCode count={30} opacity={0.11} seed="pr" speed={1.5} />
        <Particles count={40} opacity={0.3} seed="prp" />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${zoom})`,
          transformOrigin: "96px 1000px",
        }}
      >
        <div
          style={{
            opacity: Math.min(1, 0.3 + enter) * (1 - away * 0.9),
            transform: `perspective(1800px) translateY(${(1 - enter) * 60 + bob}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${1 - away * 0.45})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 900,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: theme.mono,
              fontSize: 24,
              letterSpacing: "0.2em",
              color: theme.dim,
              marginBottom: 28,
            }}
          >
            <span>
              <span style={{ color: theme.red }}>● </span>
              <Scramble text="ONE PROMPT" at={0.05} dur={0.35} />
            </span>
            <span style={{ color: n > 0 ? theme.fg : theme.dim }}>{String(n + j).padStart(3, "0")} CHARS</span>
          </div>
          <div
            style={{
              width: 940,
              borderRadius: 40,
              background: "#151515",
              border: `1.5px solid ${glow > 0 ? `rgba(51,225,255,${0.15 + glow * 0.4})` : "#ffffff1f"}`,
              padding: "40px 44px 104px",
              boxSizing: "border-box",
              position: "relative",
              boxShadow: `0 40px 120px rgba(0,0,0,.7), 0 0 ${40 + glow * 50}px rgba(51,225,255,${0.06 + glow * 0.16})`,
            }}
          >
            <div style={{ fontFamily: theme.sans, fontWeight: 500, fontSize: 44, lineHeight: 1.25, color: theme.fg, letterSpacing: "-0.02em", minHeight: 220 }}>
              {PROMPT.slice(0, n)}
              {j > 0 && (
                <>
                  <br />
                  <span style={{ fontWeight: 700 }}>{JOKE_LINE.slice(0, j)}</span>
                </>
              )}
              <span style={{ position: "relative", display: "inline-block", width: 4, height: 46, marginLeft: 3, background: caret ? theme.fg : "transparent", verticalAlign: "-8px" }}>
                <KeySparks strokes={strokes} />
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                left: 44,
                bottom: 34,
                fontFamily: theme.mono,
                fontSize: 20,
                letterSpacing: "0.12em",
                color: "#5c5b57",
              }}
            >
              {t < SEND_AT ? "+  ATTACH    ◎ AGENT MODE" : "STREAMING…"}
            </div>
            <div
              style={{
                position: "absolute",
                right: 30,
                bottom: 26,
                width: 64,
                height: 64,
                borderRadius: 32,
                background: ready ? theme.fg : "#3a3a3a",
                color: theme.bg,
                fontFamily: theme.sans,
                fontWeight: 800,
                fontSize: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 - press * 0.18})`,
              }}
            >
              ↑
              {t >= SEND_AT && (
                <svg width={2} height={2} style={{ position: "absolute", left: 31, top: 31, overflow: "visible" }}>
                  <circle r={32 + (t - SEND_AT) * 2400} fill="none" stroke="#fff" strokeWidth={Math.max(0, 10 - (t - SEND_AT) * 50)} opacity={Math.max(0, 1 - (t - SEND_AT) * 5)} />
                </svg>
              )}
            </div>
          </div>
          <div style={{ alignSelf: "flex-start", marginTop: 16, marginLeft: 50, fontFamily: theme.mono, fontSize: 20, color: theme.dim, opacity: wink }}>
            ↑ the most important part of any prompt
          </div>
        </div>
      </AbsoluteFill>
      <TokenBurst t={t} at={SEND_AT} />
      <AbsoluteFill style={{ background: "#fff", opacity: t >= SEND_AT && t < SEND_AT + 0.034 ? 0.14 : 0, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
