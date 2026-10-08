import { AbsoluteFill, random } from "remotion";
import { theme2 } from "../../theme";
import { IriRing, easeOutCubic, easeOutExpo, prog } from "./kit";

/** The drop: white flash, light rays, a particle burst and two iridescent shock rings. */
export const DropBurst: React.FC<{ t: number; cx: number; cy: number }> = ({ t, cx, cy }) => {
  if (t > 1.4) return null;
  const flash = 1 - easeOutCubic(prog(t, 0, 0.42));
  const rayK = easeOutExpo(prog(t, 0, 0.55));
  const rayFade = 1 - prog(t, 0.08, 0.62);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* rays */}
      {rayFade > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
          {Array.from({ length: 34 }, (_, i) => {
            const a = (i / 34) * Math.PI * 2 + random(`ra${i}`) * 0.12;
            const len = (420 + random(`rl${i}`) * 1300) * rayK;
            const r0 = len * 0.32;
            const w = 2 + random(`rw${i}`) * 5;
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * r0}
                y1={cy + Math.sin(a) * r0}
                x2={cx + Math.cos(a) * len}
                y2={cy + Math.sin(a) * len}
                stroke={i % 3 === 0 ? "#ffffff" : theme2.lilacSoft}
                strokeWidth={w}
                strokeLinecap="round"
                opacity={rayFade * (0.35 + 0.5 * random(`ro${i}`))}
              />
            );
          })}
        </svg>
      )}
      {/* sparks */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 90 }, (_, i) => {
          const a = random(`pa${i}`) * Math.PI * 2;
          const v = 500 + random(`pv${i}`) * 1700;
          const tau = Math.max(0, t - random(`pd${i}`) * 0.06);
          const d = (v * (1 - Math.exp(-3.6 * tau))) / 3.6;
          const fade = 1 - prog(tau, 0.2, 1.1 + random(`pf${i}`) * 0.25);
          const r = 1.5 + random(`pr${i}`) * 4.5;
          return (
            <circle
              key={i}
              cx={cx + Math.cos(a) * d}
              cy={cy + Math.sin(a) * d + tau * tau * 90}
              r={r * (1 - 0.5 * prog(tau, 0, 1.2))}
              fill={i % 4 === 0 ? "#a6e3ee" : i % 2 ? theme2.lilacSoft : theme2.lilac}
              opacity={Math.max(0, fade)}
            />
          );
        })}
      </svg>
      {/* shock rings */}
      {[0, 0.09].map((d, i) => {
        const k = easeOutCubic(prog(t, d, d + 0.8));
        const size = 140 + k * (i ? 1500 : 2300);
        const op = (1 - k) * (i ? 0.7 : 1);
        if (op <= 0.01) return null;
        return (
          <IriRing
            key={i}
            size={size}
            thickness={Math.max(5, 46 * (1 - k))}
            rotate={t * 220 + i * 90}
            opacity={op}
            style={{ left: cx - size / 2, top: cy - size / 2 }}
          />
        );
      })}
      {/* flash */}
      <AbsoluteFill
        style={{
          opacity: flash,
          background: `radial-gradient(circle at ${cx}px ${cy}px, #ffffff 0%, #f6f2ff 35%, ${theme2.lilacSoft} 75%, ${theme2.lilac} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
