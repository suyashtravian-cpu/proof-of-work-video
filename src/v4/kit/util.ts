import { Easing, useCurrentFrame } from "remotion";
import { theme } from "../../theme";

export { easeExpo, easeInOut, easeOut, tween } from "../../components/anim";

/** v4 palette: black, white, ONE red. Nothing else on screen. */
export const C = {
  bg: theme.bg,
  fg: theme.fg,
  white: "#ffffff",
  dim: theme.dim,
  line: "#ffffff24",
  red: theme.red,
  redGlow: "rgba(255,59,47,.55)",
  panel: "rgba(13,13,13,.94)",
  paper: theme.paper,
  ink: theme.ink,
  sans: theme.sans,
  mono: theme.mono,
};

/** Seconds of the current Sequence. */
export const useT = () => useCurrentFrame() / 30;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0→1 over [a, b] with an easing. */
export const prog = (t: number, a: number, b: number, ease: (x: number) => number = (x) => x) => ease(clamp01((t - a) / (b - a)));
export const easeIn3 = Easing.in(Easing.cubic);
export const easeBack = Easing.out(Easing.back(1.8));
/** 0→1 pop with overshoot, `dur` defaults to the 0.22 s Meta-pace pop. */
export const pop = (t: number, at: number, dur = 0.22) => (t < at ? 0 : easeBack(clamp01((t - at) / dur)));
/** Decaying wobble after `at` (scale punches, shakes). */
export const kick = (t: number, at: number, amp = 0.08, freq = 20, decay = 8) => (t < at ? 0 : amp * Math.sin((t - at) * freq) * Math.exp(-(t - at) * decay));
/** CSS transform for anchoring an absolutely placed element at (x, y). */
export const anchorX = (a: "l" | "c" | "r") => (a === "l" ? "0%" : a === "c" ? "-50%" : "-100%");
