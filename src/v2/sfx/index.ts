import type { Cue } from "../../sfx/cue";
import { SCENES2, type Scene2Name } from "../timeline";
import { cues as hook } from "./hook";
import { cues as intro } from "./intro";
import { cues as manifesto } from "./manifesto";
import { cues as work } from "./work";
import { cues as campaigns } from "./campaigns";
import { cues as lab } from "./lab";
import { cues as after } from "./after";
import { cues as making } from "./making";
import { cues as playground } from "./playground";
import { cues as onemind } from "./onemind";
import { cues as cta } from "./cta";
import { cues as end } from "./end";

const BY_SCENE: Record<Scene2Name, Cue[]> = {
  Hook: hook,
  Intro: intro,
  Manifesto: manifesto,
  Work: work,
  Campaigns: campaigns,
  Lab: lab,
  After: after,
  Making: making,
  Playground: playground,
  OneMind: onemind,
  Cta: cta,
  End: end,
};

/** All v2 cues in absolute seconds. */
export const SFX2: Cue[] = SCENES2.flatMap((s) => BY_SCENE[s.name].map(([f, at, v]): Cue => [f, s.from + at, v]));
