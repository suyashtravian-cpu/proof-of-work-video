import { Composition } from "remotion";
import { ProofOfWork } from "./ProofOfWork";
import { IdeasVideo } from "./v2/IdeasVideo";
import { LENGTH2 } from "./v2/timeline";
import { FPS, TOTAL_SECONDS, sec } from "./timing";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ProofOfWorkVertical"
      component={ProofOfWork}
      defaultProps={{ audio: "full" as const }}
      durationInFrames={sec(TOTAL_SECONDS)}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="IdeasVertical"
      component={IdeasVideo}
      defaultProps={{ audio: "full" as const }}
      durationInFrames={sec(LENGTH2)}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
