import { AbsoluteFill, useCurrentFrame } from "remotion";
import { LINES, type Line } from "../script";
import { theme } from "../theme";

// Word-by-word captions: each word lands when it is spoken, the newest word pops.
export const Captions: React.FC<{ y?: number; lines?: Line[]; font?: string; accent?: string }> = ({
  y = 1460,
  lines = LINES,
  font = theme.sans,
  accent = "#ffffff",
}) => {
  const t = useCurrentFrame() / 30;
  // The most recent line that has started; it lingers briefly after the voice ends,
  // but never past the start of the next line.
  const current = [...lines].reverse().find((l) => t >= l.t - 0.05);
  const line = current && !current.kinetic && t < current.end + 0.35 ? current : undefined;
  if (!line) return null;
  const words = (line.caption ?? line.text).split(" ");
  const span = line.end - line.t;
  // When the caption is the spoken text, each word appears on its real voiceover timestamp.
  const spoken = !line.caption && line.words && line.words.length === words.length ? line.words : null;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: y,
          width: 940,
          textAlign: "center",
          fontFamily: font,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.08,
          letterSpacing: "-0.035em",
          color: theme.fg,
          textShadow: "0 4px 28px rgba(0,0,0,.85), 0 1px 3px rgba(0,0,0,.9)",
        }}
      >
        {words.map((w, i) => {
          const at = spoken ? spoken[i].s : line.t + (span * i) / words.length;
          const age = t - at;
          if (age < 0) return null;
          const pop = Math.min(1, age / 0.12);
          const nextAt = spoken ? spoken[i + 1]?.s ?? Infinity : line.t + (span * (i + 1)) / words.length;
          const newest = i === words.length - 1 || t < nextAt;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.24em",
                transform: `translateY(${(1 - pop) * 14}px) scale(${1.12 - pop * 0.12})`,
                opacity: pop,
                color: newest ? accent : "#d9d8d2",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
