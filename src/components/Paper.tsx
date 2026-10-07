import { theme } from "../theme";

// A generic one-page résumé. Section bodies are abstract bars, not invented history.
const Bars: React.FC<{ widths: number[]; dim?: number }> = ({ widths, dim = 1 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12, opacity: dim }}>
    {widths.map((w, i) => (
      <div key={i} style={{ height: 13, width: `${w}%`, borderRadius: 4, background: i === 0 ? "#2b2b2b" : "#c9c7c0" }} />
    ))}
  </div>
);

export const PAPER_W = 760;
export const PAPER_H = 1000;

export const Paper: React.FC<{ focus?: "experience" | null; focusAmount?: number }> = ({ focus = null, focusAmount = 0 }) => {
  const other = 1 - 0.75 * focusAmount;
  const section = (title: string, widths: number[], key: string) => (
    <div style={{ marginTop: 46, opacity: focus && focus !== key ? other : 1 }}>
      <div style={{ fontFamily: theme.mono, fontSize: 17, letterSpacing: "0.14em", color: "#6b6a65", marginBottom: 18 }}>{title}</div>
      <Bars widths={widths} />
    </div>
  );
  return (
    <div
      style={{
        width: PAPER_W,
        height: PAPER_H,
        background: theme.paper,
        borderRadius: 10,
        padding: "70px 72px",
        boxSizing: "border-box",
        color: theme.ink,
        boxShadow: "0 50px 110px rgba(0,0,0,.65)",
      }}
    >
      <div style={{ opacity: focus ? other : 1 }}>
        <div style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 58, letterSpacing: "-0.05em" }}>Suyash Kashyap</div>
        <div style={{ fontFamily: theme.mono, fontSize: 18, color: "#6b6a65", marginTop: 8, letterSpacing: "0.1em" }}>RÉSUMÉ · 1 PAGE</div>
        <div style={{ height: 2, background: "#1d1d1d", marginTop: 34 }} />
      </div>
      {section("EXPERIENCE", [44, 92, 86, 70, 0, 40, 88, 64], "experience")}
      {section("EDUCATION", [38, 78], "education")}
      {section("SKILLS", [90, 58], "skills")}
    </div>
  );
};
