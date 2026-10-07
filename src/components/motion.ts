import { spring, useCurrentFrame, useVideoConfig } from "remotion";

/** 0→1 spring that starts at `delay` frames into the current sequence. */
export const usePop = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};

/** Font size that scales with the shorter edge, so 9:16 and 16:9 share one layout. */
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 100;
};
