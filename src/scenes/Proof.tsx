import { interpolate, useCurrentFrame } from "remotion";
import { BigText } from "../components/BigText";
import { Center } from "../components/Center";
import { theme } from "../theme";

// "Not a list of skills. Proof of them."
export const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [14, 26], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Center gap={4}>
      <BigText size={9} color={theme.muted}>
        <span
          style={{
            backgroundImage: `linear-gradient(${theme.danger}, ${theme.danger})`,
            backgroundSize: `${strike}% 8%`,
            backgroundPosition: "0 55%",
            backgroundRepeat: "no-repeat",
          }}
        >
          Not a list of skills.
        </span>
      </BigText>
      <BigText delay={34} size={13} color={theme.accent}>Proof of them.</BigText>
    </Center>
  );
};
