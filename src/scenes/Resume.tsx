import { interpolate, useCurrentFrame } from "remotion";
import { BigText } from "../components/BigText";
import { Center } from "../components/Center";
import { usePop, useUnit } from "../components/motion";
import { theme } from "../theme";

const rows = ["Marketing Executive — 2023–25", "Growth Intern — 2022", "B.Com — 2021"];

// "But a résumé tells you where I've worked."
export const Resume: React.FC = () => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const card = usePop(0);
  const fade = interpolate(frame, [50, 75], [1, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Center gap={5}>
      <div
        style={{
          width: 62 * u,
          padding: 5 * u,
          borderRadius: 2 * u,
          background: theme.paper,
          color: theme.ink,
          textAlign: "left",
          opacity: card * fade,
          filter: `grayscale(${1 - fade})`,
          transform: `rotate(${(1 - card) * -6}deg) scale(${0.85 + card * 0.15})`,
        }}
      >
        <div style={{ fontSize: 5 * u, fontWeight: 800 }}>RÉSUMÉ</div>
        {rows.map((r, i) => {
          const hl = interpolate(frame, [12 + i * 8, 22 + i * 8], [0, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={r}
              style={{
                marginTop: 2.5 * u,
                fontSize: 3.4 * u,
                fontWeight: 600,
                background: `linear-gradient(90deg, ${theme.accent} ${hl}%, transparent ${hl}%)`,
              }}
            >
              {r}
            </div>
          );
        })}
      </div>
      <BigText delay={10} size={7}>
        tells you where I’ve <span style={{ color: theme.accent }}>worked.</span>
      </BigText>
    </Center>
  );
};
