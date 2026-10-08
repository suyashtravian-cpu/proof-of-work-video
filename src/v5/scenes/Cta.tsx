import { AbsoluteFill, useCurrentFrame } from "remotion";
import { RecSpans } from "../../v2/components/Rec";
import { theme2 } from "../../v2/theme";
import { Bokeh, EndBackdrop, Motes, SkyPlate } from "../../v2/scenes/onemind-cta-end/Backdrop";
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
  lerp,
  prog,
  toScreen,
  type CamKey,
} from "../../v2/scenes/onemind-cta-end/kit";
import { END_AT, L, LINES, S } from "../timing";

const S_END = S.end[0];

// END, part 1 (28.95 to 30.35): video 2's Cta. Out of the orb flash we pull back through the
// iridescent ring of the site's "Have a what if?" section, floating as a 3D card, while "See what /
// I can build / for you." is typed big, each word as it is spoken. Then the ring opens as a portal
// onto the end card's sky. The line is kinetic (typed here, no caption).

const LEN = END_AT;
const REC_SPAN: [number, number] = [66.88, 67.92]; // the settled shot (the page scrolls before and after)
const RING: [number, number] = [1560, 410]; // the site's chrome ring (rec px)
const PORTAL_A = LEN - 0.42;

const KEYS: CamKey[] = [
  { t: 0, cx: 1560, cy: 410, s: 5.5, r: 30, fy: 700 },
  { t: 0.64, cx: 975, cy: 540, s: 0.68, r: -3, ry: -22, rx: 7, fy: 640, ease: eOutExpo },
  { t: PORTAL_A, cx: 990, cy: 540, s: 0.72, r: -1.5, ry: -15, rx: 5, fy: 640, ease: eIO },
  { t: LEN, cx: 1300, cy: 470, s: 1.25, r: 4, ry: -8, rx: 3, fy: 600, ease: eIn },
];

const display: React.CSSProperties = { fontFamily: theme2.display, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 };

/** Each word types its letters across its own spoken span. */
type Ch = { c: string; at: number };
const SEE = LINES[L.see].words.map((x) => ({ ...x, s: x.s - S_END, e: x.e - S_END }));
const typeWords = (from: number, to: number): Ch[] => {
  const out: Ch[] = [];
  SEE.slice(from, to).forEach((x, i) => {
    if (i > 0) out.push({ c: " ", at: x.s });
    const n = x.w.length;
    const span = Math.min(0.22, Math.max(0.08, x.e - x.s));
    [...x.w].forEach((c, j) => out.push({ c, at: +(x.s + (span * j) / n).toFixed(3) }));
  });
  return out;
};
const TYPED: { chars: Ch[]; top: number; size: number; color: string }[] = [
  { chars: typeWords(0, 2), top: 1036, size: 150, color: theme2.paper }, // See what
  { chars: typeWords(2, 5), top: 1186, size: 150, color: theme2.paper }, // I can build
  { chars: typeWords(5, 7), top: 1336, size: 160, color: theme2.lilac }, // for you.
];

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const cam = camAt(t, KEYS);
  const speed = camSpeed(t, KEYS);
  const blur = Math.min(14, Math.max(0, (speed - 16) / 7));

  // Portal from the ring onto the end card.
  const [rx0, ry0] = toScreen(cam, RING[0], RING[1]);
  const portal = eIn(prog(t, PORTAL_A, LEN));
  const R = portal * 2300;
  const pcx = lerp(rx0, 540, portal * 0.5);
  const pcy = lerp(ry0, 700, portal * 0.5);
  const ringGlow = bump(t, PORTAL_A - 0.18, 0.5);

  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      {/* deep plate */}
      <SkyPlate t={t + 60} zoom={1.15 + t * 0.015} opacity={0.5} x={-(cam.cx - 1000) * 0.05} y={-150} />
      <Bokeh t={t} seed="ctab" dx={-(cam.cx - 1000) * 0.2} opacity={0.85} />
      <Motes t={t} seed="ctaback" count={45} dx={-(cam.cx - 1000) * cam.s * 0.25} opacity={0.5} size={0.8} />

      {/* the real footage as a floating 3D card */}
      <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "540px 760px", filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
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
          {/* the ring charges up before it opens */}
          {ringGlow > 0.01 && (
            <div
              style={{
                position: "absolute",
                left: RING[0] - 260,
                top: RING[1] - 260,
                width: 520,
                height: 520,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(228,220,255,${0.7 * ringGlow}), rgba(188,165,238,${0.3 * ringGlow}) 45%, rgba(188,165,238,0) 70%)`,
                mixBlendMode: "screen",
              }}
            />
          )}
          {/* sheen across the card */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(105deg, rgba(255,255,255,0) ${lerp(-30, 130, prog(t, 0.3, 1.2)) - 12}%, rgba(255,255,255,.1) ${lerp(-30, 130, prog(t, 0.3, 1.2))}%, rgba(255,255,255,0) ${lerp(-30, 130, prog(t, 0.3, 1.2)) + 12}%)`,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* bottom scrim for the kinetic type */}
      <AbsoluteFill
        style={{
          opacity: 0.5 + 0.5 * prog(t, 0.05, 0.3),
          background: "linear-gradient(0deg, rgba(9,13,37,.96) 0px, rgba(9,13,37,.86) 520px, rgba(9,13,37,.35) 820px, rgba(9,13,37,0) 960px)",
        }}
      />

      {/* "See what / I can build / for you." typed big */}
      <AbsoluteFill>
        {TYPED.map((ln, li) => {
          const started = t >= ln.chars[0].at;
          if (!started) return null;
          const last = ln.chars.filter((c) => t >= c.at).pop()!;
          const nextLineStarted = li < TYPED.length - 1 && t >= TYPED[li + 1].chars[0].at;
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
                const q = c.c === "." ? bump(t, c.at, 0.5) : 0;
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

      {/* entry: the orb flash from the payoff fades off the ring */}
      <AbsoluteFill
        style={{
          opacity: 1 - eOut(prog(t, 0, 0.42)),
          background: "radial-gradient(circle at 540px 700px, #f8f7f3 0%, #e4dcff 30%, #bca5ee 62%, #6f5cc0 100%)",
        }}
      />

      {/* portal from the ring onto the end card */}
      {R > 1 && (
        <>
          <AbsoluteFill style={{ clipPath: `circle(${R}px at ${pcx}px ${pcy}px)` }}>
            <EndBackdrop t={t - LEN} />
          </AbsoluteFill>
          <div
            style={{
              position: "absolute",
              left: pcx - R,
              top: pcy - R,
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
              left: pcx - R,
              top: pcy - R,
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
