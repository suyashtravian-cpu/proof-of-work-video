import { AbsoluteFill, useCurrentFrame } from "remotion";
import { shakeAt } from "../../fx/shake";
import { RecSpans } from "../components/Rec";
import { theme2 } from "../theme";
import { Bokeh, EndBackdrop, Motes, SkyPlate } from "./onemind-cta-end/Backdrop";
import {
  bump,
  camAt,
  camCss,
  camSpeed,
  clamp01,
  eIn,
  eIO,
  eOut,
  eOutBack,
  eOutExpo,
  eWhip,
  lerp,
  prog,
  springAt,
  toScreen,
  type CamKey,
} from "./onemind-cta-end/kit";

// Cta (53.2 to 57.4): out of the orb flash we pull back through the iridescent ring of the
// site's "Have a what if?" section, floating as a 3D card. "So... got a what if?" is typed big.
// On the beat the camera whips to the real headline and its "Let's make something" button;
// "Let's make it real." lands, "real." on the beat with a click. The click ripple opens a
// portal onto the end card's sky.

const LEN = 4.2;
const REC_SPAN: [number, number] = [66.88, 67.92]; // the settled shot (the page scrolls before and after)
const BUTTON: [number, number, number, number] = [403, 782, 587, 823];
const BTN_C: [number, number] = [(BUTTON[0] + BUTTON[2]) / 2, (BUTTON[1] + BUTTON[3]) / 2];

const KEYS: CamKey[] = [
  { t: 0, cx: 1560, cy: 410, s: 5.5, r: 30, fy: 780 },
  { t: 0.64, cx: 975, cy: 540, s: 0.68, r: -3, ry: -22, rx: 7, fy: 690, ease: eOutExpo },
  { t: 2.14, cx: 1000, cy: 540, s: 0.76, r: -1, ry: -10, rx: 4, fy: 690, ease: eIO },
  { t: 2.44, cx: 705, cy: 600, s: 1.52, fy: 860, ease: eWhip },
  { t: 3.3, cx: 705, cy: 608, s: 1.57, fy: 860, ease: eOut },
  { t: 3.72, cx: 702, cy: 614, s: 1.6, fy: 860, ease: (x) => x },
  { t: LEN, cx: 600, cy: 720, s: 2.3, r: 3, fy: 960, ease: eIn },
];

const display: React.CSSProperties = { fontFamily: theme2.display, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 };

type Ch = { c: string; at: number };
const typed = (s: string, times: number[]): Ch[] => [...s].map((c, i) => ({ c, at: times[i] }));
const LINES: { chars: Ch[]; top: number; size: number; color: string }[] = [
  { chars: typed("So...", [0.2, 0.27, 0.42, 0.55, 0.68]), top: 1120, size: 160, color: theme2.paper },
  { chars: typed("got a", [0.92, 0.97, 1.02, 1.06, 1.1]), top: 1290, size: 160, color: theme2.paper },
  { chars: typed("what if?", [1.28, 1.33, 1.38, 1.43, 1.5, 1.6, 1.66, 1.8]), top: 1462, size: 182, color: theme2.lilac },
];
const LAST_TYPED = 1.8;

const WORDS = [
  { w: "Let's", at: 2.4, line: 0 },
  { w: "make", at: 2.62, line: 0 },
  { w: "it", at: 2.86, line: 1 },
  { w: "real.", at: 3.305, line: 1 },
];
const SLAM = 3.305;

/** A small paper pointer that glides onto the real button and clicks it. */
const Cursor: React.FC<{ x: number; y: number; press: number; opacity: number }> = ({ x, y, press, opacity }) => (
  <svg
    width={70}
    height={80}
    viewBox="0 0 28 32"
    style={{ position: "absolute", left: x - 6, top: y - 4, opacity, transform: `scale(${1 - press * 0.18})`, transformOrigin: "6px 4px", overflow: "visible" }}
  >
    <path d="M3 2 L3 25 L9 19.5 L13 29 L17.5 27 L13.5 18 L21.5 18 Z" fill={theme2.paper} stroke={theme2.ink} strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const cam = camAt(t, KEYS);
  const speed = camSpeed(t, KEYS);
  const blur = Math.min(14, Math.max(0, (speed - 16) / 7));
  const [sx, sy, sr] = shakeAt(t, [SLAM], 14, 0.3);

  // Button on screen (the camera has no 3D tilt after the whip).
  const [bx0, by0] = toScreen(cam, BUTTON[0], BUTTON[1]);
  const [bx1, by1] = toScreen(cam, BUTTON[2], BUTTON[3]);
  const [bcx, bcy] = toScreen(cam, BTN_C[0], BTN_C[1]);

  // Typed question leaves with the whip (same direction the footage moves).
  const qOut = eIn(prog(t, 2.12, 2.36));
  // Portal onto the end card.
  const portal = eIn(prog(t, 3.72, LEN));
  const R = portal * 2300;

  // Cursor path.
  const cp = eOut(prog(t, 2.78, 3.2));
  const curX = lerp(1010, bcx + 50, cp);
  const curY = lerp(1300, bcy + 4, cp) + Math.sin(cp * Math.PI) * -60;
  const press = bump(t, 3.24, 0.18) > 0 ? Math.sin(prog(t, 3.24, 3.42) * Math.PI) : 0;

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg)` }}>
        {/* deep plate */}
        <SkyPlate t={t + 60} zoom={1.15 + t * 0.015} opacity={0.5} x={-(cam.cx - 1000) * 0.05} y={-150} />
        <Bokeh t={t} seed="ctab" dx={-(cam.cx - 1000) * 0.2} opacity={0.85} />
        <Motes t={t} seed="ctaback" count={45} dx={-(cam.cx - 1000) * cam.s * 0.25} opacity={0.5} size={0.8} />

        {/* the real footage as a floating 3D card that becomes full frame */}
        <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "540px 900px", filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 1708,
              height: 1080,
              transformOrigin: "0 0",
              transform: camCss(cam),
              borderRadius: 34,
              overflow: "hidden",
              border: "3px solid rgba(228,220,255,.42)",
              boxShadow: "0 60px 140px rgba(3,4,18,.8), 0 0 120px rgba(188,165,238,.35)",
              background: theme2.bg,
            }}
          >
            <RecSpans spans={[REC_SPAN]} durations={[LEN]} />
            {/* keep the phone number in the footer out of the video */}
            <div style={{ position: "absolute", left: 394, top: 864, width: 150, height: 30, background: "rgb(58,40,88)" }} />
            {/* sheen across the card */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(105deg, rgba(255,255,255,0) ${lerp(-30, 130, prog(t, 0.4, 1.6)) - 12}%, rgba(255,255,255,.1) ${lerp(-30, 130, prog(t, 0.4, 1.6))}%, rgba(255,255,255,0) ${lerp(-30, 130, prog(t, 0.4, 1.6)) + 12}%)`,
              }}
            />
          </div>
        </AbsoluteFill>

        {/* button callout + click ripple (after the whip) */}
        {t > 2.9 && (
          <>
            {(() => {
              const k = eOutBack(prog(t, 2.92, 3.15));
              const pad = 14;
              const glow = 0.5 + bump(t, SLAM, 0.5);
              return (
                <div
                  style={{
                    position: "absolute",
                    left: bx0 - pad,
                    top: by0 - pad,
                    width: bx1 - bx0 + pad * 2,
                    height: by1 - by0 + pad * 2,
                    borderRadius: 999,
                    border: `3px solid ${theme2.lilacSoft}`,
                    boxShadow: `0 0 ${40 + glow * 50}px rgba(188,165,238,${0.5 * glow + 0.2})`,
                    transform: `scale(${1.25 - 0.25 * k})`,
                    opacity: clamp01(k) * (1 - portal),
                  }}
                />
              );
            })()}
            {[0, 0.12, 0.24].map((d) => {
              const p = prog(t, SLAM + d, SLAM + d + 0.6);
              if (p <= 0 || p >= 1) return null;
              const rr = 40 + eOut(p) * 420;
              return (
                <div
                  key={d}
                  style={{
                    position: "absolute",
                    left: bcx - rr,
                    top: bcy - rr,
                    width: rr * 2,
                    height: rr * 2,
                    borderRadius: "50%",
                    border: `${4 * (1 - p) + 1}px solid ${theme2.lilacSoft}`,
                    opacity: (1 - p) * 0.85,
                  }}
                />
              );
            })}
          </>
        )}

        {/* bottom scrim for the kinetic type */}
        <AbsoluteFill
          style={{
            opacity: 0.4 + 0.6 * prog(t, 2.2, 2.5),
            background: "linear-gradient(0deg, rgba(9,13,37,.96) 0px, rgba(9,13,37,.82) 380px, rgba(9,13,37,.35) 600px, rgba(9,13,37,0) 760px)",
          }}
        />

        {/* "So... got a what if?" typed big */}
        <AbsoluteFill
          style={{
            transform: `translateX(${qOut * 620}px) skewX(${-qOut * 12}deg)`,
            opacity: 1 - qOut,
            filter: qOut > 0.05 ? `blur(${(qOut * 10).toFixed(1)}px)` : undefined,
          }}
        >
          {LINES.map((ln, li) => {
            const started = t >= ln.chars[0].at;
            if (!started) return null;
            const last = ln.chars.filter((c) => t >= c.at).pop()!;
            const nextLineStarted = li < LINES.length - 1 && t >= LINES[li + 1].chars[0].at;
            const typing = t - last.at < 0.3;
            const caretOn = !nextLineStarted && (typing || Math.floor(t * 4) % 2 === 0);
            return (
              <div
                key={li}
                style={{ ...display, position: "absolute", left: 84, top: ln.top, fontSize: ln.size, color: ln.color, whiteSpace: "pre", display: "flex", alignItems: "flex-end" }}
              >
                {ln.chars.map((c, ci) => {
                  if (t < c.at) return null;
                  const k = eOutBack(prog(t, c.at, c.at + 0.16));
                  const q = c.c === "?" ? bump(t, c.at, 0.5) : 0;
                  return (
                    <span
                      key={ci}
                      style={{
                        display: "inline-block",
                        transform: `translateY(${(1 - k) * 28}px) scale(${0.6 + 0.4 * k + q * 0.25})`,
                        transformOrigin: "50% 90%",
                        opacity: clamp01(k * 3),
                        textShadow:
                          ln.color === theme2.lilac
                            ? `0 0 ${40 + q * 60}px rgba(188,165,238,${0.55 + q * 0.4}), 0 10px 40px rgba(3,4,18,.8)`
                            : "0 0 40px rgba(188,165,238,.35), 0 10px 40px rgba(3,4,18,.8)",
                      }}
                    >
                      {c.c}
                    </span>
                  );
                })}
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: ln.size * 0.74,
                    marginLeft: 10,
                    marginBottom: ln.size * 0.06,
                    borderRadius: 4,
                    background: theme2.lilac,
                    boxShadow: "0 0 24px rgba(188,165,238,.8)",
                    opacity: caretOn ? 1 : 0,
                  }}
                />
              </div>
            );
          })}
        </AbsoluteFill>

        {/* "Let's make it real." */}
        <AbsoluteFill>
          {[0, 1].map((line) => (
            <div
              key={line}
              style={{
                ...display,
                position: "absolute",
                left: 74,
                top: line === 0 ? 1330 : 1490,
                fontSize: line === 0 ? 156 : 184,
                display: "flex",
                gap: line === 0 ? 38 : 44,
                perspective: 900,
              }}
            >
              {WORDS.filter((w) => w.line === line).map((w) => {
                if (t < w.at - 0.02) return null;
                const isReal = w.w === "real.";
                if (isReal) {
                  const k = eOutExpo(prog(t, w.at, w.at + 0.24));
                  const g = bump(t, w.at, 0.8);
                  return (
                    <span
                      key={w.w}
                      style={{
                        display: "inline-block",
                        color: theme2.lilac,
                        transform: `scale(${2.3 - 1.3 * k})`,
                        transformOrigin: "30% 70%",
                        opacity: clamp01(k * 2.5),
                        textShadow: `0 0 ${50 + g * 90}px rgba(188,165,238,${0.6 + g * 0.4}), 0 10px 40px rgba(3,4,18,.85)`,
                      }}
                    >
                      {w.w}
                    </span>
                  );
                }
                const sp = springAt(t, w.at, 12, 8);
                return (
                  <span
                    key={w.w}
                    style={{
                      display: "inline-block",
                      color: theme2.paper,
                      transform: `translateY(${(1 - Math.min(1, sp)) * 70}px) rotateX(${(1 - Math.min(1, sp)) * -75}deg)`,
                      transformOrigin: "50% 100%",
                      opacity: clamp01(sp * 2.5),
                      textShadow: "0 0 40px rgba(188,165,238,.35), 0 10px 40px rgba(3,4,18,.85)",
                    }}
                  >
                    {w.w}
                  </span>
                );
              })}
            </div>
          ))}
        </AbsoluteFill>

        {/* the pointer */}
        {t > 2.78 && t < 3.9 && <Cursor x={curX} y={curY} press={press} opacity={clamp01(prog(t, 2.78, 2.9)) * (1 - prog(t, 3.6, 3.8))} />}

        {/* flash on "real." */}
        <AbsoluteFill style={{ background: theme2.lilacSoft, mixBlendMode: "screen", opacity: bump(t, SLAM, 0.25) * 0.35 }} />
      </AbsoluteFill>

      {/* entry: the orb flash from OneMind fades off the ring */}
      <AbsoluteFill
        style={{
          opacity: 1 - eOut(prog(t, 0, 0.42)),
          background: "radial-gradient(circle at 540px 780px, #f8f7f3 0%, #e4dcff 30%, #bca5ee 62%, #6f5cc0 100%)",
        }}
      />

      {/* portal from the clicked button onto the end card */}
      {R > 1 && (
        <>
          <AbsoluteFill style={{ clipPath: `circle(${R}px at ${bcx}px ${bcy}px)` }}>
            <EndBackdrop t={t - LEN} />
          </AbsoluteFill>
          <div
            style={{
              position: "absolute",
              left: bcx - R,
              top: bcy - R,
              width: R * 2,
              height: R * 2,
              borderRadius: "50%",
              background: `conic-gradient(from ${t * 160}deg, #bca5ee, #f8f7f3, #a9dcff, #e4dcff, #8f73e6, #f1d2ff, #bca5ee)`,
              WebkitMaskImage: "radial-gradient(farthest-side, transparent calc(100% - 18px), #000 calc(100% - 16px), #000 calc(100% - 2px), transparent 100%)",
              maskImage: "radial-gradient(farthest-side, transparent calc(100% - 18px), #000 calc(100% - 16px), #000 calc(100% - 2px), transparent 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: bcx - R,
              top: bcy - R,
              width: R * 2,
              height: R * 2,
              borderRadius: "50%",
              boxShadow: "0 0 70px 14px rgba(188,165,238,.55), inset 0 0 60px 8px rgba(228,220,255,.45)",
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
};
