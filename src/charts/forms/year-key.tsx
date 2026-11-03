import { scaleLinear } from "d3-scale";

import { fmtDegC, fmtMonth } from "../../lib/format";
import { glyphBox } from "../glyph-box";
import { GlyphKey } from "../glyph-key";
import { Dot } from "../markers";
import { RING_STEP } from "../marks";
import { DotRing } from "../texture";
import type { MonthValue } from "./radial-year.data";
import { angleOf, fmtRing, polar } from "./year-geometry";

interface YearKeyProps {
  data: MonthValue[];
  width: number;
}

/** Room kept inside the box for the dot and the ring's dots. */
const MARGIN = 6;

/** One month of the year, the warmest: its angle, its distance and a ring named. */
export const YearKey = (props: YearKeyProps) => {
  const { data } = props;
  if (data.length === 0) {
    return null;
  }
  const values = data.map((d) => d.value);
  const peak = values.indexOf(Math.max(...values));
  const month = data[peak];
  const box = glyphBox(props.width);
  const outer = box.size / 2 - MARGIN;
  // The chart's own scale: zero at the centre, the niced maximum at the outer ring.
  const scale = scaleLinear()
    .domain([0, Math.max(...values)])
    .nice(3)
    .range([0, outer]);
  const ring = scale.ticks(3).find((v) => v > 0) ?? 0;
  const angle = angleOf(peak, data.length);
  const dot = polar(angle, scale(month.value));
  const at = (r: number, a: number) => {
    const p = polar(a, r);
    return [box.cx + p.x, box.cy + p.y] as const;
  };
  return (
    <GlyphKey
      box={box}
      label={`How to read one month: ${fmtMonth(month.date)}, ${fmtDegC(month.value)}`}
      parts={[
        {
          at: at(scale(month.value), angle),
          detail: `${fmtDegC(month.value)} mean daily maximum`,
          name: "Distance from centre",
        },
        {
          at: at(outer, angle),
          detail: "Month, clockwise from the top",
          name: "Angle",
        },
        {
          at: at(scale(ring), angle + Math.PI / 2),
          detail: fmtRing(ring),
          name: "Dotted ring",
        },
      ]}
      record={fmtMonth(month.date)}
      width={props.width}
    >
      <g transform={`translate(${box.cx} ${box.cy})`}>
        <DotRing
          cx={0}
          cy={0}
          r={scale(ring)}
          step={RING_STEP.guide}
          tone="fill-l4"
        />
        <DotRing
          cx={0}
          cy={0}
          r={outer}
          step={RING_STEP.guide}
          tone="fill-l4"
        />
        <line
          className="rule shape-smooth"
          x1={0}
          x2={dot.x}
          y1={0}
          y2={dot.y}
        />
        <Dot className="fill-hero" cx={dot.x} cy={dot.y} size="md" />
      </g>
    </GlyphKey>
  );
};
