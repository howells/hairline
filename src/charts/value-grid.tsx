import type { ScaleLinear } from "d3-scale";

import { crisp } from "./axes";
import { labelBox, touches } from "./label-box";
import type { Box } from "./label-box";

/** How far a right-hand value sits above its rule, baseline to rule, in px. */
const RIDE = 4;

/** Air kept between a value and a label it gives way to, px. */
const CLEAR = 8;

interface ValueGridProps {
  /**
   * Boxes the right-hand scale's values keep clear of, such as a value
   * label by the latest data: a value that would touch one is not printed
   * (its rule stays).
   */
  clear?: readonly Box[];
  /** Rules are drawn only above this y; the baseline itself is the chart's own. */
  floor: number;
  format: (v: number) => string;
  /** Keep the label of a tick on or below `floor` (its rule is still the baseline's). */
  labelFloor?: boolean;
  /**
   * Left (default): values right-aligned in the margin left of `x0`. Right:
   * the financial page's value scale, each value right-aligned to `x1` and
   * sitting on its rule, next to the latest data.
   */
  side?: "left" | "right";
  /** Print the values (default true); false keeps the rules, as the later columns of small multiples do. */
  labels?: boolean;
  /** Tick values, usually `y.ticks(n)`. */
  ticks: readonly number[];
  x0: number;
  x1: number;
  y: ScaleLinear<number, number>;
}

/** Solid 1px value rules across the plot, each with its value: the one value grid. */
export const ValueGrid = (props: ValueGridProps) => {
  const right = props.side === "right";
  return (
    <g>
      {props.ticks.flatMap((v) => {
        const at = props.y(v);
        const ruled = at < props.floor - 1;
        const text = props.format(v);
        const shown =
          props.labels !== false &&
          (!right ||
          !(props.clear ?? []).some((b) =>
            touches(
              b,
              labelBox(
                text,
                Math.round(props.x1),
                Math.round(at) - RIDE,
                "end"
              ),
              CLEAR
            )
          ));
        if (!ruled && props.labelFloor !== true) {
          return [];
        }
        return (
          <g key={v}>
            {ruled ? (
              <line
                className="grid-line"
                x1={Math.round(props.x0)}
                x2={Math.round(props.x1)}
                y1={crisp(at)}
                y2={crisp(at)}
              />
            ) : null}
            {shown ? (
              <text
                className="t-axis t-halo"
                dy={right ? undefined : "0.34em"}
                textAnchor="end"
                x={right ? Math.round(props.x1) : props.x0 - 8}
                y={right ? Math.round(at) - RIDE : at}
              >
                {text}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};
