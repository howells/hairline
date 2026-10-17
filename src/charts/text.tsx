import type { SVGProps } from "react";

import type { TickMark } from "./axes";
import type { StaggerTier } from "./motion";
import { cx, stagger } from "./util";

/** The text voices, as the t-* utilities in app.css. */
export type Voice = "axis" | "figure" | "label" | "value";

/** Each voice's utility, spelled out so Tailwind finds every one. */
const VOICE_CLASS = new Map<Voice, string>([
  ["axis", "t-axis"],
  ["figure", "t-figure"],
  ["label", "t-label"],
  ["value", "t-value"],
]);

/** The shift that centres a line of text on its y. */
const MIDDLE = "0.34em";

type LabelProps = Omit<SVGProps<SVGTextElement>, "order"> & {
  anchor?: "end" | "middle" | "start";
  /** Paper behind the letters, for text over lines and marks. */
  halo?: boolean;
  /** Centre the text on `y`; otherwise `y` is its baseline. */
  middle?: boolean;
  /** The quieter tone of a secondary label. */
  muted?: boolean;
  /** Fade in at this entry step; omit when the label's group fades. */
  order?: number;
  tier?: StaggerTier;
  voice: Voice;
};

/**
 * Text in one of the chart voices: axis, label, value or figure. It may
 * centre on its y, sit on a halo, take the muted tone and fade in at an
 * entry step; anything else (a hero tone, rotation) passes through.
 */
export const Label = ({
  anchor,
  className,
  halo = false,
  middle = false,
  muted = false,
  order,
  style,
  tier,
  voice,
  ...rest
}: LabelProps) => (
  <text
    className={cx(
      order === undefined ? null : "fade",
      VOICE_CLASS.get(voice),
      halo && "t-halo",
      muted && "fill-muted",
      className
    )}
    dy={middle ? MIDDLE : undefined}
    style={order === undefined ? style : { ...stagger(order, tier), ...style }}
    textAnchor={anchor}
    {...rest}
  />
);

/**
 * A row of axis labels under a plot, each on its own x and one baseline.
 * `flush` sets the first label from its x rather than centring it, so it
 * cannot run off the plot's left edge.
 */
export const XLabels = (props: {
  className?: string;
  flush?: boolean;
  ticks: readonly TickMark[];
  y: number;
}) => (
  <g className={props.className}>
    {props.ticks.map((t, k) => (
      <Label
        anchor={props.flush === true && k === 0 ? "start" : "middle"}
        key={t.label}
        voice="axis"
        x={t.x}
        y={props.y}
      >
        {t.label}
      </Label>
    ))}
  </g>
);
