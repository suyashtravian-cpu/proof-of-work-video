import { BigText } from "../components/BigText";
import { Center } from "../components/Center";
import { usePop, useUnit } from "../components/motion";
import { theme } from "../theme";

// "Every application asks for the same thing: Upload your résumé."
export const Hook: React.FC = () => {
  const u = useUnit();
  const box = usePop(18);
  const drop = usePop(40, 18);
  return (
    <Center gap={5}>
      <BigText size={5} weight={600} color={theme.muted}>Every application asks for…</BigText>
      <div
        style={{
          width: 70 * u,
          padding: 6 * u,
          borderRadius: 3 * u,
          border: `${0.4 * u}px dashed ${theme.muted}`,
          opacity: box,
          transform: `scale(${0.9 + box * 0.1})`,
        }}
      >
        <div style={{ fontSize: 6 * u, fontWeight: 800 }}>Upload your résumé</div>
        <div
          style={{
            marginTop: 3 * u,
            display: "inline-block",
            padding: `${1.5 * u}px ${3 * u}px`,
            borderRadius: 1.5 * u,
            background: theme.paper,
            color: theme.ink,
            fontSize: 3.6 * u,
            fontWeight: 700,
            opacity: drop,
            transform: `translateY(${(1 - drop) * -20 * u}px)`,
          }}
        >
          📄 resume_final_v7.pdf
        </div>
      </div>
    </Center>
  );
};
