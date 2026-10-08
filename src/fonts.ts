import { continueRender, delayRender, staticFile } from "remotion";

const faces: [string, string, string][] = [
  ["Hubot Sans", "fonts/HubotSans-2.ttf", "500"],
  ["Hubot Sans", "fonts/HubotSans-4.ttf", "700"],
  ["Hubot Sans", "fonts/HubotSans-5.ttf", "800"],
  ["JetBrains Mono", "fonts/JetBrainsMono-500.woff2", "500"],
  ["Urbanist", "v2/Urbanist-2.ttf", "500"],
  ["Urbanist", "v2/Urbanist-4.ttf", "700"],
  ["Urbanist", "v2/Urbanist-5.ttf", "800"],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("fonts");
  Promise.all(
    faces.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, { weight });
      document.fonts.add(face);
      return face.load();
    }),
  ).then(() => continueRender(handle));
};
