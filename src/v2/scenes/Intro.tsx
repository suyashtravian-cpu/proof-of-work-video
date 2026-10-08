import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { theme2 } from "../theme";
import { HeroWindow } from "./hook-intro/HeroWindow";
import { LOGO, NameCard } from "./hook-intro/NameCard";
import { Clouds, OuterWorld } from "./hook-intro/Stage";
import { WHIP, WhatIf, WhipLines } from "./hook-intro/WhatIf";
import { NeitherDoI } from "./hook-intro/Words";
import { Bokeh, Brackets, Dust } from "./hook-intro/World";
import { INTRO_AT, tw } from "./hook-intro/util";

/**
 * 3.3 - 9.2 s. Continues the Hook's camera: push into the real hero and a paper name card
 * tethered to the site's logo ("I'm Suyash"), the window recedes and a springy "what if?"
 * chip takes the stage; a pointer clicks it and it morphs into the real
 * "Curiosity. Made tangible." page; a lilac bracket tracks the words to the real button,
 * the pointer clicks it ("...actually click") and the page whips away into the manifesto.
 */
export const Intro: React.FC = () => {
  const T = INTRO_AT + useCurrentFrame() / 30;
  const whip = tw(T, WHIP, 9.2, 0, 1, Easing.in(Easing.cubic));
  const logo = tw(T, 3.58, 3.74, 0, 1) * (1 - tw(T, 4.22, 4.38, 0, 1));
  return (
    <AbsoluteFill style={{ background: theme2.bg, overflow: "hidden" }}>
      <OuterWorld T={T} lift={700 * whip} />
      <HeroWindow
        T={T}
        offset={INTRO_AT}
        overlay={<Brackets x={LOGO[0] - 22} y={LOGO[1] - 22} w={196} h={44} opacity={logo} arm={12} stroke={5} />}
      />
      <Dust T={T} opacity={0.5} />
      <Clouds T={T} lift={900 * whip} />
      <NeitherDoI T={T} />
      <NameCard T={T} />
      <WhatIf T={T} />
      <WhipLines T={T} />
      <Bokeh T={T} opacity={0.85} />
    </AbsoluteFill>
  );
};
