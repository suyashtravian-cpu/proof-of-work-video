import { Composition } from "remotion";
import { ProofOfWork } from "./ProofOfWork";
import { FPS, TOTAL_SECONDS, sec } from "./timing";

export const RemotionRoot: React.FC = () => (
  <Composition id="ProofOfWorkVertical" component={ProofOfWork} durationInFrames={sec(TOTAL_SECONDS)} fps={FPS} width={1080} height={1920} />
);
