import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme2 } from "../../v2/theme";
import { EndBackdrop, LightSweep } from "../../v2/scenes/onemind-cta-end/Backdrop";
import { bump, clamp01, eOut, eOutBack, eOutExpo, prog, springAt } from "../../v2/scenes/onemind-cta-end/kit";
import { END_AT, L, S, word } from "../timing";

// END, part 2 (30.35 to 33.2): video 2's end card. We arrive through the portal into the site's sky:
// name, title, a pulsing "See what I can build ↗" pill, the real URL, and "Tap the link ↓" landing
// on "Tap" (the arrow points at Meta's own button below the video). Everything keeps drifting and
// breathing to the last frame. Layout stays inside Meta's safe zone (y 270 to 1530).

const AT = S.end[0] + END_AT; // video second this Sequence starts
const T_TAP = word(L.tap, "tap") - AT;
/** A slow breathing pulse for the pill (no music, so a steady 0.6 s cycle from the moment it lands). */
const PULSES = Array.from({ length: 6 }, (_, i) => +(0.62 + i * 0.6).toFixed(2));

const display: React.CSSProperties = { fontFamily: theme2.display, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 };

const Rise: React.FC<{ text: string; t: number; at: number; stagger?: number; style?: React.CSSProperties }> = ({ text, t, at, stagger = 0.035, style }) => (
  <div style={{ display: "flex", justifyContent: "center", ...style }}>
    {[...text].map((ch, i) => {
      const sp = springAt(t, at + i * stagger, 11, 7.5);
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            transform: `translateY(${(1 - Math.min(1.2, sp)) * 130}px) rotate(${(1 - Math.min(1, sp)) * (i % 2 ? 9 : -9)}deg) scale(${0.7 + 0.3 * Math.min(1, sp)})`,
            transformOrigin: "50% 100%",
            opacity: clamp01(sp * 2.2),
          }}
        >
          {ch}
        </span>
      );
    })}
  </div>
);

/** The site's iridescent chrome ring, as a tilted orbit behind the name. */
const Halo: React.FC<{ t: number }> = ({ t }) => {
  const k = eOutExpo(prog(t, -0.1, 0.9));
  const size = 1000;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - size / 2,
        top: 600 - size / 2,
        width: size,
        height: size,
        transform: `perspective(1600px) rotateX(${72 - Math.sin(t * 0.8) * 3}deg) rotateY(${-14 + Math.sin(t * 0.6) * 4}deg) rotateZ(${t * 24}deg) scale(${0.55 + 0.45 * k})`,
        opacity: k * 0.95,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `conic-gradient(from ${t * 90}deg, #bca5ee, #f8f7f3 12%, #a9dcff 20%, #e4dcff 30%, #8f73e6 45%, #f1d2ff 58%, #bca5ee 70%, #6f5cc0 85%, #bca5ee)`,
          WebkitMaskImage: "radial-gradient(farthest-side, transparent calc(100% - 26px), #000 calc(100% - 20px), #000 calc(100% - 6px), transparent 100%)",
          maskImage: "radial-gradient(farthest-side, transparent calc(100% - 26px), #000 calc(100% - 20px), #000 calc(100% - 6px), transparent 100%)",
        }}
      />
      <div style={{ position: "absolute", inset: 10, borderRadius: "50%", boxShadow: "0 0 60px 6px rgba(188,165,238,.45), inset 0 0 50px 4px rgba(188,165,238,.35)" }} />
    </div>
  );
};

const Arrow: React.FC = () => (
  <svg width={30} height={30} viewBox="0 0 24 24">
    <path d="M6 18 L18 6 M8 6 H18 V16" fill="none" stroke={theme2.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Down: React.FC<{ color: string }> = ({ color }) => (
  <svg width={46} height={56} viewBox="0 0 24 30">
    <path d="M12 3 V25 M4 17 L12 25 L20 17" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const End: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const PILL_AT = 0.42;
  const beat = PULSES.reduce((n, b) => Math.max(n, bump(t, b, 0.42)), 0);
  const pill = springAt(t, PILL_AT, 12, 7);
  const float = Math.sin(t * 1.6) * 8;
  const tap = springAt(t, T_TAP - 0.03, 12, 7);
  const bob = t > T_TAP + 0.4 ? Math.abs(Math.sin((t - T_TAP - 0.4) * 4.2)) * 16 : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <EndBackdrop t={t} />

      {/* soft lilac bloom behind the type */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 30% at 50% 40%, rgba(188,165,238,.22), rgba(188,165,238,0) 70%)", opacity: 0.6 + beat * 0.4 }} />

      <Halo t={t} />

      {/* label */}
      <div
        style={{
          position: "absolute",
          top: 398,
          left: 0,
          width: 1080,
          textAlign: "center",
          fontFamily: theme2.sans,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: `${0.34 + (1 - eOut(prog(t, 0.1, 0.8))) * 0.4}em`,
          color: theme2.lilac,
          opacity: prog(t, 0.1, 0.45) * 0.95,
        }}
      >
        IDEAS DON'T SIT STILL.
      </div>

      {/* name */}
      <div style={{ position: "absolute", top: 462 + float, left: 0, width: 1080 }}>
        <Rise
          text="Suyash"
          t={t}
          at={0}
          style={{ ...display, fontSize: 200, color: theme2.paper, textShadow: "0 0 60px rgba(188,165,238,.5), 0 14px 50px rgba(3,4,18,.8)" }}
        />
        <Rise
          text="Kashyap"
          t={t}
          at={0.14}
          style={{ ...display, fontSize: 200, color: theme2.paper, marginTop: -6, textShadow: "0 0 60px rgba(188,165,238,.5), 0 14px 50px rgba(3,4,18,.8)" }}
        />
      </div>

      {/* title */}
      <div
        style={{
          position: "absolute",
          top: 880 + float * 0.6,
          left: 0,
          width: 1080,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          fontFamily: theme2.sans,
          fontWeight: 700,
          fontSize: 42,
          letterSpacing: "-0.01em",
          color: theme2.lilacSoft,
        }}
      >
        {(
          [
            ["AI creator.", 0.3],
            ["Independent builder.", 0.42],
          ] as const
        ).map(([s, at]) => {
          const k = eOutBack(prog(t, at, at + 0.4));
          return (
            <span key={s} style={{ display: "inline-block", transform: `translateY(${(1 - k) * 40}px)`, opacity: clamp01(k * 2), textShadow: "0 4px 24px rgba(3,4,18,.8)" }}>
              {s}
            </span>
          );
        })}
      </div>

      {/* "See what I can build ↗" pill */}
      <div style={{ position: "absolute", top: 1062 + float * 0.4, left: 540, width: 0, height: 0 }}>
        {/* pulse rings */}
        {PULSES.map((b) => {
          const p = prog(t, b, b + 0.8);
          if (p <= 0 || p >= 1) return null;
          return (
            <div
              key={b}
              style={{
                position: "absolute",
                left: -330,
                top: -56,
                width: 660,
                height: 112,
                borderRadius: 999,
                border: `${3 * (1 - p) + 1}px solid ${theme2.lilacSoft}`,
                transform: `scale(${1 + eOut(p) * 0.3}, ${1 + eOut(p) * 0.9})`,
                opacity: (1 - p) * 0.75,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) scale(${Math.min(1.15, pill) * (1 + beat * 0.04)})`,
            opacity: clamp01(pill * 2.5),
            display: "flex",
            alignItems: "center",
            gap: 22,
            whiteSpace: "nowrap",
            padding: "20px 22px 20px 46px",
            borderRadius: 999,
            background: theme2.paper,
            overflow: "hidden",
            boxShadow: `0 24px 60px rgba(3,4,18,.55), 0 0 ${50 + beat * 60}px rgba(188,165,238,${0.45 + beat * 0.35})`,
          }}
        >
          <span style={{ fontFamily: theme2.display, fontWeight: 800, fontSize: 54, letterSpacing: "-0.025em", color: theme2.ink }}>See what I can build</span>
          <span style={{ width: 72, height: 72, borderRadius: 36, background: theme2.lilac, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Arrow />
          </span>
          {/* glint */}
          {[0.9, 2.1].map((a) => {
            const p = prog(t, a, a + 0.6);
            if (p <= 0 || p >= 1) return null;
            return (
              <div
                key={a}
                style={{
                  position: "absolute",
                  top: -20,
                  bottom: -20,
                  left: `${-30 + eOut(p) * 160}%`,
                  width: 120,
                  transform: "skewX(-20deg)",
                  background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.85), rgba(255,255,255,0))",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* the real URL */}
      <div
        style={{
          position: "absolute",
          top: 1150 + float * 0.4,
          left: 0,
          width: 1080,
          textAlign: "center",
          fontFamily: theme2.display,
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: "-0.01em",
          color: theme2.lilacSoft,
          opacity: prog(t, 0.6, 0.85),
          transform: `translateY(${(1 - eOut(prog(t, 0.6, 0.95))) * 24}px)`,
          textShadow: "0 4px 24px rgba(3,4,18,.85)",
        }}
      >
        pilotaccess.com/suyashpow
      </div>

      {/* "Tap the link ↓" lands on "Tap" */}
      <div
        style={{
          position: "absolute",
          top: 1282,
          left: 0,
          width: 1080,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 22,
          opacity: clamp01(tap * 2.5),
          transform: `translateY(${(1 - Math.min(1, tap)) * 70}px) scale(${0.7 + 0.3 * Math.min(1.1, tap)})`,
        }}
      >
        <span style={{ ...display, fontSize: 92, color: theme2.lilac, textShadow: `0 0 ${40 + bump(t, T_TAP, 0.6) * 60}px rgba(188,165,238,.7), 0 10px 40px rgba(3,4,18,.85)` }}>
          Tap the link
        </span>
        <span style={{ display: "inline-block", transform: `translateY(${bob}px)`, filter: "drop-shadow(0 0 14px rgba(188,165,238,.8))" }}>
          <Down color={theme2.lilac} />
        </span>
      </div>

      <LightSweep t={t} at={1.3} dur={0.9} opacity={0.28} />
      {/* arrival flash out of the portal */}
      <AbsoluteFill style={{ background: theme2.lilacSoft, mixBlendMode: "screen", opacity: (1 - prog(t, 0, 0.25)) * 0.3 }} />
    </AbsoluteFill>
  );
};
