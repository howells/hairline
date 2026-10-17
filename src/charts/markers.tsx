import type { SVGProps } from "react";

import { crisp } from "./axes";
import { DOT, RING_WEIGHT } from "./marks";
import type { DotSize, RingWeight } from "./marks";
import { barPath } from "./shapes";
import type { CapDirection } from "./shapes";
import { cx } from "./util";

type CircleProps = Omit<SVGProps<SVGCircleElement>, "r" | "strokeWidth">;

/** A solid point marker of one of the four sizes; tone and motion via className. */
export const Dot = ({
  size = "sm",
  ...rest
}: CircleProps & { size?: DotSize }) => <circle r={DOT[size]} {...rest} />;

/**
 * A hollow point marker: paper inside a ring whose outer edge sits exactly
 * on the size's radius, the stroke drawn inside it. Pass the stroke tone in
 * className; `open` leaves the inside see-through instead of paper.
 */
export const Ring = ({
  className = "",
  open = false,
  size = "sm",
  weight = "rest",
  ...rest
}: CircleProps & { open?: boolean; size?: DotSize; weight?: RingWeight }) => {
  const sw = RING_WEIGHT[weight];
  return (
    <circle
      className={`${open ? "fill-none" : "fill-paper"} ${className}`}
      r={DOT[size] - sw / 2}
      strokeWidth={sw}
      {...rest}
    />
  );
};

type BarProps = Omit<SVGProps<SVGPathElement>, "d" | "fill"> & {
  /** The way the bar grows from its base; its outer end is rounded. */
  dir: CapDirection;
  /**
   * A texture, `paint(id)`: the bar is engraved inside a crisp 1px outline.
   * Omit for a solid bar, toned by a fill class in className.
   */
  fill?: string;
  /** Outer box, base included: x, y, width and height in px. */
  h: number;
  /** The engraved outline's tone. */
  outline?: string;
  w: number;
  x: number;
  y: number;
};

/**
 * A bar, square at its base and rounded at its outer end. Solid bars sit
 * where the scale puts them; an engraved bar snaps its outline to the
 * half pixel and runs a whole number of px along its length, one less
 * across it, so the outline is crisp on every side.
 */
export const Bar = ({
  className,
  dir,
  fill,
  h,
  outline = "stroke-l5",
  w,
  x,
  y,
  ...rest
}: BarProps) => {
  if (fill === undefined) {
    return (
      <path className={className} d={barPath(x, y, w, h, dir)} {...rest} />
    );
  }
  const upright = dir === "up" || dir === "down";
  const left = crisp(x);
  const top = crisp(y);
  return (
    <path
      className={cx("shape-crisp", outline, className)}
      d={barPath(
        left,
        top,
        upright ? Math.round(w) - 1 : Math.round(x + w) - Math.round(x),
        upright ? Math.round(y + h) - Math.round(y) : Math.round(h) - 1,
        dir
      )}
      fill={fill}
      strokeWidth={1}
      {...rest}
    />
  );
};
