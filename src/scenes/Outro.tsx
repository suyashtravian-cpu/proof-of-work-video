import { BigText } from "../components/BigText";
import { Center } from "../components/Center";
import { usePop, useUnit } from "../components/motion";
import { theme } from "../theme";
import { media } from "../media";

// "If I'm asking someone to bet on what I can do, I figured I should give them more than a PDF."
export const Outro: React.FC = () => {
  const u = useUnit();
  const url = usePop(55);
  return (
    <Center gap={4}>
      <BigText size={6} weight={600} color={theme.muted}>If you’re going to bet on me…</BigText>
      <BigText delay={18} size={10}>
        you deserve more than a <span style={{ color: theme.accent }}>PDF.</span>
      </BigText>
      <div
        style={{
          marginTop: 4 * u,
          padding: `${2 * u}px ${5 * u}px`,
          borderRadius: 10 * u,
          background: theme.accent,
          color: theme.bg,
          fontSize: 4.5 * u,
          fontWeight: 800,
          opacity: url,
          transform: `scale(${0.8 + url * 0.2})`,
        }}
      >
        {media.siteUrl}
      </div>
    </Center>
  );
};
