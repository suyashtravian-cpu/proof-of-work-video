import { AbsoluteFill } from "remotion";
import { Sky } from "./Sky";
import { RecSpans } from "./Rec";
import { SiteFrame } from "./SiteFrame";
import { SCENES2, type Scene2Name } from "../timeline";
import { theme2 } from "../theme";

/** Placeholder scene: the scene's footage in the floating frame over the sky. Designers replace these. */
export const basicScene = (name: Scene2Name): React.FC => {
  const s = SCENES2.find((x) => x.name === name)!;
  const len = s.to - s.from;
  const total = s.rec.reduce((n, [a, b]) => n + (b - a), 0);
  const durations = s.rec.map(([a, b]) => ((b - a) / total) * len);
  const Scene: React.FC = () => (
    <AbsoluteFill style={{ background: theme2.bg }}>
      <Sky opacity={0.35} blur={6} />
      {s.rec.length > 0 && (
        <SiteFrame>
          <RecSpans spans={[...s.rec]} durations={durations} />
        </SiteFrame>
      )}
    </AbsoluteFill>
  );
  return Scene;
};
