// Scene placement (video seconds) and the parts of the screen recording each scene uses.
// Recording times are in public/v2/rec.mp4 (the user's capture, cropped to the site,
// starting 10 s into the original). The music drop lands on "Work" at 12.9 s.
export const LENGTH2 = 61.0;
export const DROP2 = 12.9;

/** [recording start, recording end] in seconds. */
export type Span = [number, number];

export const SCENES2 = [
  { name: "Hook", from: 0, to: 3.3, rec: [[1.0, 4.3]] as Span[], note: "hero: 'Ideas don't sit still' + floating island" },
  { name: "Intro", from: 3.3, to: 9.2, rec: [[4.3, 7.2], [15.0, 17.0]] as Span[], note: "hero, then 'Curiosity. Made tangible.'" },
  { name: "Manifesto", from: 9.2, to: 12.9, rec: [[17.0, 21.6]] as Span[], note: "marquee, then 'Human curiosity. Machine possibility. Real-world proof.'" },
  { name: "Work", from: 12.9, to: 24.3, rec: [[22.0, 24.8], [24.6, 26.0], [26.0, 28.0]] as Span[], note: "Biltib card, Moolank 365 card, iCreateEpic card" },
  { name: "Campaigns", from: 24.3, to: 31.6, rec: [[28.0, 32.5]] as Span[], note: "'Then, find the first people.' + campaign tabs and 112 panel + marquee" },
  { name: "Lab", from: 31.6, to: 37.2, rec: [[32.5, 36.6]] as Span[], note: "'Give the click somewhere good to go.' conversion lab cards" },
  { name: "After", from: 37.2, to: 40.4, rec: [[36.5, 38.8]] as Span[], note: "'The interesting part is often after the click.'" },
  { name: "Making", from: 40.4, to: 43.2, rec: [[39.5, 41.0], [43.8, 45.8]] as Span[], note: "'Beyond the usual.' then 'A little strategy. A lot of making.' creative" },
  { name: "Playground", from: 43.2, to: 47.8, rec: [[47.0, 58.5]] as Span[], note: "'Always in motion' / 'Curiosity, with a URL.' and the 10 artifacts carousel" },
  { name: "OneMind", from: 47.8, to: 53.2, rec: [[59.0, 65.5]] as Span[], note: "'One mind. Many directions.' connection graph" },
  { name: "Cta", from: 53.2, to: 57.4, rec: [[66.0, 69.5]] as Span[], note: "'Have a what if?' with the iridescent ring" },
  { name: "End", from: 57.4, to: 61.0, rec: [] as Span[], note: "end card: name, 'AI creator. Independent builder.', pilotaccess.com/suyashpow" },
] as const;

export type Scene2Name = (typeof SCENES2)[number]["name"];
