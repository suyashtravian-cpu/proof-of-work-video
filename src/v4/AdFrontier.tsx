// AdFrontier: paid Meta ad (9:16, 1080×1920, 30 fps) for Suyash Kashyap.
// Video 1's look (near-black, white, one red, Hubot Sans + JetBrains Mono, HUD, grain, glitch cuts)
// carrying the frontier-of-AI language: an AI cursor, token-stream captions, thinking beats,
// tool-call receipts, a voice orb, ⌘K palette transitions, one continuous 3D space, verified numbers.
// Audio: the approved voice (public/v3/vo-fast.wav) + sound effects. No music (added by the user).
// Meta safe zone: nothing important above y 270 or below y 1530.
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Grain } from "../components/Grain";
import { loadFonts } from "../fonts";
import { CAPTIONS } from "./captions";
import { COMMANDS, CommandPalette } from "./kit/CommandPalette";
import { GlitchCut } from "./kit/GlitchCut";
import { Hud } from "./kit/Hud";
import { Shot, Space } from "./kit/Space";
import { TokenCaptions } from "./kit/TokenCaptions";
import { ORB_DOCK, VoiceOrb } from "./kit/VoiceOrb";
import { End } from "./scenes/End";
import { Four } from "./scenes/Four";
import { Hook } from "./scenes/Hook";
import { One } from "./scenes/One";
import { Payoff } from "./scenes/Payoff";
import { Three } from "./scenes/Three";
import { Two } from "./scenes/Two";
import { SFX } from "./sfx";
import { enterAt, L, PALETTE, S, sec, word, type SceneId } from "./timing";

loadFonts();

const SCENES: [SceneId, React.FC][] = [
  ["hook", Hook],
  ["one", One],
  ["two", Two],
  ["three", Three],
  ["four", Four],
  ["payoff", Payoff],
  ["end", End],
];
/** Scenes that open on their own hit instead of arriving from depth. */
const NO_ENTER: SceneId[] = ["hook", "end"];

/** Video-second windows in which the docked orb steps aside (add one if a scene needs the spot). */
export const ORB_HIDE: [number, number][] = [];
const ORB_BORN = word(L.person, "I'm");

/** The voice orb, parked above the captions from "I'm" until the end card takes it over. */
const VoiceDock: React.FC = () => {
  const t = useCurrentFrame() / 30;
  if (t < ORB_BORN || t >= S.end[0]) return null;
  const hidden = ORB_HIDE.some(([a, b]) => t > a && t < b);
  if (hidden) return null;
  return <VoiceOrb x={ORB_DOCK.x} y={ORB_DOCK.y} size={ORB_DOCK.size} born={ORB_BORN} />;
};

const Palettes: React.FC = () => (
  <>
    {PALETTE.map((p) => (
      <Sequence key={p.scene} name={`⌘K ${p.scene}`} from={sec(p.at)} durationInFrames={sec(p.select + 0.4 - p.at)} layout="none">
        <CommandPalette at={0} query={COMMANDS[p.item]} select={p.select - p.at} done={PALETTE.filter((q) => q.item < p.item).map((q) => q.item)} />
      </Sequence>
    ))}
  </>
);

export const AdFrontier: React.FC = () => (
  <AbsoluteFill style={{ background: "#080808" }}>
    <Space />
    {SCENES.map(([id, Scene], i) => {
      const [a, b] = S[id];
      return (
        <Sequence key={id} name={id} from={sec(a)} durationInFrames={sec(b) - sec(a)}>
          <Shot dur={b - a} enter={!NO_ENTER.includes(id)} enterAt={enterAt(id)} exit={i < SCENES.length - 1} seed={i}>
            <Scene />
          </Shot>
        </Sequence>
      );
    })}
    <Palettes />
    <VoiceDock />
    <GlitchCut />
    <TokenCaptions lines={CAPTIONS} />
    <Hud />
    <Grain />
    <Audio src={staticFile("v3/vo-fast.wav")} />
    {SFX.map(([file, at, volume], i) => (
      <Sequence key={i} from={sec(at)} name={`sfx ${file}`} layout="none">
        <Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
