import { Easing, useCurrentFrame } from "remotion";
import { C, clamp01, easeExpo, pop, prog } from "./util";

export const COMMANDS = ["build product", "design tool", "create content", "launch campaign"];

/**
 * ⌘K command palette used as the transition into each of the four sections.
 * Opens at `at`, the agent types `query` between `typeFrom` and `typeTo`, the matching row lights,
 * ↵ on `select`, then the palette flies past the camera (done ~0.28 s after `select`).
 * `done` = indices already completed (they keep a red check). Sequence seconds.
 */
export const CommandPalette: React.FC<{
  at: number;
  query: string;
  select: number;
  typeFrom?: number;
  typeTo?: number;
  done?: number[];
  items?: string[];
  y?: number;
  width?: number;
}> = ({ at, query, select, typeFrom = at + 0.07, typeTo = select - 0.08, done = [], items = COMMANDS, y = 560, width = 860 }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const flyEnd = select + 0.3;
  if (t < at || t > flyEnd) return null;
  const open = prog(t, at, at + 0.16, easeExpo);
  const fly = prog(t, select + 0.06, flyEnd, Easing.in(Easing.cubic));
  const n = Math.floor(prog(t, typeFrom, typeTo) * query.length + 1e-6);
  const typed = query.slice(0, n);
  const match = typed.length ? items.findIndex((it) => it.startsWith(typed)) : -1;
  const chosen = t >= select;
  const flash = chosen ? 1 - clamp01((t - select) / 0.14) : 0;
  const caretOn = Math.floor(t * 5) % 2 === 0 || (t < typeTo && t > typeFrom);
  const row = 74;
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - width) / 2,
        top: y,
        width,
        transformOrigin: `50% ${96 + (Math.max(0, match) + 0.5) * row}px`,
        transform: `perspective(1200px) translateZ(${-260 * (1 - open) + 900 * fly}px) translateY(${(1 - open) * 30}px)`,
        opacity: clamp01(open * 1.6) * (1 - fly),
        filter: fly > 0.05 ? `blur(${(fly * 10).toFixed(1)}px)` : undefined,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          borderRadius: 26,
          background: C.panel,
          border: `1.5px solid ${C.line}`,
          boxShadow: "0 50px 120px rgba(0,0,0,.75), 0 0 0 1px rgba(0,0,0,.4)",
          overflow: "hidden",
        }}
      >
        {/* input */}
        <div style={{ height: 96, display: "flex", alignItems: "center", gap: 20, padding: "0 30px", borderBottom: `1.5px solid ${C.line}` }}>
          <span style={{ fontFamily: C.mono, fontSize: 34, color: C.red }}>›</span>
          <span style={{ flex: 1, fontFamily: C.sans, fontWeight: 600, fontSize: 44, letterSpacing: "-0.02em", color: typed ? C.white : "#ffffff55", whiteSpace: "pre" }}>
            {typed || "What should we make?"}
            {typed && <span style={{ display: "inline-block", width: 4, height: 44, marginLeft: 3, verticalAlign: "-6px", background: C.red, opacity: caretOn && !chosen ? 1 : 0 }} />}
          </span>
          <span style={{ fontFamily: C.mono, fontSize: 20, color: C.dim, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "4px 10px" }}>⌘K</span>
        </div>
        {/* commands */}
        <div style={{ padding: "8px 0 10px" }}>
          {items.map((it, i) => {
            const active = i === match;
            const isDone = done.includes(i);
            const dim = typed && !active ? 0.32 : 1;
            const hit = active ? pop(t, typeFrom + (typeTo - typeFrom) / Math.max(1, query.length), 0.18) : 0;
            return (
              <div
                key={it}
                style={{
                  position: "relative",
                  height: row,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "0 30px",
                  opacity: dim,
                  background: active ? (flash > 0 ? `rgba(255,59,47,${0.25 + 0.6 * flash})` : "rgba(255,255,255,.07)") : undefined,
                }}
              >
                {active && <div style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 5, borderRadius: 3, background: C.red, transform: `scaleY(${hit})` }} />}
                <span style={{ fontFamily: C.mono, fontSize: 20, color: active ? C.red : "#ffffff55", width: 34 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ flex: 1, fontFamily: C.sans, fontWeight: active ? 700 : 500, fontSize: 36, letterSpacing: "-0.015em", color: active ? C.white : "#d9d8d2" }}>{it}</span>
                {isDone && !active && <span style={{ fontFamily: C.mono, fontSize: 20, color: C.red }}>✓ done</span>}
                {active && (
                  <span
                    style={{
                      fontFamily: C.mono,
                      fontSize: 22,
                      color: chosen ? C.bg : C.fg,
                      background: chosen ? C.white : "transparent",
                      border: `1.5px solid ${chosen ? C.white : C.line}`,
                      borderRadius: 8,
                      padding: "3px 12px",
                      transform: `scale(${chosen ? 1 - 0.12 * flash : 1})`,
                    }}
                  >
                    ↵
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
