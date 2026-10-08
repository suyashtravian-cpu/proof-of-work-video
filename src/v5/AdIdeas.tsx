// AdIdeas: the paid Meta ad (9:16, 1080×1920, 30 fps) in video 2's look ("Ideas don't sit still":
// indigo night, the site's floating-island sky, Urbanist, the floating site window, lilac callouts,
// whips, the drop burst), re-texted to the approved voice. Each scene is one of video 2's, trimmed to
// its slot and re-timed to the spoken words (src/v4/timing.ts holds the corrected word onsets).
// Audio: the voice (public/v3/vo-fast.wav) + video 2's sound effects. No music.
// Meta safe zone: nothing important above y 270 or below y 1530; captions sit at y 1270.
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Captions } from "../components/Captions";
import { Grain } from "../components/Grain";
import { loadFonts } from "../fonts";
import { theme2 } from "../v2/theme";
import { Chapter } from "./components/Chapter";
import { Campaigns } from "./scenes/Campaigns";
import { Cta } from "./scenes/Cta";
import { End } from "./scenes/End";
import { Hook } from "./scenes/Hook";
import { Lab } from "./scenes/Lab";
import { Making } from "./scenes/Making";
import { OneMind } from "./scenes/OneMind";
import { Playground } from "./scenes/Playground";
import { Work } from "./scenes/Work";
import { SFX5 } from "./sfx";
import { END_AT, L, LENGTH, LINES5, S, THREE_SPLIT, sec, word } from "./timing";

loadFonts();

export const LENGTH5 = LENGTH;

/** [name, from, to (video seconds), scene] */
const SCENES: [string, number, number, React.FC][] = [
  ["Hook", S.hook[0], S.hook[1], Hook],
  ["Work (1/4)", S.one[0], S.one[1], Work],
  ["Lab (2/4)", S.two[0], S.two[1], Lab],
  ["Making (3/4)", S.three[0], S.three[0] + THREE_SPLIT, Making],
  ["Playground (3/4)", S.three[0] + THREE_SPLIT, S.three[1], Playground],
  ["Campaigns (4/4)", S.four[0], S.four[1], Campaigns],
  ["OneMind", S.payoff[0], S.payoff[1], OneMind],
  ["Cta", S.end[0], S.end[0] + END_AT, Cta],
  ["End", S.end[0] + END_AT, LENGTH, End],
];

/** The "n/4" label: on the spoken number, until just before its chapter ends. */
const CHAPTERS: { n: number; at: number; to: number }[] = [
  { n: 1, at: word(L.products, "one"), to: S.one[1] },
  { n: 2, at: word(L.tools, "two"), to: S.two[1] },
  { n: 3, at: word(L.creative, "three"), to: S.three[1] },
  { n: 4, at: word(L.campaigns, "four"), to: S.four[1] },
];

export const AdIdeas: React.FC = () => (
  <AbsoluteFill style={{ background: theme2.bg }}>
    {SCENES.map(([name, a, b, Scene]) => (
      <Sequence key={name} name={name} from={sec(a)} durationInFrames={sec(b) - sec(a)}>
        <Scene />
      </Sequence>
    ))}
    {CHAPTERS.map((c) => (
      <Sequence key={c.n} name={`chapter ${c.n}/4`} from={sec(c.at - 0.05)} durationInFrames={sec(c.to) - sec(c.at - 0.05)} layout="none">
        <Chapter n={c.n} at={0.05} out={c.to - c.at - 0.2} />
      </Sequence>
    ))}
    <Captions lines={LINES5} y={1270} font={theme2.display} accent={theme2.lilacSoft} />
    <Grain />
    <Audio src={staticFile("v3/vo-fast.wav")} />
    {SFX5.map(([file, at, volume], i) => (
      <Sequence key={i} from={sec(at)} name={`sfx ${file}`} layout="none">
        <Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
