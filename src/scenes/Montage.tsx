import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BigText } from "../components/BigText";
import { useUnit } from "../components/motion";
import { theme } from "../theme";
import { media } from "../media";

const lines = ["My projects.", "My experiments.", "Built with AI.", "Marketing work.", "Ideas, executed."];
const PER = 30;

const Card: React.FC<{ label: string; index: number }> = ({ label, index }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const zoom = interpolate(frame, [0, PER], [1.08, 1]);
  const shot = media.sections[index];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, opacity: 0.55 }}>
        {shot ? (
          <Img src={staticFile(shot)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <AbsoluteFill
            style={{ background: `radial-gradient(circle at ${30 + index * 12}% 40%, ${theme.accent}33, transparent 60%)` }}
          />
        )}
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 6 * u, fontSize: 3 * u, color: theme.muted, fontWeight: 700 }}>
        {String(index + 1).padStart(2, "0")} / {String(lines.length).padStart(2, "0")}
      </div>
      <BigText size={11}>{label}</BigText>
    </AbsoluteFill>
  );
};

// "My projects. My experiments. Things I've built with AI. Marketing work. Ideas I've actually executed."
export const Montage: React.FC = () => (
  <AbsoluteFill>
    {lines.map((l, i) => (
      <Sequence key={l} from={i * PER} durationInFrames={PER}>
        <Card label={l} index={i} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
