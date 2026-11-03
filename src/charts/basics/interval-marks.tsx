import { area as d3area } from "d3-shape";

import { Label } from "../text";
import { DottedLine, PlateLabel } from "../texture";
import { TEXTURE_PITCH } from "../texture-ids";
import { END_GAP, nameSlots } from "./intervals";
import type { Band } from "./intervals";

interface BandProps {
  bands: readonly Band[];
  x: (i: number) => number;
  y: (v: number) => number;
}

/** The bands as solid ramp shapes: the widest palest, the next one a step darker. */
export const IntervalBands = ({ bands, x, y }: BandProps) => (
  <g className="fade">
    {bands.map((band, k) => (
      <path
        className={k === 0 ? "fill-l6" : "fill-l5"}
        d={
          d3area<Band["points"][number]>()
            .x((p) => x(p.i))
            .y0((p) => y(p.low))
            .y1((p) => y(p.high))(band.points) ?? ""
        }
        key={band.coverage}
      />
    ))}
  </g>
);

/**
 * Each band named by its coverage, on a paper plate inside the plot: ending
 * just inside the band's end and standing above its upper edge, so the name
 * reads as the band's own and the plot keeps its full width. Names that
 * would touch are spread apart.
 */
export const IntervalNames = ({
  bands,
  bounds,
  x,
  y,
}: BandProps & { bounds: readonly [number, number] }) => {
  const names = nameSlots(bands, { bounds, x, y });
  return (
    <g className="fade">
      {names.map(({ band, x: at, y: height }) => (
        <PlateLabel
          anchor="end"
          className="t-axis"
          key={band.coverage}
          text={band.label}
          x={at}
          y={height}
        />
      ))}
    </g>
  );
};

/** The rule where a forecast begins, dotted, with its name beside the top. */
export const ForecastRule = (props: {
  label: string;
  top: number;
  bottom: number;
  x: number;
}) => (
  <g className="fade">
    <DottedLine
      pitch={TEXTURE_PITCH.dense}
      tone="fill-l4"
      x0={props.x}
      x1={props.x}
      y0={props.top}
      y1={props.bottom}
    />
    <Label halo muted voice="axis" x={props.x + END_GAP} y={props.top - 4}>
      {props.label}
    </Label>
  </g>
);
