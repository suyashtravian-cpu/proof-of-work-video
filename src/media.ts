// Paths are relative to public/. Drop files in public/media/ (not committed)
// and point these at them. Empty values render clean placeholders.
export const media = {
  siteUrl: "yoursite.com",
  siteFullPage: "" as string,           // e.g. "media/site-full.png"
  sections: [] as string[],             // one screenshot per montage beat
  voiceover: "" as string,              // e.g. "media/vo.wav"
  music: "" as string,
};
