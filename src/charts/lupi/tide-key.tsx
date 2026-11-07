import { scaleLinear } from "d3-scale";

import { glyphBox } from "../glyph-box";
import { GlyphKey } from "../glyph-key";
import { Dot } from "../markers";
import { Stem, VRule } from "../rules";
import type { BarcodeDatum } from "./barcode-lollipop.data";
import { argMax } from "./util-b";

interface TideKeyProps {
  data: BarcodeDatum[];
  day: (d: Date) => string;
  format: (v: number) => string;
  width: number;
}

/** A day's low water: its own, else the chart's 90% of the high. */
const lowOf = (d: BarcodeDatum) => d.low ?? d.value * 0.9;

/** The day the key draws: the highest high water, the chart's hero. */
export const TideKey = (props: TideKeyProps) => {
  const { data } = props;

  if (data.length === 0) {
    return null;
  }

  const day = data[argMax(data.map((d) => d.value))];
  const low = lowOf(day);
  const box = glyphBox(props.width);
  const top = box.cy - box.size / 2;

  // The chart's own scale: lowest low to highest high, over the barcode's height.
  const y = scaleLinear()
    .domain([
      Math.min(...data.map(lowOf)),
      Math.max(...data.map((d) => d.value)),
    ])
    .range([top + box.size - 6, top + 22]);

  return (
    <GlyphKey
      box={box}
      label={`How to read one day: ${props.day(day.date)}, high ${props.format(day.value)}, low ${props.format(low)}`}
      parts={[
        {
          at: [box.cx, y(day.value)],
          detail: `Dot, ${props.format(day.value)}`,
          name: "High water",
        },
        {
          at: [box.cx, y(low)],
          detail: `Stem foot, ${props.format(low)}`,
          name: "Low water",
        },
        {
          at: [box.cx, top + 2],
          detail: "One hairline each",
          name: "Day",
        },
      ]}
      record={props.day(day.date)}
      width={props.width}
    >
      <VRule
        className="grid-line"
        kind="plain"
        x={box.cx}
        y0={top}
        y1={top + box.size}
      />
      <Stem
        className="stroke-hero"
        hero
        x={box.cx}
        y0={y(day.value)}
        y1={y(low)}
      />
      <Dot
        className="fill-hero"
        cx={Math.round(box.cx)}
        cy={y(day.value)}
        size="md"
      />
    </GlyphKey>
  );
};
