/*
 * Ribbons that show direction. A ribbon with a source and a target is filled
 * (or, for a hairline, stroked) with one linear gradient of the ink along its
 * direction, from the middle of its source end to the middle of its target
 * end: dark where the flow starts, fading as it arrives. The flows that lead
 * (the hero's, or the hovered one's) are drawn as they are; the rest are the
 * same gradient pushed back, and ease between the two as the pointer moves.
 * Nothing travels along the ribbon.
 */

/** Ink opacity at the source and at the target. */
const RAMP = [0.9, 0.2] as const;

interface Point {
  x: number;
  y: number;
}

interface FlowGradientProps {
  /** Unique per chart instance: derive it from `useSvgId`. */
  id: string;
  /** The middle of the source end, in the ribbon's own coordinates. */
  start: Point;
  /** The middle of the target end. */
  end: Point;
}

/** The gradient a ribbon paints with; put it in <defs>, one for each ribbon. */
export const FlowGradient = ({ end, id, start }: FlowGradientProps) => (
  <linearGradient
    gradientUnits="userSpaceOnUse"
    id={id}
    x1={start.x}
    x2={end.x}
    y1={start.y}
    y2={end.y}
  >
    <stop offset={0} stopColor="var(--hl-ink)" stopOpacity={RAMP[0]} />
    <stop offset={1} stopColor="var(--hl-ink)" stopOpacity={RAMP[1]} />
  </linearGradient>
);
