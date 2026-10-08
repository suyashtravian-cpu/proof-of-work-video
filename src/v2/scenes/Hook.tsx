import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme2 } from "../theme";
import { HeroWindow } from "./hook-intro/HeroWindow";
import { Clouds, OuterWorld } from "./hook-intro/Stage";
import { HookTag, HookWords, NDI_LABEL, NeitherDoI } from "./hook-intro/Words";
import { Bokeh, Brackets, Dust } from "./hook-intro/World";
import { HOOK_AT, PULL, tw } from "./hook-intro/util";

/**
 * 0 - 3.3 s. Full-bleed inside the site's sky: "Ideas / don't / sit still." fly at the lens
 * and refuse to settle, the chrome ring orbits "don't". The camera pulls back through the
 * clouds, the sky collapses into the floating site window and every word lands on its twin
 * in the real hero headline. "Neither do I." snaps in, tracked from the hero's own label.
 */
export const Hook: React.FC = () => {
  const T = HOOK_AT + useCurrentFrame() / 30;
  const q = tw(T, 1.45, 2.05, 0, 1, PULL);
  const roll = -2.6 * Math.sin(Math.PI * q);
  const label = tw(T, 1.98, 2.12, 0, 1) * (1 - tw(T, 3.1, 3.3, 0, 1));
  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotate(${roll}deg) scale(${1 + Math.abs(roll) * 0.02})` }}>
        <OuterWorld T={T} />
        <HeroWindow
          T={T}
          offset={HOOK_AT}
          overlay={<Brackets x={NDI_LABEL[0] - 52} y={NDI_LABEL[1] - 14} w={104} h={28} opacity={label} arm={10} stroke={4} />}
        />
        <Clouds T={T} />
        <Dust T={T} opacity={0.5} />
        <Bokeh T={T} opacity={0.6} />
        <HookWords T={T} />
        <NeitherDoI T={T} />
        <HookTag T={T} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
