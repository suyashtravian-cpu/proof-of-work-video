import { AbsoluteFill, Series } from "remotion";
import { beats } from "./timeline";
import { theme } from "./theme";
import { Hook } from "./scenes/Hook";
import { Resume } from "./scenes/Resume";
import { Doesnt } from "./scenes/Doesnt";
import { Built } from "./scenes/Built";
import { Montage } from "./scenes/Montage";
import { Proof } from "./scenes/Proof";
import { Outro } from "./scenes/Outro";

const scenes: Record<(typeof beats)[number]["id"], React.FC> = {
  hook: Hook,
  resume: Resume,
  doesnt: Doesnt,
  built: Built,
  montage: Montage,
  proof: Proof,
  outro: Outro,
};

export const ProofOfWork: React.FC = () => (
  <AbsoluteFill style={{ background: theme.bg, fontFamily: theme.font, color: theme.fg }}>
    <Series>
      {beats.map((b) => {
        const Scene = scenes[b.id];
        return (
          <Series.Sequence key={b.id} durationInFrames={b.frames}>
            <Scene />
          </Series.Sequence>
        );
      })}
    </Series>
  </AbsoluteFill>
);
