import { random, useCurrentFrame } from "remotion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/\\=_{}[]";

/**
 * Text that decodes from random glyphs into the real string, left to right.
 * `at` / `dur` in seconds relative to the current Sequence.
 */
export const Scramble: React.FC<{ text: string; at?: number; dur?: number; style?: React.CSSProperties; seed?: string }> = ({
  text,
  at = 0,
  dur = 0.5,
  style,
  seed = text,
}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (t < at) return null;
  const p = Math.min(1, (t - at) / dur);
  const out = [...text]
    .map((ch, i) => {
      if (ch === " ") return " ";
      const settle = (i + 1) / text.length;
      if (p >= settle) return ch;
      return GLYPHS[Math.floor(random(`${seed}${i}${Math.floor(f / 2)}`) * GLYPHS.length)];
    })
    .join("");
  return <span style={{ whiteSpace: "pre", ...style }}>{out}</span>;
};
