import type { SVGProps } from "react";

import { crisp } from "./axes";
import { STEM, TICK } from "./marks";
import type { TickSize } from "./marks";
import { CURSOR, GRID_H, GRID_V, RULE_TARGET, RULE_ZERO } from "./roles";
import { cx } from "./util";

/*
 * Rules: every straight 1px line a chart draws across its plot (baselines,
 * gridlines, row tracks, targets, the cursor) and the short marks that
 * stand on them (stems and ticks). Each snaps to the pixel grid itself, so
 * pass the raw coordinate: crisp() is not idempotent, and a coordinate
 * snapped twice lands a pixel off.
 */

/**
 * What a rule is for, which sets its tone and dash. "plain" sets nothing:
 * the tone comes in className.
 */
export type RuleKind =
  | "cursor"
  | "grid"
  | "hairline"
  | "plain"
  | "rule"
  | "target";

const RULE_CLASS = new Map<RuleKind, string>([
  ["cursor", CURSOR],
  ["grid", GRID_H],
  ["hairline", RULE_ZERO],
  ["plain", ""],
  ["rule", "rule"],
  ["target", RULE_TARGET],
]);

type LineProps = Omit<SVGProps<SVGLineElement>, "x1" | "x2" | "y1" | "y2">;

/** A level rule from x0 to x1, on the half pixel of y. */
export const HRule = ({
  className,
  kind = "hairline",
  x0,
  x1,
  y,
  ...rest
}: LineProps & { kind?: RuleKind; x0: number; x1: number; y: number }) => (
  <line
    className={cx(RULE_CLASS.get(kind), className)}
    x1={x0}
    x2={x1}
    y1={crisp(y)}
    y2={crisp(y)}
    {...rest}
  />
);

/** An upright rule from y0 to y1, on the half pixel of x. */
export const VRule = ({
  className,
  kind = "hairline",
  x,
  y0,
  y1,
  ...rest
}: LineProps & { kind?: RuleKind; x: number; y0: number; y1: number }) => (
  <line
    className={cx(RULE_CLASS.get(kind), className)}
    x1={crisp(x)}
    x2={crisp(x)}
    y1={y0}
    y2={y1}
    {...rest}
  />
);

/**
 * A mark's stem from y0 to y1: 1px on the half pixel at rest, 2px on the
 * whole pixel for the hero. Tone and motion come in `className`.
 */
export const Stem = ({
  className,
  hero = false,
  x,
  y0,
  y1,
  ...rest
}: LineProps & { hero?: boolean; x: number; y0: number; y1: number }) => {
  const at = hero ? Math.round(x) : crisp(x);
  return (
    <line
      className={cx("shape-crisp", className)}
      strokeWidth={hero ? STEM.hero : STEM.rest}
      x1={at}
      x2={at}
      y1={y0}
      y2={y1}
      {...rest}
    />
  );
};

/**
 * A ruler tick at x, standing on y: hanging below it by default, or rising
 * above it. Its length is one of the TICK sizes.
 */
export const Tick = ({
  className,
  rise = false,
  size = "md",
  x,
  y,
  ...rest
}: LineProps & { rise?: boolean; size?: TickSize; x: number; y: number }) => (
  <line
    className={cx("hairline", className)}
    x1={crisp(x)}
    x2={crisp(x)}
    y1={y}
    y2={rise ? y - TICK[size] : y + TICK[size]}
    {...rest}
  />
);

/** Level gridlines at each y, from x0 to x1. */
export const HGrid = (props: {
  className?: string;
  x0: number;
  x1: number;
  ys: number[];
}) => (
  <g>
    {props.ys.map((y) => (
      <line
        className={props.className ?? GRID_H}
        key={`h-${y}`}
        x1={props.x0}
        x2={props.x1}
        y1={crisp(y)}
        y2={crisp(y)}
      />
    ))}
  </g>
);

/** Upright gridlines at each x, from y0 to y1. */
export const VGrid = (props: { xs: number[]; y0: number; y1: number }) => (
  <g>
    {props.xs.map((x) => (
      <line
        className={GRID_V}
        key={`v-${x}`}
        x1={crisp(x)}
        x2={crisp(x)}
        y1={props.y0}
        y2={props.y1}
      />
    ))}
  </g>
);

/** The scrub cursor: an upright hairline at x. */
export const Cursor = (props: { x: number; y0: number; y1: number }) => (
  <VRule kind="cursor" x={props.x} y0={props.y0} y1={props.y1} />
);
