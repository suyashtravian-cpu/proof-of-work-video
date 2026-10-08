import { AbsoluteFill, useCurrentFrame } from "remotion";
import { shakeAt } from "../../fx/shake";
import { Thinking } from "../kit/Thinking";
import { OT } from "./one-two/beats";
import { Days } from "./one-two/Days";
import { Deck, ROW_Y, Tracking } from "./one-two/Deck";

// 4.8–9.75  1/4 PRODUCTS. "One. I build products. | From idea to live in days, not months."
// (⌘K "build product" is the composition's; this scene's content starts at enterAt = 0.56.)
// thinking → deploy(biltib) ✓ as Biltib slams in → iCreateEpic → Moolank 365, the older builds
// stepping back into a deck, red brackets on the newest (LIVE BUILD 01/02/03). On "live" the brackets
// open around all three (3 / 3 LIVE); on "in" the deck flies back into depth; "days" slams in,
// "not months" lands, and the AI cursor drags a red strike through "months".

export const One: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const [sx, sy, sr] = shakeAt(t, [...OT.slams, OT.days], 14, 0.24);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg)`, transformOrigin: "540px 760px" }}>
        {/* just under the receipt row, clear of the ⌘K palette that is still flying out; deploy(biltib) takes over */}
        <Thinking at={OT.think} dur={OT.slams[0] + 0.01 - OT.think} y={ROW_Y + 30} text="thinking · planning 3 deploys…" size={30} />
        <Deck t={t} />
        <Tracking t={t} frame={f} />
        <Days t={t} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
