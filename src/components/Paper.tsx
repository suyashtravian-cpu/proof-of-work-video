import { theme } from "../theme";

// A generic one-page résumé. Section bodies are abstract bars, not invented history.
// Line heights are explicit so the layout below is exact (used for scan / ASCII effects).

export const PAPER_W = 760;
export const PAPER_H = 1000;

const PAD_X = 72;
const PAD_Y = 70;
const BAR_H = 13;
const BAR_GAP = 12;
const SECTIONS: { key: "experience" | "education" | "skills"; title: string; widths: number[] }[] = [
  { key: "experience", title: "EXPERIENCE", widths: [44, 92, 86, 70, 0, 40, 88, 64] },
  { key: "education", title: "EDUCATION", widths: [38, 78] },
  { key: "skills", title: "SKILLS", widths: [90, 58] },
];
const INNER_W = PAPER_W - PAD_X * 2;

type Rect = { x: number; y: number; w: number; h: number };

/** Paper-space layout: header block and each section's bounds (title to last bar). */
export const PAPER_LAYOUT = (() => {
  const header: Rect = { x: PAD_X, y: PAD_Y, w: INNER_W, h: 208 - PAD_Y };
  const ink: Rect[] = [
    { x: PAD_X, y: PAD_Y + 10, w: 470, h: 52 }, // name
    { x: PAD_X, y: 152, w: 230, h: 16 }, // subtitle
    { x: PAD_X, y: 206, w: INNER_W, h: 2 }, // rule
  ];
  const sections: Record<string, Rect> = {};
  let y = 208;
  for (const s of SECTIONS) {
    y += 46;
    const top = y;
    ink.push({ x: PAD_X, y: y + 4, w: s.title.length * 12, h: 14 });
    y += 22 + 18;
    s.widths.forEach((w, i) => {
      if (w > 0) ink.push({ x: PAD_X, y: y + i * (BAR_H + BAR_GAP), w: (INNER_W * w) / 100, h: BAR_H });
    });
    y += s.widths.length * BAR_H + (s.widths.length - 1) * BAR_GAP;
    sections[s.key] = { x: PAD_X, y: top, w: INNER_W, h: y - top };
  }
  return { header, sections, ink };
})();

const Bars: React.FC<{ widths: number[] }> = ({ widths }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: BAR_GAP }}>
    {widths.map((w, i) => (
      <div key={i} style={{ height: BAR_H, width: `${w}%`, borderRadius: 4, background: i === 0 ? "#2b2b2b" : "#c9c7c0" }} />
    ))}
  </div>
);

export const Paper: React.FC<{ focus?: "experience" | null; focusAmount?: number }> = ({ focus = null, focusAmount = 0 }) => {
  const other = 1 - 0.75 * focusAmount;
  return (
    <div
      style={{
        width: PAPER_W,
        height: PAPER_H,
        background: theme.paper,
        borderRadius: 10,
        padding: `${PAD_Y}px ${PAD_X}px`,
        boxSizing: "border-box",
        color: theme.ink,
        boxShadow: "0 50px 110px rgba(0,0,0,.65)",
      }}
    >
      <div style={{ opacity: focus ? other : 1 }}>
        <div style={{ fontFamily: theme.sans, fontWeight: 800, fontSize: 58, lineHeight: "70px", letterSpacing: "-0.05em" }}>Suyash Kashyap</div>
        <div style={{ fontFamily: theme.mono, fontSize: 18, lineHeight: "24px", color: "#6b6a65", marginTop: 8, letterSpacing: "0.1em" }}>RÉSUMÉ · 1 PAGE</div>
        <div style={{ height: 2, background: "#1d1d1d", marginTop: 34 }} />
      </div>
      {SECTIONS.map((s) => (
        <div key={s.key} style={{ marginTop: 46, opacity: focus && focus !== s.key ? other : 1 }}>
          <div style={{ fontFamily: theme.mono, fontSize: 17, lineHeight: "22px", letterSpacing: "0.14em", color: "#6b6a65", marginBottom: 18 }}>{s.title}</div>
          <Bars widths={s.widths} />
        </div>
      ))}
    </div>
  );
};
