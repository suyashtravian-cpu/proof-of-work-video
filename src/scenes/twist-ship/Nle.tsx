import { random } from "remotion";
import { LINES } from "../../script";
import { SFX } from "../../sfx";
import { SCENES } from "../../timeline";
import { TOTAL_SECONDS, sec } from "../../timing";
import { theme } from "../../theme";

export const NLE_W = 1000;
export const NLE_H = 470;
const LABEL = 96;
const TW = NLE_W - LABEL - 24;
const x = (s: number) => (s / TOTAL_SECONDS) * TW;
const CYAN = "#33e1ff";
const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${String(m).padStart(2, "0")}:${r.toFixed(2).padStart(5, "0")}`;
};

const Track: React.FC<{ label: string; h: number; children: React.ReactNode }> = ({ label, h, children }) => (
  <div style={{ position: "relative", height: h, borderTop: "1px solid #ffffff12", display: "flex" }}>
    <div style={{ width: LABEL, flexShrink: 0, fontFamily: theme.mono, fontSize: 15, letterSpacing: "0.1em", color: "#77766f", padding: "10px 0 0 16px", boxSizing: "border-box", background: "#0d0d0d" }}>
      {label}
    </div>
    <div style={{ position: "relative", flex: 1, marginLeft: 6 }}>{children}</div>
  </div>
);

/** An NLE-style view of this very video, built from the real SCENES / LINES / SFX data. `head` = playhead seconds. */
export const Nle: React.FC<{ head: number; label?: string; hot?: number }> = ({ head, label, hot = 0 }) => {
  const active = SCENES.findIndex((s) => head >= s.from && head < s.to);
  const vo = LINES.map((l, i) => {
    const bars = Math.max(2, Math.floor(x(l.end - l.t) / 4));
    return Array.from({ length: bars }, (_, b) => {
      const h = 6 + random(`nle${i}-${b}`) * 34 * (0.5 + 0.5 * Math.sin((b / bars) * Math.PI));
      return <rect key={`${i}-${b}`} x={x(l.t) + b * 4} y={36 - h / 2} width={2.4} height={h} fill={l.kinetic ? theme.red : "#a9a8a2"} opacity={head >= l.t ? 1 : 0.55} />;
    });
  });
  return (
    <div style={{ width: NLE_W, height: NLE_H, borderRadius: 18, background: "#0a0a0a", border: "1px solid #ffffff22", overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,.7)", position: "relative" }}>
      <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "#131313", borderBottom: "1px solid #ffffff14", fontFamily: theme.mono, fontSize: 17, color: "#bdbcb6" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
        ))}
        <span style={{ marginLeft: 10, color: theme.fg }}>ProofOfWork.tsx</span>
        <span style={{ color: "#5d5c57" }}>· 1080×1920 · 30fps · {sec(TOTAL_SECONDS)}f</span>
        <span style={{ marginLeft: "auto", color: theme.red, fontSize: 22 }}>{fmt(head)}</span>
      </div>
      <Track label="TIME" h={34}>
        {Array.from({ length: Math.floor(TOTAL_SECONDS) + 1 }, (_, s) => (
          <div key={s} style={{ position: "absolute", left: x(s), top: s % 5 ? 22 : 12, width: 1, height: s % 5 ? 12 : 22, background: "#ffffff40" }}>
            {s % 10 === 0 && <span style={{ position: "absolute", left: 4, top: -4, fontFamily: theme.mono, fontSize: 12, color: "#77766f" }}>{s}s</span>}
          </div>
        ))}
      </Track>
      <Track label="VIDEO" h={112}>
        {SCENES.map((s, i) => {
          const on = i === active;
          return (
            <div
              key={s.name}
              style={{
                position: "absolute",
                top: 12,
                left: x(s.from) + 1,
                width: x(s.to - s.from) - 3,
                height: 88,
                borderRadius: 7,
                background: on ? "#f2f1ec" : i % 2 ? "#262626" : "#333",
                boxShadow: on ? `0 0 ${24 + hot * 40}px rgba(255,255,255,${0.35 + hot * 0.4})` : undefined,
                overflow: "hidden",
                fontFamily: theme.mono,
                fontSize: 13,
                color: on ? theme.bg : "#bdbcb6",
                padding: "8px 6px",
                boxSizing: "border-box",
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ fontWeight: 500 }}>{s.name.toUpperCase()}</div>
              <div style={{ opacity: 0.6, marginTop: 4 }}>{(s.to - s.from).toFixed(1)}s</div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 22, backgroundImage: `repeating-linear-gradient(90deg, ${on ? "#0000001f" : "#ffffff10"} 0 20px, transparent 20px 23px)` }} />
            </div>
          );
        })}
      </Track>
      <Track label="VO" h={78}>
        <svg width={TW} height={72} style={{ position: "absolute", left: 0, top: 3 }}>
          {vo}
        </svg>
      </Track>
      <Track label="SFX" h={70}>
        <svg width={TW} height={66} style={{ position: "absolute", left: 0, top: 2 }}>
          {SFX.map(([file, at, vol], i) => {
            const h = 10 + vol * 44;
            const c = file === "hit" ? theme.fg : file === "shatter" ? theme.red : file === "riser" ? CYAN : "#7a7973";
            return file === "riser" ? (
              <path key={i} d={`M${x(at)},${56} L${x(at + 1.6)},${56 - h} L${x(at + 1.6)},${56} Z`} fill={c} opacity={0.5} />
            ) : (
              <rect key={i} x={x(at)} y={56 - h} width={file === "whoosh" ? 7 : 3} height={h} fill={c} opacity={head >= at ? 1 : 0.5} />
            );
          })}
        </svg>
      </Track>
      <Track label="FX" h={NLE_H - 52 - 34 - 112 - 78 - 70}>
        {SCENES.slice(1).map((s) => (
          <div key={s.name} style={{ position: "absolute", left: x(s.from) - 7, top: 18, width: 14, height: 14, transform: "rotate(45deg)", background: CYAN, opacity: 0.8 }} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 40, height: 3, background: "#ffffff14" }} />
      </Track>
      {/* playhead */}
      <div style={{ position: "absolute", top: 52, bottom: 0, left: LABEL + 6 + x(head) - 1.5, width: 3, background: theme.red, boxShadow: `0 0 18px ${theme.red}` }}>
        <div style={{ position: "absolute", top: 0, left: -9, width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: `14px solid ${theme.red}` }} />
        {label && (
          <div style={{ position: "absolute", top: 18, left: head > TOTAL_SECONDS * 0.6 ? undefined : 10, right: head > TOTAL_SECONDS * 0.6 ? 10 : undefined, whiteSpace: "nowrap", fontFamily: theme.mono, fontSize: 16, letterSpacing: "0.08em", color: "#fff", background: theme.red, padding: "4px 8px", borderRadius: 4 }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

export const fmtTc = fmt;
