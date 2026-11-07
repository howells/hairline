import { glyphBox } from "../glyph-box";
import { GlyphKey } from "../glyph-key";
import { CrossHatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { FlareWedge } from "./flare-wedge";
import { zoomFlare } from "./flare-zoom";
import type { PatchworkEvent } from "./radial-patchwork.data";
import { clock, hhmm } from "./util-a";

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

/** An arc of the inner ring between two clock angles. */
const ringPath = (
  dial: { cx: number; cy: number; r0: number },
  [a0, a1]: readonly [number, number]
) => {
  const [x0, y0] = clock(dial.cx, dial.cy, dial.r0, a0);
  const [x1, y1] = clock(dial.cx, dial.cy, dial.r0, a1);

  return `M${x0} ${y0}A${dial.r0} ${dial.r0} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

/**
 * One real flare drawn to fill the key's box (the dial zoomed to the flare,
 * not at the chart's scale), its start, width, reach and hatch named.
 */
export const FlareKey = (props: FlareKeyProps) => {
  const hero = useTextureIds("flare-key")("hero");
  const flare = exemplarOf(props.data);

  if (flare === null) {
    return null;
  }

  const box = glyphBox(props.width);

  const { dial, ring, span } = zoomFlare(
    box,
    flare,
    Math.max(1, ...props.data.map((d) => d.size))
  );

  const mid = (span.a0 + span.a1) / 2;
  const middle = (dial.r0 + span.reach) / 2;
  const meaning = `${props.outlined.charAt(0).toUpperCase()}${props.outlined.slice(1)}`;

  return (
    <GlyphKey
      box={box}
      defs={<CrossHatch id={hero} tone="fill-hero" />}
      label={`How to read one flare: ${flare.label} at ${hhmm(flare.hour)} UTC`}
      parts={[
        {
          at: clock(dial.cx, dial.cy, middle, span.a0),
          detail: `${hhmm(flare.hour)} UTC`,
          name: "Start time",
        },
        {
          at: clock(dial.cx, dial.cy, span.reach, mid),
          detail: `${flare.minutes} minutes`,
          name: "Width",
        },
        {
          at: clock(dial.cx, dial.cy, middle, span.a1),
          detail: `Peak ${flare.label}`,
          name: "Reach",
        },
        ...(flare.flagged === true
          ? [
              {
                at: clock(
                  dial.cx,
                  dial.cy,
                  dial.r0 + (span.reach - dial.r0) * 0.3,
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
      <path className="rule shape-smooth fill-none" d={ringPath(dial, ring)} />
      <FlareWedge dial={dial} fill={paint(hero)} span={span} />
    </GlyphKey>
  );
};
