// node capture/run.mjs <clip> [<clip>...]   (PREVIEW=1 for a fast 1x/30fps pass)
import { record } from "./engine.mjs";

export const SITE = "https://pilotaccess.com/proofofwork/";

for (const name of process.argv.slice(2)) {
  const clip = (await import(`./clips/${name}.mjs`)).default;
  const t0 = Date.now();
  const r = await record({ url: SITE, out: `out/captures/${name}.mp4`, ...clip.options }, clip.script);
  console.log(`${name}: ${r.out} ${r.seconds.toFixed(1)}s, ${r.frames} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s wall`);
}
