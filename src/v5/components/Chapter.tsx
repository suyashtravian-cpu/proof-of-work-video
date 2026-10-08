import { useCurrentFrame } from "remotion";
import { clamp01, ease, prog, springAt } from "../../v2/scenes/campaigns-lab/kit";
import { theme2 } from "../../v2/theme";

/**
 * The small "1/4" chapter label (top left, inside Meta's safe zone): a glass pill in video 2's tag
 * style with a four-step meter. It springs in on the spoken number and leaves just before the cut.
 * `at` / `out` are seconds relative to the hosting Sequence.
 */
export const Chapter: React.FC<{ n: number; at: number; out: number }> = ({ n, at, out }) => {
  const t = useCurrentFrame() / 30;
  if (t < at - 0.02) return null;
  const k = springAt(t, at, 10, 0.5, 190);
  const ko = prog(t, out, out + 0.2, ease.in);
  if (ko >= 1) return null;
  const glow = Math.max(0, 1 - (t - at) / 0.6);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 288,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "8px 24px 8px 22px",
        borderRadius: 999,
        background: "rgba(20,20,54,.74)",
        border: "1.5px solid rgba(188,165,238,.6)",
        boxShadow: `0 16px 40px rgba(3,4,18,.5), 0 0 ${26 + 40 * glow}px rgba(188,165,238,${0.25 + 0.35 * glow})`,
        transform: `translateY(${(1 - k) * 30 - ko * 40}px) scale(${0.65 + 0.35 * k})`,
        transformOrigin: "0% 50%",
        opacity: clamp01(k * 2) * (1 - ko),
        clipPath: `inset(-30px ${(1 - prog(t, at, at + 0.3, ease.expo)) * 100}% -30px -30px round 999px)`,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: theme2.display, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
        <span style={{ fontSize: 46, color: theme2.paper, textShadow: `0 0 ${18 * glow}px rgba(228,220,255,.8)` }}>{n}</span>
        <span style={{ fontSize: 30, color: theme2.lilac, marginLeft: 2 }}>/4</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4].map((i) => {
          const on = i < n ? 1 : i === n ? prog(t, at + 0.08, at + 0.4, ease.out) : 0;
          return (
            <div key={i} style={{ position: "relative", width: 34, height: 6, borderRadius: 3, background: "rgba(228,220,255,.18)", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${on * 100}%`,
                  borderRadius: 3,
                  background: theme2.lilac,
                  boxShadow: `0 0 10px ${theme2.lilac}`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
