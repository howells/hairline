import { glyphBox } from "../glyph-box";
import { GlyphKey } from "../glyph-key";
import { CrossHatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { FlareWedge } from "./flare-wedge";
import type { PatchworkEvent } from "./radial-patchwork.data";
import { clock, hhmm, spanOf } from "./util-a";
import type { Dial } from "./util-a";

interface FlareKeyProps {
  data: PatchworkEvent[];
  /** What a flagged wedge means, e.g. "class M or stronger". */
  outlined: string;
  width: number;
}

/** The flare the key draws: the longest flagged one, else the longest. */
const exemplarOf = (data: PatchworkEvent[]) => {
  const flagged = data.filter((d) => d.flagged === true);
  let best: PatchworkEvent | null = null;
  for (const d of flagged.length > 0 ? flagged : data) {
    if (best === null || d.minutes > best.minutes) {
      best = d;
    }
  }
  return best;
};

/** One real flare drawn large on its own dial, its start, width, reach and hatch named. */
export const FlareKey = (props: FlareKeyProps) => {
  const hero = useTextureIds("flare-key")("hero");
  const flare = exemplarOf(props.data);
  if (flare === null) {
    return null;
  }
  const box = glyphBox(props.width);
  // The chart's own proportions, drawn to fill the box.
  const R = box.size / 2 - 4;
  const dial: Dial = { R, cx: box.cx, cy: box.cy, r0: R * 0.12 };
  const span = spanOf(
    dial,
    flare,
    Math.max(1, ...props.data.map((d) => d.size))
  );
  const mid = (span.a0 + span.a1) / 2;
  const meaning = `${props.outlined.charAt(0).toUpperCase()}${props.outlined.slice(1)}`;
  return (
    <GlyphKey
      box={box}
      defs={<CrossHatch id={hero} tone="fill-hero" />}
      label={`How to read one flare: ${flare.label} at ${hhmm(flare.hour)} UTC`}
      parts={[
        {
          at: clock(dial.cx, dial.cy, dial.R, span.a0),
          detail: `${hhmm(flare.hour)} UTC`,
          name: "Start time",
        },
        {
          at: clock(dial.cx, dial.cy, (span.reach + dial.r0) / 2, span.a1),
          detail: `${flare.minutes} minutes`,
          name: "Width",
        },
        {
          at: clock(dial.cx, dial.cy, span.reach, mid),
          detail: `Peak ${flare.label}`,
          name: "Reach",
        },
        ...(flare.flagged === true
          ? [
              {
                at: clock(
                  dial.cx,
                  dial.cy,
                  dial.r0 + (span.reach - dial.r0) * 0.25,
                  mid
                ),
                detail: meaning,
                name: "Crosshatch",
              },
            ]
          : []),
      ]}
      record={`${flare.label}, ${hhmm(flare.hour)} UTC`}
      width={props.width}
    >
      <circle
        className="rule shape-smooth fill-none"
        cx={dial.cx}
        cy={dial.cy}
        r={dial.R}
      />
      <circle
        className="rule shape-smooth fill-none"
        cx={dial.cx}
        cy={dial.cy}
        r={dial.r0}
      />
      <FlareWedge dial={dial} fill={paint(hero)} span={span} />
    </GlyphKey>
  );
};
