import type { ScrollTable } from "./scrollData";

/**
 * Turns the recording's jerky wheel scrolls into a smooth camera move.
 * Given a desired page offset `want` (px), pick the recorded frame whose measured scroll offset is
 * closest (ties broken toward `tNom`, so static stretches still play forward), and return the
 * residual `shift` to translate that frame by so the content sits exactly at `want`.
 * Content at page y P then appears at frame y = P - want.
 */
export const scrollTo = (table: ScrollTable, want: number, tNom: number, base = 0): { t: number; shift: number } => {
  let best = table[0];
  let score = Infinity;
  for (const row of table) {
    const s = Math.abs(row[1] + base - want) + 25 * Math.abs(row[0] - tNom);
    if (s < score) {
      score = s;
      best = row;
    }
  }
  // A quarter frame past the frame's start lands on that exact 60 fps frame whether the decoder floors or rounds.
  return { t: best[0] + 0.004, shift: best[1] + base - want };
};
