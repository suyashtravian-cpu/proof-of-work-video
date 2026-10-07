import { SCENES } from "../timeline";
import { Cue } from "./cue";
import { cues as bet } from "./bet";
import { cues as hook } from "./hook";
import { cues as proof } from "./proof";
import { cues as prompt } from "./prompt";
import { cues as resume } from "./resume";
import { cues as ship } from "./ship";
import { cues as skills } from "./skills";
import { cues as twist } from "./twist";

const BY_SCENE: Record<(typeof SCENES)[number]["name"], Cue[]> = {
  Hook: hook,
  Résumé: resume,
  Prompt: prompt,
  Proof: proof,
  Skills: skills,
  Bet: bet,
  Twist: twist,
  Ship: ship,
};

/** All cues in absolute seconds. */
export const SFX: Cue[] = SCENES.flatMap((s) => BY_SCENE[s.name].map(([f, at, v]): Cue => [f, s.from + at, v]));
