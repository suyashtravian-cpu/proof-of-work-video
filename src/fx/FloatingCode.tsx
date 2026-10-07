import { random, useCurrentFrame } from "remotion";
import { CODE_FILES } from "../generated/code";
import { theme } from "../theme";

const ALL = CODE_FILES.flatMap((f) => f.text.split("\n")).filter((l) => l.trim().length > 12);

/** Real lines of this project's code drifting in depth layers behind a scene. */
export const FloatingCode: React.FC<{ count?: number; opacity?: number; seed?: string; speed?: number }> = ({ count = 26, opacity = 0.14, seed = "fc", speed = 1 }) => {
  const t = useCurrentFrame() / 30;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const depth = 0.4 + random(`${seed}d${i}`) * 0.9;
        const line = ALL[Math.floor(random(`${seed}l${i}`) * ALL.length)].trim().slice(0, 64);
        const x = random(`${seed}x${i}`) * 1300 - 260;
        const y0 = random(`${seed}y${i}`) * 2200 - 140;
        const y = ((y0 - t * 60 * depth * speed) % 2200 + 2200) % 2200 - 140;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontFamily: theme.mono,
              fontSize: 14 + depth * 14,
              color: theme.fg,
              opacity: opacity * depth,
              whiteSpace: "pre",
              filter: depth < 0.7 ? "blur(1.5px)" : undefined,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};
