import { AbsoluteFill, useCurrentFrame } from "remotion";
import { shakeAt } from "../../fx/shake";
import { AiCursor } from "../kit/AiCursor";
import { Thinking } from "../kit/Thinking";
import { TT } from "./one-two/beats";
import { Flyers, Ghosts, PromptPanel } from "./one-two/Prompt";
import { ToolCards } from "./one-two/Tools";
import { LAND, P, TOOLS_CURSOR } from "./one-two/toolsLayout";

// 9.75–15.45  2/4 TOOLS. "Two. Interactive tools that help people decide. | Quizzes. Calculators. Fit finders."
// (⌘K "design tool" is the composition's; this scene's content starts at enterAt = 0.54.)
// The AI cursor clicks into a prompt and types "build a quiz, a calculator and a fit finder", sends it,
// thinks; then prompt → product: the panel splits into three cards while the prompt's letters fly
// and land as the card titles (quiz / calculator / fit finder), each body renders behind a scanline
// as its render() call resolves, every card tagged CONCEPT. As each tool is named, the wheel brings it
// forward and the cursor operates it: answers the quiz, drags the calculator (EXAMPLE OUTPUT), picks a fit.

export const Two: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const [sx, sy, sr] = shakeAt(t, [TT.morph + 0.05, TT.result], 9, 0.22);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg)`, transformOrigin: "540px 700px" }}>
        <PromptPanel t={t} />
        <Thinking at={TT.think} dur={0.4} y={P.y + P.h + 56} text="thinking · planning 3 tools…" size={30} />
        <Ghosts t={t} />
        {/* own stacking context, so the flyers and the AI cursor always paint above the cards */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <ToolCards t={t} land={LAND} />
        </div>
        <Flyers t={t} land={LAND} />
        <AiCursor path={TOOLS_CURSOR} from={TT.cursorIn} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
