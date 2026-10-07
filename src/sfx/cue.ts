export type SfxFile = "whoosh" | "hit" | "click" | "riser" | "shatter";
/** [file, seconds relative to the scene start, volume] */
export type Cue = [file: SfxFile, at: number, volume: number];
export const range = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step + 1e-6) + 1 }, (_, i) => +(from + i * step).toFixed(3));
