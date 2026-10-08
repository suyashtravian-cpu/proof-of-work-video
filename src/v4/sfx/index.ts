import { Cue } from "../../sfx/cue";
import { S, type SceneId } from "../timing";
import { cues as end } from "./end";
import { cues as four } from "./four";
import { cues as hook } from "./hook";
import { cues as one } from "./one";
import { cues as payoff } from "./payoff";
import { cues as three } from "./three";
import { cues as transitions } from "./transitions";
import { cues as two } from "./two";

const BY_SCENE: Record<SceneId, Cue[]> = { hook, one, two, three, four, payoff, end };

/** Every cue in video seconds. No music: voice + these effects only. */
export const SFX: Cue[] = [
  ...(Object.keys(BY_SCENE) as SceneId[]).flatMap((id) => BY_SCENE[id].map(([f, a, v]): Cue => [f, S[id][0] + a, v])),
  ...transitions,
];
