import { staticFile } from "remotion";

// Clips whose 4K/60 final render is in public/captures/; the rest use the 1x previews.
const FINALS = new Set(["hero", "work", "signals", "lab-archive", "creative"]);
export const clip = (name: string) => staticFile(`captures/${name}${FINALS.has(name) ? "" : ".preview"}.mp4`);
export const fullPage = staticFile("captures/desktop-full.jpg");
