import type { CSSProperties } from "react";

import { sectorPath } from "./util-a";
import type { Dial, Span } from "./util-a";

/** One flagged flare: a wedge crosshatched in the hero colour inside a 1px rule. */
export const FlareWedge = (props: {
  className?: string;
  dial: Dial;
  /** The crosshatch, `paint(id)`. */
  fill: string;
  span: Span;
  style?: CSSProperties;
}) => (
  <path
    className={`stroke-hero ${props.className ?? ""}`}
    d={sectorPath(
      props.dial.cx,
      props.dial.cy,
      props.dial.r0,
      props.span.reach,
      props.span.a0,
      props.span.a1
    )}
    fill={props.fill}
    strokeLinejoin="round"
    strokeWidth={1}
    style={props.style}
  />
);
