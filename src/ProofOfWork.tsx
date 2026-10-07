import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Captions } from "./components/Captions";
import { Grain } from "./components/Grain";
import { loadFonts } from "./fonts";
import { Bet } from "./scenes/Bet";
import { Hook } from "./scenes/Hook";
import { Prompt } from "./scenes/Prompt";
import { Proof } from "./scenes/Proof";
import { Resume } from "./scenes/Resume";
import { Ship } from "./scenes/Ship";
import { Skills } from "./scenes/Skills";
import { Twist } from "./scenes/Twist";
import { theme } from "./theme";
import { MUSIC, MUSIC_VOLUME, SCENES, SFX, VOICEOVER } from "./timeline";
import { sec } from "./timing";

loadFonts();

const COMPONENTS: Record<(typeof SCENES)[number]["name"], React.FC> = {
  Hook,
  Résumé: Resume,
  Prompt,
  Proof,
  Skills,
  Bet,
  Twist,
  Ship,
};

export const ProofOfWork: React.FC = () => (
  <AbsoluteFill style={{ background: theme.bg }}>
    {SCENES.map((s) => {
      const Scene = COMPONENTS[s.name];
      return (
        <Sequence key={s.name} name={s.name} from={sec(s.from)} durationInFrames={sec(s.to) - sec(s.from)}>
          <Scene />
        </Sequence>
      );
    })}
    <Captions />
    <Grain />
    {SFX.map(([file, at, volume], i) => (
      <Sequence key={i} from={sec(at)} name={`sfx ${file}`} layout="none">
        <Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} />
      </Sequence>
    ))}
    {VOICEOVER && <Audio src={staticFile(VOICEOVER)} />}
    {MUSIC && <Audio src={staticFile(MUSIC)} volume={MUSIC_VOLUME} />}
  </AbsoluteFill>
);
