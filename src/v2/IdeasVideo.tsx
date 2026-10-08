import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Captions } from "../components/Captions";
import { Grain } from "../components/Grain";
import { loadFonts } from "../fonts";
import { sec } from "../timing";
import { After } from "./scenes/After";
import { Campaigns } from "./scenes/Campaigns";
import { Cta } from "./scenes/Cta";
import { End } from "./scenes/End";
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Lab } from "./scenes/Lab";
import { Making } from "./scenes/Making";
import { Manifesto } from "./scenes/Manifesto";
import { OneMind } from "./scenes/OneMind";
import { Playground } from "./scenes/Playground";
import { Work } from "./scenes/Work";
import { LINES2 } from "./script";
import { SFX2 } from "./sfx";
import { theme2 } from "./theme";
import { SCENES2, type Scene2Name } from "./timeline";

loadFonts();

const COMPONENTS: Record<Scene2Name, React.FC> = { Hook, Intro, Manifesto, Work, Campaigns, Lab, After, Making, Playground, OneMind, Cta, End };

// Music and voice are mixed in post (scripts/mix-audio.py); "full" also plays them here for previews.
export type IdeasProps = { audio?: "full" | "sfx" };
export const VOICEOVER2: string | null = null;
export const MUSIC2: string | null = "music/v2-electro-dreams.wav";

export const IdeasVideo: React.FC<IdeasProps> = ({ audio = "full" }) => (
  <AbsoluteFill style={{ background: theme2.bg }}>
    {SCENES2.map((s) => {
      const Scene = COMPONENTS[s.name];
      return (
        <Sequence key={s.name} name={s.name} from={sec(s.from)} durationInFrames={sec(s.to) - sec(s.from)}>
          <Scene />
        </Sequence>
      );
    })}
    <Captions lines={LINES2} font={theme2.display} accent={theme2.lilacSoft} />
    <Grain />
    {SFX2.map(([file, at, volume], i) => (
      <Sequence key={i} from={sec(at)} name={`sfx ${file}`} layout="none">
        <Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} />
      </Sequence>
    ))}
    {audio === "full" && VOICEOVER2 && <Audio src={staticFile(VOICEOVER2)} />}
    {audio === "full" && MUSIC2 && <Audio src={staticFile(MUSIC2)} volume={0.6} />}
  </AbsoluteFill>
);
