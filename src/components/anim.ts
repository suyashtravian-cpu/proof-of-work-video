import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { sec } from "../timing";

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Interpolate over absolute seconds of the current Sequence. */
export const useT = () => useCurrentFrame() / 30;

export const tween = (t: number, from: number, to: number, a: number, b: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [from, to], [a, b], { ...clampOpts, easing: ease });

/** Spring that starts at `atSec` (relative to the Sequence). */
export const useSpringAt = (atSec: number, damping = 16, mass = 0.7) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - sec(atSec), fps, config: { damping, mass } });
};

export const easeOut = Easing.out(Easing.cubic);
export const easeExpo = Easing.out(Easing.exp);
export const easeInOut = Easing.inOut(Easing.cubic);
