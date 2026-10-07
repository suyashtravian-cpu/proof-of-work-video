import { AbsoluteFill, useCurrentFrame } from "remotion";
import { LINES } from "../script";
import { theme } from "../theme";

// Word-by-word captions: each word lands when it is spoken, the newest word pops.
export const Captions: React.FC<{ y?: number }> = ({ y = 1460 }) => {
  const t = useCurrentFrame() / 30;
  const line = LINES.find((l) => !l.kinetic && t >= l.t - 0.05 && t < l.end + 0.35);
  if (!line) return null;
  const words = (line.caption ?? line.text).split(" ");
  const span = line.end - line.t;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: y,
          width: 940,
          textAlign: "center",
          fontFamily: theme.sans,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.08,
          letterSpacing: "-0.035em",
          color: theme.fg,
          textShadow: "0 4px 28px rgba(0,0,0,.85), 0 1px 3px rgba(0,0,0,.9)",
        }}
      >
        {words.map((w, i) => {
          const at = line.t + (span * i) / words.length;
          const age = t - at;
          if (age < 0) return null;
          const pop = Math.min(1, age / 0.12);
          const newest = i === words.length - 1 || t < line.t + (span * (i + 1)) / words.length;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.24em",
                transform: `translateY(${(1 - pop) * 14}px) scale(${1.12 - pop * 0.12})`,
                opacity: pop,
                color: newest ? "#ffffff" : "#d9d8d2",
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
