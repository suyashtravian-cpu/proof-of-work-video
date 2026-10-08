import type { Line } from "../script";

// Voiceover lines for "Ideas don't sit still" (seconds). Estimated at a natural read
// until the ElevenLabs take arrives; then scripts/build-voiceover.py re-times them.
// No em dashes anywhere on screen.
export const LINES2: Line[] = [
  { t: 0.3, end: 2.9, text: "Ideas don't sit still. Neither do I.", kinetic: true },
  { t: 3.4, end: 8.8, text: "I'm Suyash. I take a \"what if\"... and turn it into something you can actually click." },
  { t: 9.3, end: 12.5, text: "Human curiosity. Machine possibility. Real-world proof.", kinetic: true },
  { t: 13.0, end: 15.8, text: "Biltib. A home for the next good find." },
  { t: 16.1, end: 20.1, text: "Moolank 365. A product I built, and marketed, in English and Hindi." },
  { t: 20.4, end: 24.0, text: "iCreateEpic. A creator platform I seeded with ten original builds." },
  { t: 24.4, end: 28.0, text: "Then I found the first people. Small budgets. Real numbers." },
  {
    t: 28.3,
    end: 31.4,
    text: "Almost two thousand Reddit clicks, from fifty-nine dollars.",
    caption: "Almost 2,000 Reddit clicks, from $59.",
  },
  { t: 31.8, end: 36.8, text: "I design where the click goes next. Four brand concepts, built to help someone decide." },
  { t: 37.2, end: 40.1, text: "Because the interesting part is often after the click." },
  { t: 40.5, end: 42.9, text: "A little strategy. A lot of making.", kinetic: true },
  { t: 43.3, end: 47.5, text: "And a playground of ten experiments... because curiosity deserves a URL." },
  { t: 48.0, end: 50.6, text: "Products. Stories. Campaigns. Experiments.", kinetic: true },
  { t: 50.9, end: 52.9, text: "One mind. Many directions.", kinetic: true },
  { t: 53.4, end: 55.2, text: "So... got a what if?", kinetic: true },
  { t: 55.6, end: 57.0, text: "Let's make it real.", kinetic: true },
];
