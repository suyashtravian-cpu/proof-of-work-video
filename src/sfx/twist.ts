import { Cue, range } from "./cue";

// Scene-relative sound cues for twist (beats from src/scenes/Twist.tsx).
export const cues: Cue[] = [
  ["hit", 0.0, 0.45], // the video freezes and zooms out into a film strip
  ["whoosh", 0.4, 0.4], // tape starts rewinding
  ...range(0.5, 1.14, 0.06).map((t): Cue => ["click", t, 0.12]), // frames ticking past
  ["hit", 1.22, 0.3], // playhead whips to NOW
  ["whoosh", 1.5, 0.35], // strip leaves, timeline rises
  ["hit", 1.95, 0.6], // NEVER OPENED stamp
  ["whoosh", 2.3, 0.35], // timeline flips over into code
  ...range(2.8, 3.15, 0.07).map((t): Cue => ["click", t, 0.15]), // line sweep
  ["whoosh", 3.13, 0.4],
  ["hit", 3.37, 0.4], // IDE lands
  ...[3.57, 3.87, 4.15].map((t): Cue => ["click", t, 0.3]), // key-line tags
  ["whoosh", 4.1, 0.25], // git log slides in
  ...range(5.2, 5.48, 0.04).map((t): Cue => ["click", t, 0.08]), // typing
];
