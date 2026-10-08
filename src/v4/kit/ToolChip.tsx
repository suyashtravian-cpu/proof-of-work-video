import { useCurrentFrame } from "remotion";
import { anchorX, C, clamp01, pop } from "./util";

/**
 * A tool-call receipt beside an action: `deploy(biltib) ✓ 1.2s`.
 * Pops in at `at`, spins for `resolve` seconds, then lands the check (or ✗ with status="fail").
 */
export const ToolChip: React.FC<{
  at: number;
  x: number;
  y: number;
  name: string;
  arg?: string;
  took?: string;
  resolve?: number;
  out?: number;
  anchor?: "l" | "c" | "r";
  size?: number;
  status?: "ok" | "fail";
}> = ({ at, x, y, name, arg, took, resolve = 0.22, out = Infinity, anchor = "l", size = 22, status = "ok" }) => {
  const t = useCurrentFrame() / 30;
  if (t < at || t > out + 0.15) return null;
  const k = pop(t, at, 0.2);
  const e = out === Infinity ? 0 : clamp01((t - out) / 0.15);
  const done = t >= at + resolve;
  const land = pop(t, at + resolve, 0.18);
  const spin = (t - at) * 720;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${anchorX(anchor)}, -50%) scale(${0.86 + 0.14 * k}) translateY(${e * -10}px)`,
        transformOrigin: anchor === "l" ? "0% 50%" : anchor === "r" ? "100% 50%" : "50% 50%",
        opacity: clamp01(k * 2) * (1 - e),
        display: "flex",
        alignItems: "center",
        gap: size * 0.55,
        padding: `${size * 0.36}px ${size * 0.62}px`,
        borderRadius: size * 0.45,
        background: "rgba(10,10,10,.86)",
        border: `1px solid ${done && status === "ok" ? "rgba(255,255,255,.34)" : "rgba(255,255,255,.2)"}`,
        boxShadow: "0 10px 30px rgba(0,0,0,.5)",
        fontFamily: C.mono,
        fontSize: size,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        color: C.fg,
        pointerEvents: "none",
      }}
    >
      <span>
        {name}(<span style={{ color: C.dim }}>{arg}</span>)
      </span>
      {!done ? (
        <svg width={size * 0.8} height={size * 0.8} viewBox="-10 -10 20 20" style={{ transform: `rotate(${spin}deg)` }}>
          <circle r={7.5} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={3} />
          <path d="M0,-7.5 A7.5,7.5 0 0 1 7.5,0" fill="none" stroke={C.red} strokeWidth={3} strokeLinecap="round" />
        </svg>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.45 }}>
          <span style={{ color: C.red, fontWeight: 700, display: "inline-block", transform: `scale(${0.4 + 0.6 * land})` }}>{status === "ok" ? "✓" : "✗"}</span>
          {took && <span style={{ color: C.dim, opacity: land }}>{took}</span>}
        </span>
      )}
    </div>
  );
};
