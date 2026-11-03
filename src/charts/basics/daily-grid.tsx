import type { ScaleLinear } from "d3-scale";
import type { CSSProperties } from "react";

import { axisFormat } from "../../lib/format";
import type { Box } from "../label-box";
import { ValueGrid } from "../value-grid";

interface Props {
  /** Boxes the values keep clear of: the hero's and the latest day's value labels. */
  clear: readonly Box[];
  floor: number;
  format: (v: number) => string;
  ticks: number[];
  /** The format is the default whole number, which the axis may refine. */
  wholeNumbers: boolean;
  x0: number;
  x1: number;
  y: ScaleLinear<number, number>;
}

/** The daily charts' value grid: values on the right, sitting on their rules. */
export const DailyGrid = (props: Props) => (
  <ValueGrid
    clear={props.clear}
    floor={props.floor}
    format={axisFormat(props.format, props.wholeNumbers, props.ticks)}
    labelFloor
    side="right"
    ticks={props.ticks}
    x0={props.x0}
    x1={props.x1}
    y={props.y}
  />
);

/** The line through the readings, drawn in on entry. */
export const DailyLine = (props: { d: string; style?: CSSProperties }) => (
  <path
    className="draw stroke-l3 stroke-medium cap-round fill-none"
    d={props.d}
    pathLength={1}
    style={props.style}
  />
);
