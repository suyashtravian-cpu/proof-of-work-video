import { theme } from "../../theme";
import { DZ, FH, FW, Placed } from "./wall";

const RED = theme.red;
const PAPER = "#f3f1ec";

type CardState = { pulse: number; hot: number; drag?: number };

const abs = (x: number, y: number, w: number, h: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: "absolute",
  left: x,
  top: y,
  width: w,
  height: h,
  boxSizing: "border-box",
  ...extra,
});

const zoneStyle = (s: CardState, w: number): React.CSSProperties => {
  const p = Math.min(1, s.pulse + s.hot);
  const drag = s.drag ?? 0;
  return {
    borderRadius: 14,
    border: `${w > 200 ? 3 : 6}px ${p > 0.15 || drag > 0 ? "solid" : "dashed"} ${p > 0.15 ? RED : drag > 0 ? "#1d1d1d" : "#c4c2bb"}`,
    background: p > 0.02 ? `rgba(255,59,47,${(0.1 + 0.85 * p).toFixed(3)})` : drag > 0 ? `rgba(18,18,18,${0.06 + drag * 0.06})` : "#fbfaf7",
  };
};

const FullCard: React.FC<{ title: string; s: CardState }> = ({ title, s }) => {
  const p = Math.min(1, s.pulse + s.hot);
  const drag = s.drag ?? 0;
  return (
    <>
      <div style={abs(40, 34, 480, 20, { fontFamily: theme.mono, fontSize: 15, letterSpacing: "0.14em", color: "#8a8983" })}>JOB APPLICATION</div>
      <div style={abs(40, 58, 480, 44, { fontFamily: theme.sans, fontWeight: 800, fontSize: 36, lineHeight: "44px", letterSpacing: "-0.04em", whiteSpace: "nowrap", color: theme.ink })}>{title}</div>
      {["Full name", "Email"].map((l, i) => (
        <div key={l}>
          <div style={abs(40 + i * 250, 126, 230, 22, { fontFamily: theme.sans, fontWeight: 500, fontSize: 17, color: "#6b6a65" })}>{l}</div>
          <div style={abs(40 + i * 250, 152, 230, 44, { borderRadius: 9, border: "2px solid #dddbd4", background: "#fbfaf7" })} />
        </div>
      ))}
      <div
        style={abs(40, 222, 480, 30, {
          fontFamily: theme.sans,
          fontWeight: 700,
          fontSize: 25,
          lineHeight: "30px",
          whiteSpace: "nowrap",
          color: p > 0.4 ? RED : theme.ink,
        })}
      >
        Upload your résumé <span style={{ color: RED }}>*</span>
      </div>
      <div
        style={abs(DZ.x, DZ.y, DZ.w, DZ.h, {
          ...zoneStyle(s, 999),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: p > 0.4 ? theme.mono : theme.sans,
          fontWeight: p > 0.4 ? 500 : 500,
          letterSpacing: p > 0.4 ? "0.12em" : 0,
          fontSize: p > 0.4 ? 22 : 21,
          color: p > 0.4 ? "#fff" : drag > 0 ? theme.ink : "#8a8983",
        })}
      >
        {p > 0.4 ? "RÉSUMÉ REQUIRED" : drag > 0 ? "Drop to upload" : "↑ Drag & drop · PDF only"}
      </div>
      <div
        style={abs(40, 486, 480, 58, {
          borderRadius: 29,
          background: "#1d1d1d",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.sans,
          fontWeight: 700,
          fontSize: 22,
        })}
      >
        Submit application
      </div>
      <div style={abs(40, 572, 480, 20, { fontFamily: theme.mono, fontSize: 14, color: "#9a9993", letterSpacing: "0.04em" })}>Required fields are marked *</div>
    </>
  );
};

const MidCard: React.FC<{ s: CardState; titleW: number }> = ({ s, titleW }) => {
  const p = Math.min(1, s.pulse + s.hot);
  return (
    <>
      <div style={abs(40, 34, 170, 14, { background: "#cfcdc6", borderRadius: 4 })} />
      <div style={abs(40, 62, titleW, 34, { background: theme.ink, borderRadius: 6 })} />
      <div style={abs(40, 152, 230, 44, { borderRadius: 9, border: "4px solid #dddbd4" })} />
      <div style={abs(290, 152, 230, 44, { borderRadius: 9, border: "4px solid #dddbd4" })} />
      <div style={abs(40, 224, 270, 24, { background: p > 0.4 ? RED : "#3a3a3a", borderRadius: 5 })} />
      <div style={abs(DZ.x, DZ.y, DZ.w, DZ.h, zoneStyle(s, 100))} />
      <div style={abs(40, 486, 480, 58, { borderRadius: 29, background: "#1d1d1d" })} />
    </>
  );
};

const TinyCard: React.FC<{ s: CardState }> = ({ s }) => {
  const p = Math.min(1, s.pulse + s.hot);
  return (
    <>
      <div style={abs(40, 58, 300, 44, { background: "#2a2a2a" })} />
      <div style={abs(DZ.x, DZ.y, DZ.w, DZ.h, { background: p > 0.02 ? `rgba(255,59,47,${(0.15 + 0.85 * p).toFixed(3)})` : "#d6d4cd" })} />
      <div style={abs(40, 486, 480, 58, { background: "#1d1d1d" })} />
    </>
  );
};

export const WallCards: React.FC<{
  placed: Placed[];
  state: (id: number) => CardState;
  fog: (depth: number) => number;
}> = ({ placed, state, fog }) => (
  <>
    {placed.map(({ card, m }) => {
      const s = state(card.id);
      const lift = 1 + 0.07 * s.pulse;
      // scale about the card centre for the pulse lift
      const a = m.a * lift;
      const b = m.b * lift;
      const c = m.c * lift;
      const d = m.d * lift;
      const cx = m.a * (FW / 2) + m.c * (FH / 2) + m.e;
      const cy = m.b * (FW / 2) + m.d * (FH / 2) + m.f;
      const e = cx - a * (FW / 2) - c * (FH / 2);
      const f = cy - b * (FW / 2) - d * (FH / 2);
      const o = fog(m.depth);
      if (o <= 0.01) return null;
      return (
        <div
          key={card.id}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FW,
            height: FH,
            transformOrigin: "0 0",
            transform: `matrix(${a},${b},${c},${d},${e},${f})`,
            background: PAPER,
            borderRadius: m.w > 75 ? 22 : 0,
            opacity: o,
          }}
        >
          {m.w > 230 ? <FullCard title={card.title} s={s} /> : m.w > 70 ? <MidCard s={s} titleW={160 + (card.title.length / 22) * 300} /> : <TinyCard s={s} />}
        </div>
      );
    })}
  </>
);
