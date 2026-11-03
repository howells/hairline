import type { SVGProps } from "react";

import { DOT } from "./marks";
import type { DotSize } from "./marks";
import { Label } from "./text";
import { cx, sansWidth } from "./util";

type DotProps = Omit<SVGProps<SVGCircleElement>, "r" | "strokeWidth"> & {
  size?: DotSize;
};

/**
 * A hero dot: solid ink on a paper ring one pixel wide, so it separates from
 * the context beneath. The stroke is painted first, so the dot keeps its size.
 */
export const HeroDot = ({ className, size = "md", ...rest }: DotProps) => (
  <circle
    className={cx("fill-hero stroke-paper", className)}
    paintOrder="stroke"
    r={DOT[size]}
    strokeWidth={2}
    {...rest}
  />
);

/** Gap between the dot's edge and the leader, and the leader's run. */
const LEAD = { gap: 3, run: 14 } as const;

interface HeroLabelProps {
  /** The line under the name: how many records the hero holds. */
  count: string;
  /** The dot the leader starts from. */
  dot: { x: number; y: number };
  name: string;
  size?: DotSize;
  /** The svg's width: the label turns to the left when it would overrun. */
  width: number;
}

/**
 * Names the hero group directly on the chart: a thin leader up from a hero
 * dot, the name in ink on a halo and a count beneath it.
 */
export const HeroLabel = ({
  count,
  dot,
  name,
  size = "md",
  width,
}: HeroLabelProps) => {
  const room =
    Math.max(sansWidth(name, 11), sansWidth(count, 11)) + LEAD.run + 8;
  const turn = dot.x + room > width ? -1 : 1;
  const edge = (DOT[size] + LEAD.gap) * Math.SQRT1_2;
  const from = { x: dot.x + turn * edge, y: dot.y - edge };
  const to = { x: dot.x + turn * LEAD.run, y: dot.y - LEAD.run };
  return (
    <g className="fade">
      <line
        className="stroke-rule"
        x1={from.x}
        x2={to.x}
        y1={from.y}
        y2={to.y}
      />
      <Label
        anchor={turn === 1 ? "start" : "end"}
        voice="label"
        x={to.x + turn * 4}
        y={to.y}
      >
        {name}
      </Label>
      <Label
        anchor={turn === 1 ? "start" : "end"}
        muted
        voice="axis"
        x={to.x + turn * 4}
        y={to.y + 14}
      >
        {count}
      </Label>
    </g>
  );
};
