import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme2 } from "../theme";
import { EndBackdrop, LightSweep } from "./onemind-cta-end/Backdrop";
import { beatsBetween, bump, clamp01, eOut, eOutBack, eOutExpo, prog, springAt } from "./onemind-cta-end/kit";

// End (57.4 to 61.0): we arrive through the portal into the site's sky. Name, title and a
// pulsing URL pill; everything keeps drifting and breathing on the beat to the last frame.

const BEATS = beatsBetween(57.4, 61.0, 57.4); // 0.131, 0.644, 1.157, 1.670, 2.183, 2.696, 3.209

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
  const k = eOutExpo(prog(t, 0.05, 1.1));
  const size = 1040;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - size / 2,
        top: 760 - size / 2,
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

export const End: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const beat = BEATS.filter((b) => b > 1.4).reduce((n, b) => Math.max(n, bump(t, b, 0.42)), 0);
  const pill = springAt(t, 1.157, 12, 7);
  const float = Math.sin(t * 1.6) * 8;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <EndBackdrop t={t} />

      {/* soft lilac bloom behind the type */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 30% at 50% 44%, rgba(188,165,238,.22), rgba(188,165,238,0) 70%)", opacity: 0.6 + beat * 0.4 }} />

      <Halo t={t} />

      {/* label */}
      <div
        style={{
          position: "absolute",
          top: 492,
          left: 0,
          width: 1080,
          textAlign: "center",
          fontFamily: theme2.sans,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: `${0.34 + (1 - eOut(prog(t, 0.25, 1.0))) * 0.4}em`,
          color: theme2.lilac,
          opacity: prog(t, 0.25, 0.6) * 0.95,
        }}
      >
        IDEAS DON'T SIT STILL.
      </div>

      {/* name */}
      <div style={{ position: "absolute", top: 560 + float, left: 0, width: 1080 }}>
        <Rise
          text="Suyash"
          t={t}
          at={0.131}
          style={{ ...display, fontSize: 212, color: theme2.paper, textShadow: "0 0 60px rgba(188,165,238,.5), 0 14px 50px rgba(3,4,18,.8)" }}
        />
        <Rise
          text="Kashyap"
          t={t}
          at={0.3}
          style={{ ...display, fontSize: 212, color: theme2.paper, marginTop: -6, textShadow: "0 0 60px rgba(188,165,238,.5), 0 14px 50px rgba(3,4,18,.8)" }}
        />
      </div>

      {/* title */}
      <div
        style={{
          position: "absolute",
          top: 1040 + float * 0.6,
          left: 0,
          width: 1080,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          fontFamily: theme2.sans,
          fontWeight: 700,
          fontSize: 46,
          letterSpacing: "-0.01em",
          color: theme2.lilacSoft,
        }}
      >
        {(
          [
            ["AI creator.", 0.644],
            ["Independent builder.", 0.86],
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

      {/* URL pill */}
      <div style={{ position: "absolute", top: 1236 + float * 0.4, left: 540, width: 0, height: 0 }}>
        {/* beat rings */}
        {BEATS.filter((b) => b > 1.4).map((b) => {
          const p = prog(t, b, b + 0.8);
          if (p <= 0 || p >= 1) return null;
          return (
            <div
              key={b}
              style={{
                position: "absolute",
                left: -410,
                top: -56,
                width: 820,
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
            transform: `translate(-50%, -50%) scale(${Math.min(1.15, pill) * (1 + beat * 0.035)})`,
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
          <span style={{ fontFamily: theme2.display, fontWeight: 700, fontSize: 50, letterSpacing: "-0.02em", color: theme2.ink }}>pilotaccess.com/suyashpow</span>
          <span style={{ width: 70, height: 70, borderRadius: 35, background: theme2.lilac, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Arrow />
          </span>
          {/* glint */}
          {[1.35, 2.75].map((at) => {
            const p = prog(t, at, at + 0.6);
            if (p <= 0 || p >= 1) return null;
            return (
              <div
                key={at}
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

      <LightSweep t={t} at={2.1} dur={0.9} opacity={0.28} />
      {/* arrival flash out of the portal */}
      <AbsoluteFill style={{ background: theme2.lilacSoft, mixBlendMode: "screen", opacity: (1 - prog(t, 0, 0.25)) * 0.3 }} />
    </AbsoluteFill>
  );
};
