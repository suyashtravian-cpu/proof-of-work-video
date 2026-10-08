import { OffthreadVideo, Sequence, staticFile } from "remotion";
import type { Span } from "../timeline";
import { sec } from "../../timing";

export const REC = staticFile("v2/rec.mp4");
/** The recording is 1708x1080 (site only). */
export const REC_W = 1708;
export const REC_H = 1080;

/**
 * Plays recording spans back to back, each stretched or squeezed to fill `durations`
 * (seconds, same length as spans) starting at `from` (seconds, scene-relative).
 * Rate = span length / duration, so 2 s of footage in 4 s plays at 0.5x.
 */
export const RecSpans: React.FC<{
  spans: Span[];
  durations: number[];
  from?: number;
  style?: React.CSSProperties;
}> = ({ spans, durations, from = 0, style }) => {
  let at = from;
  return (
    <>
      {spans.map(([a, b], i) => {
        const d = durations[i];
        const start = at;
        at += d;
        return (
          <Sequence key={i} from={sec(start)} durationInFrames={Math.max(1, sec(start + d) - sec(start))} layout="none">
            <OffthreadVideo
              src={REC}
              muted
              trimBefore={sec(a)}
              playbackRate={(b - a) / d}
              style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
            />
          </Sequence>
        );
      })}
    </>
  );
};
