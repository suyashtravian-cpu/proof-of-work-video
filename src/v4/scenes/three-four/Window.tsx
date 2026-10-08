import { OffthreadVideo, Sequence } from "remotion";
import { clip } from "../../../footage";
import { sec } from "../../timing";
import { C } from "../../kit/util";

// Video 1's BrowserFrame, recoloured for v4 (black, white, one red: no traffic-light dots), holding
// the real 1440×900 site captures with an inner camera (cx, cy = footage px at the window's centre).

export const FOOT_W = 1440;
export const FOOT_H = 900;
/** Title-bar height for a window `w` px wide. */
export const barH = (w: number) => Math.round(w * 0.046);
export const contentH = (w: number) => (w * FOOT_H) / FOOT_W;

export type View = { cx: number; cy: number; z: number };
export const FULL: View = { cx: FOOT_W / 2, cy: FOOT_H / 2, z: 1 };

/** Footage px → px inside the window's content box. */
export const footToContent = (w: number, v: View, fx: number, fy: number) => {
  const s = (w / FOOT_W) * v.z;
  return { x: w / 2 + (fx - v.cx) * s, y: contentH(w) / 2 + (fy - v.cy) * s };
};

/** One stretch of a capture: plays from `from` (capture seconds) at `rate`, during [at, until) (Sequence seconds). */
export type Seg = { at: number; until: number; from: number; rate?: number };

/** Capture footage inside a window's content box, framed by an inner camera. */
export const Footage: React.FC<{ name: string; w: number; segs: Seg[]; view?: View }> = ({ name, w, segs, view = FULL }) => {
  const s = (w / FOOT_W) * view.z;
  const h = contentH(w);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#0c0c0c" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FOOT_W,
          height: FOOT_H,
          transformOrigin: "0 0",
          transform: `translate(${w / 2 - view.cx * s}px, ${h / 2 - view.cy * s}px) scale(${s})`,
        }}
      >
        {segs.map((g, i) => (
          <Sequence key={i} from={sec(g.at)} durationInFrames={Math.max(1, sec(g.until) - sec(g.at))} layout="none">
            <OffthreadVideo src={clip(name)} trimBefore={sec(g.from)} playbackRate={g.rate ?? 1} muted style={{ width: FOOT_W, height: FOOT_H, display: "block" }} />
          </Sequence>
        ))}
      </div>
    </div>
  );
};

const Lock: React.FC<{ k: number }> = ({ k }) => (
  <svg width={13 * k} height={15 * k} viewBox="0 0 13 15" style={{ marginRight: 9 * k, flex: "none" }}>
    <rect x={1} y={6.5} width={11} height={8} rx={2} fill="#9a9a9a" />
    <path d="M3.5,6.5 V4.5 a3,3 0 0 1 6,0 V6.5" fill="none" stroke="#9a9a9a" strokeWidth={1.8} />
  </svg>
);

/** The window chrome: red + grey dots, URL pill, optional LIVE; children fill the 16:10 content box. */
export const Window: React.FC<{
  w: number;
  url: string;
  live?: boolean;
  /** 0..1 black veil over the window (pushed back in depth). */
  dim?: number;
  glow?: number;
  children: React.ReactNode;
}> = ({ w, url, live = false, dim = 0, glow = 0.2, children }) => {
  const k = w / 1000;
  const bar = barH(w);
  return (
    <div
      style={{
        position: "relative",
        width: w,
        borderRadius: Math.max(10, 18 * k),
        overflow: "hidden",
        background: "#111",
        border: "1px solid #ffffff2e",
        boxShadow: `0 ${50 * k}px ${110 * k}px rgba(0,0,0,.75), 0 0 ${120 * k}px rgba(255,255,255,${glow * 0.16})`,
      }}
    >
      <div style={{ height: bar, display: "flex", alignItems: "center", gap: 9 * k, padding: `0 ${18 * k}px`, background: "#161616", borderBottom: "1px solid #ffffff14" }}>
        {[C.red, "#4a4a4a", "#4a4a4a"].map((c, i) => (
          <div key={i} style={{ width: 13 * k, height: 13 * k, borderRadius: 7 * k, background: c }} />
        ))}
        <div
          style={{
            marginLeft: 18 * k,
            flex: 1,
            height: 28 * k,
            borderRadius: 8 * k,
            background: "#0b0b0b",
            color: "#b5b5b5",
            fontFamily: C.mono,
            fontSize: 16 * k,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            whiteSpace: "nowrap",
          }}
        >
          <Lock k={k} />
          {url}
          {live && (
            <div style={{ position: "absolute", right: 10 * k, display: "flex", alignItems: "center", gap: 6 * k, fontSize: 12 * k, letterSpacing: "0.14em", color: C.red }}>
              <span style={{ width: 8 * k, height: 8 * k, borderRadius: 4 * k, background: C.red }} />
              LIVE
            </div>
          )}
        </div>
      </div>
      <div style={{ position: "relative", width: w, height: contentH(w), overflow: "hidden" }}>{children}</div>
      {dim > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: dim, pointerEvents: "none" }} />}
    </div>
  );
};

/** Red corner brackets snapping onto a box (screen px). */
export const Brackets: React.FC<{ x: number; y: number; w: number; h: number; k: number; len?: number; stroke?: number; color?: string }> = ({ x, y, w, h, k, len = 34, stroke = 5, color = C.red }) => {
  if (k <= 0) return null;
  const pad = (1 - k) * 60;
  const X = x - pad;
  const Y = y - pad;
  const W = w + pad * 2;
  const H = h + pad * 2;
  const c = (cx: number, cy: number, sx: number, sy: number) => <path d={`M${cx + sx * len},${cy} L${cx},${cy} L${cx},${cy + sy * len}`} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="square" />;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", opacity: Math.min(1, k * 1.5) }}>
      {c(X, Y, 1, 1)}
      {c(X + W, Y, -1, 1)}
      {c(X, Y + H, 1, -1)}
      {c(X + W, Y + H, -1, -1)}
    </svg>
  );
};
