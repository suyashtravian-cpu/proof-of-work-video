import { Composition } from "remotion";
import { ProofOfWork } from "./ProofOfWork";
import { FPS, totalFrames } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ProofOfWorkVertical"
      component={ProofOfWork}
      durationInFrames={totalFrames}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="ProofOfWorkWide"
      component={ProofOfWork}
      durationInFrames={totalFrames}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
