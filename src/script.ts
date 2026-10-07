// Voiceover lines with start/end in seconds. These are estimates until the
// ElevenLabs take arrives; then they are replaced by word timestamps.
// `caption` overrides on-screen text; `kinetic` lines are typeset by the scene
// itself, so the caption track skips them.
export type Line = { t: number; end: number; text: string; caption?: string; kinetic?: boolean };

// Lines from 15.0s onward sit 1.2s later to make room for the "make no mistakes" beat.
const JOKE = 1.2;
const after = (l: Line): Line => (l.t >= 14.95 ? { ...l, t: l.t + JOKE, end: l.end + JOKE } : l);

const BASE: Line[] = [
  { t: 0.2, end: 1.9, text: "I stopped sending résumés.", kinetic: true },
  { t: 2.3, end: 4.2, text: "Every application asks for the same thing.", kinetic: true },
  { t: 4.4, end: 5.6, text: "Upload your résumé.", kinetic: true },
  { t: 6.0, end: 8.4, text: "But a résumé only tells you where I've worked." },
  { t: 8.8, end: 9.9, text: "Not how I think.", kinetic: true },
  { t: 10.1, end: 11.2, text: "Not what I can build.", kinetic: true },
  { t: 11.4, end: 12.8, text: "Not what I can actually do.", kinetic: true },
  { t: 13.2, end: 14.6, text: "So I opened ChatGPT..." },
  { t: 13.8, end: 14.7, text: "Make no mistakes.", kinetic: true }, // placed explicitly below
  { t: 15.0, end: 16.3, text: "and built this instead." },
  { t: 16.7, end: 17.9, text: "Three live products." },
  { t: 18.2, end: 20.0, text: "Four interactive brand concepts." },
  { t: 20.3, end: 21.8, text: "Ten original experiments." },
  { t: 22.2, end: 24.5, text: "And real campaigns, with real numbers." },
  {
    t: 24.8,
    end: 27.8,
    text: "Almost two thousand Reddit clicks, from fifty-nine dollars.",
    caption: "Almost 2,000 Reddit clicks, from $59.",
  },
  { t: 28.2, end: 29.5, text: "Not a list of skills." },
  { t: 29.8, end: 31.0, text: "Proof of them.", kinetic: true },
  { t: 31.5, end: 33.9, text: "If I'm asking you to bet on what I can do..." },
  { t: 34.2, end: 36.0, text: "you should get more than a PDF." },
  { t: 36.6, end: 37.8, text: "Oh — and this video?" },
  { t: 38.1, end: 39.6, text: "I never opened an editor." },
  { t: 39.8, end: 41.6, text: "AI wrote the whole edit, in code." },
  { t: 42.0, end: 43.4, text: "I don't just talk about AI.", kinetic: true },
  { t: 43.7, end: 44.9, text: "I ship with it.", kinetic: true },
];

export const LINES: Line[] = BASE.map((l) =>
  l.text === "Make no mistakes." ? { ...l, t: 14.95, end: 15.85 } : after(l),
);
