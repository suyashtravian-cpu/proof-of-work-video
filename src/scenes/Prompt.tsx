import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeExpo, easeInOut, tween } from "../components/anim";
import { theme } from "../theme";

export const PROMPT =
  "Build me a proof-of-work website. My products, my experiments, my campaigns. Real evidence, not a résumé.";
export const JOKE_LINE = "Make no mistakes.";
const TYPE_FROM = 0.25;
const TYPE_TO = 1.6;
const JOKE_FROM = 1.95; // after a beat of caret blinking
const JOKE_TO = 2.8; // typed slowly, one deliberate key at a time
const SEND_AT = 3.03;

// 13.0–16.2  "So I opened ChatGPT... Make no mistakes."
// Neutral composer (no third-party branding). The camera punches in on the
// joke line, holds in silence, then whips back out on send.
export const Prompt: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const enter = tween(t, 0, 0.3, 0, 1, easeExpo);
  const n = Math.round(tween(t, TYPE_FROM, TYPE_TO, 0, PROMPT.length, (k) => k));
  const j = Math.round(tween(t, JOKE_FROM, JOKE_TO, 0, JOKE_LINE.length, (k) => k));
  const zoomIn = tween(t, JOKE_FROM - 0.05, JOKE_FROM + 0.3, 0, 1, easeExpo);
  const zoomOut = tween(t, SEND_AT, SEND_AT + 0.16, 0, 1, easeInOut);
  const zoom = 1 + 0.85 * zoomIn * (1 - zoomOut);
  const press = t >= SEND_AT ? Math.max(0, 1 - (t - SEND_AT) / 0.15) : 0;
  const caret = Math.floor(t * 2.5) % 2 === 0 && t < SEND_AT;
  const wink = tween(t, JOKE_TO + 0.05, JOKE_TO + 0.2, 0, 1) * (1 - zoomOut);
  const ready = n === PROMPT.length;
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${zoom})`,
          transformOrigin: "96px 1000px",
        }}
      >
        <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 60}px)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: theme.mono, fontSize: 24, letterSpacing: "0.2em", color: theme.dim, marginBottom: 28 }}>ONE PROMPT</div>
          <div
            style={{
              width: 940,
              borderRadius: 40,
              background: "#151515",
              border: "1.5px solid #ffffff1f",
              padding: "40px 44px 104px",
              boxSizing: "border-box",
              position: "relative",
              boxShadow: "0 40px 120px rgba(0,0,0,.6)",
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
              <span style={{ display: "inline-block", width: 4, height: 46, marginLeft: 3, background: caret ? theme.fg : "transparent", verticalAlign: "-8px" }} />
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
            </div>
          </div>
          <div style={{ alignSelf: "flex-start", marginTop: 16, marginLeft: 50, fontFamily: theme.mono, fontSize: 20, color: theme.dim, opacity: wink }}>
            ↑ the most important part of any prompt
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
