import { random, useCurrentFrame } from "remotion";
import { anchorX, C, clamp01, easeExpo, pop, prog } from "./util";

/** Digits roll through random values and lock left to right; symbols ($ ₹ , . %) stay put. */
export const DecodeNumber: React.FC<{ value: string; at: number; dur?: number; seed?: string; style?: React.CSSProperties }> = ({ value, at, dur = 0.5, seed = value, style }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (t < at) return null;
  const p = clamp01((t - at) / dur);
  const chars = [...value];
  const digits = chars.filter((c) => /[0-9]/.test(c)).length;
  let d = 0;
  const out = chars
    .map((c, i) => {
      if (!/[0-9]/.test(c)) return c;
      d++;
      if (p >= d / digits) return c;
      return String(Math.floor(random(`${seed}-${i}-${Math.floor(f / 1.5)}`) * 10));
    })
    .join("");
  return <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "pre", ...style }}>{out}</span>;
};

/** The red "✓ snapshot · Oct 2026" stamp alone; slams in at `at`. */
export const SnapshotStamp: React.FC<{ at: number; text?: string; size?: number; rotate?: number }> = ({ at, text = "✓ snapshot · Oct 2026", size = 22, rotate = -5 }) => {
  const t = useCurrentFrame() / 30;
  if (t < at) return null;
  const k = prog(t, at, at + 0.2, easeExpo);
  return (
    <div
      style={{
        display: "inline-block",
        transform: `rotate(${rotate}deg) scale(${1.9 - 0.9 * k})`,
        opacity: clamp01(k * 2.5),
        border: `3px solid ${C.red}`,
        borderRadius: 8,
        padding: `${size * 0.28}px ${size * 0.6}px`,
        background: "rgba(8,8,8,.88)",
        color: C.red,
        fontFamily: C.mono,
        fontSize: size,
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
        boxShadow: `0 0 ${30 * (1 - k) + 14}px rgba(255,59,47,${0.25 + 0.4 * (1 - k)})`,
      }}
    >
      {text}
    </div>
  );
};

/**
 * A real number that decodes, then gets stamped as a verified snapshot.
 * `tag` sits above the number (use "TEAM PROJECT" for Search/Amazon numbers, "CONCEPT" for brand tools).
 * Sequence seconds; anchor is the horizontal anchor of the block at (x, y = top).
 */
export const VerifiedStamp: React.FC<{
  at: number;
  value: string;
  x: number;
  y: number;
  size?: number;
  sub?: string;
  tag?: string;
  label?: string;
  decode?: number;
  stampAt?: number;
  out?: number;
  anchor?: "l" | "c" | "r";
}> = ({ at, value, x, y, size = 150, sub, tag, label = "✓ snapshot · Oct 2026", decode = 0.5, stampAt, out = Infinity, anchor = "c" }) => {
  const t = useCurrentFrame() / 30;
  if (t < at || t > out + 0.16) return null;
  const k = pop(t, at, 0.22);
  const e = out === Infinity ? 0 : clamp01((t - out) / 0.16);
  const sAt = stampAt ?? at + decode + 0.08;
  const align = anchor === "l" ? "flex-start" : anchor === "r" ? "flex-end" : "center";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateX(${anchorX(anchor)}) scale(${(0.9 + 0.1 * k) * (1 + e * 0.15)})`,
        opacity: clamp01(k * 2) * (1 - e),
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        pointerEvents: "none",
      }}
    >
      {tag && (
        <div style={{ fontFamily: C.mono, fontSize: Math.max(16, size * 0.13), letterSpacing: "0.16em", color: C.fg, border: `1.5px solid ${C.line}`, borderRadius: 6, padding: "3px 10px", marginBottom: size * 0.08 }}>
          {tag}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <DecodeNumber
          value={value}
          at={at}
          dur={decode}
          style={{ fontFamily: C.sans, fontWeight: 800, fontSize: size, lineHeight: 0.95, letterSpacing: "-0.045em", color: C.white, textShadow: "0 10px 40px rgba(0,0,0,.7)" }}
        />
        <div style={{ position: "absolute", right: -size * 0.12, bottom: -size * 0.32 }}>
          <SnapshotStamp at={sAt} text={label} size={Math.max(18, size * 0.15)} />
        </div>
      </div>
      {sub && <div style={{ fontFamily: C.mono, fontSize: Math.max(18, size * 0.16), letterSpacing: "0.06em", color: C.dim, marginTop: size * 0.32 }}>{sub}</div>}
    </div>
  );
};
