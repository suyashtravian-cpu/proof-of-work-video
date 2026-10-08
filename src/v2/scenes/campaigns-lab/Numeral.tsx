import { theme2 } from "../../theme";

// Fixed-width cells so the count never jitters: "1" + "," + three digits, right-aligned.
const CELLS: { w: number; kind: "d" | "c"; place: number }[] = [
  { w: 0.46, kind: "d", place: 3 },
  { w: 0.22, kind: "c", place: 3 },
  { w: 0.6, kind: "d", place: 2 },
  { w: 0.6, kind: "d", place: 1 },
  { w: 0.6, kind: "d", place: 0 },
];
export const NUMERAL_EM = CELLS.reduce((n, c) => n + c.w, 0);

/** Big counting numeral (0..9999) with comma, gradient lilac-paper fill and glow. */
export const Numeral: React.FC<{ value: number; size: number; blurY?: number; glow?: number }> = ({ value, size, blurY = 0, glow = 1 }) => {
  const v = Math.max(0, Math.round(value));
  return (
    <div
      style={{
        display: "flex",
        width: NUMERAL_EM * size,
        height: size * 0.95,
        fontFamily: theme2.display,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 0.95,
        filter: `drop-shadow(0 0 ${30 * glow}px rgba(188,165,238,${0.65 * glow})) drop-shadow(0 16px 40px rgba(3,4,18,.7))${blurY > 0.3 ? ` blur(${blurY.toFixed(1)}px)` : ""}`,
      }}
    >
      {CELLS.map((c, i) => {
        const shown = c.kind === "c" ? v >= 1000 : c.place === 0 || v >= 10 ** c.place;
        const ch = c.kind === "c" ? "," : String(Math.floor(v / 10 ** c.place) % 10);
        return (
          <div
            key={i}
            style={{
              width: c.w * size,
              textAlign: "center",
              opacity: shown ? 1 : 0,
              background: `linear-gradient(180deg, ${theme2.paper} 18%, ${theme2.lilacSoft} 55%, ${theme2.lilac} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {ch}
          </div>
        );
      })}
    </div>
  );
};
