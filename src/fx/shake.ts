import { random } from "remotion";

/** Camera shake that decays after each hit time (seconds). Returns [x, y, rotDeg]. */
export const shakeAt = (t: number, hits: number[], amp = 16, decay = 0.28): [number, number, number] => {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const h of hits) {
    const d = t - h;
    if (d < 0 || d > decay) continue;
    const k = (1 - d / decay) ** 2 * amp;
    const f = Math.floor(t * 30);
    x += (random(`shx${h}${f}`) - 0.5) * 2 * k;
    y += (random(`shy${h}${f}`) - 0.5) * 2 * k;
    r += (random(`shr${h}${f}`) - 0.5) * 0.12 * k;
  }
  return [x, y, r];
};
