import type { SVGProps } from "react";

import { DOT, RING_WEIGHT } from "./marks";
import type { DotSize, RingWeight } from "./marks";

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
