import { scaleBand, scaleLinear } from "d3-scale";
import { useState } from "react";

import { fmtKInt } from "../../lib/format";
import { Chart, VGrid } from "../core";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { sansWidth } from "../util";
import { nameWidth } from "./room";
import { LABEL, MARK, OUTLINE, TICK, VALUE } from "./styles";
import { labelGap, thinTicks } from "./thin-ticks";

export interface NamedValue {
  name: string;
  value: number;
}

interface HBarsProps {
  rows: NamedValue[];
  height: number;
  ticks: number[];
  label: string;
  /** Value at each bar's tip. Defaults to whole thousands ("412k"). */
  format?: (v: number) => string;
  /** Axis tick labels. Defaults to `format`, else whole thousands. */
  tickFormat?: (v: number) => string;
}

interface BarState {
  /** The bar under the pointer. */
  active: boolean;
  /** Another bar is under the pointer. */
  dim: boolean;
  /** The leading bar, inked while nothing is hovered. */
  lead: boolean;
}

/** Ink for the leader (or the hovered bar); the rest are hatched on paper. */
const isInked = (bar: BarState) => bar.active || (bar.lead && !bar.dim);

/** Gap between a row's name and the plot, px. */
const NAME_GAP = 20;

/** Height of each bar, px: even, so it centres on whole pixels. */
const BAR_H = 12;

/** One bar: solid ink, or a hatch on paper inside a 1px rule. */
const Bar = (props: {
  bar: BarState;
  hatch: string;
  i: number;
  x: number;
  y: number;
  width: number;
}) => {
  const inked = isInked(props.bar);
  const x = Math.round(props.x);
  const y = Math.round(props.y);
  const width = Math.max(0, Math.round(props.width));
  return (
    <g
      className={`grow-x transition-opacity ${props.bar.dim ? "opacity-30" : "opacity-100"}`}
      style={{ "--i": props.i }}
    >
      <rect
        className={`${MARK} ${inked ? "fill-hero" : ""}`}
        fill={inked ? undefined : props.hatch}
        x={x}
        y={y}
        width={width}
        height={BAR_H}
      />
      {!inked && width >= 2 && (
        <rect
          className={OUTLINE}
          x={x + 0.5}
          y={y + 0.5}
          width={width - 1}
          height={BAR_H - 1}
        />
      )}
    </g>
  );
};

/** Ranked horizontal bars with the value at the tip; the leader is inked. */
export const HBars = (props: HBarsProps) => {
  const [hover, setHover] = useState<string | null>(null);
  const tex = useTextureIds("hb");
  const format = props.format ?? fmtKInt;
  const tickFormat = props.tickFormat ?? format;
  const leadValue = Math.max(...props.rows.map((r) => r.value));

  return (
    <Chart>
      {(width) => {
        // The last tick's label is centred on the plot's edge.
        const lastTick = props.ticks.at(-1) ?? 0;
        const m = {
          bottom: 30,
          left: NAME_GAP + nameWidth(props.rows.map((r) => r.name)),
          right: Math.ceil(sansWidth(tickFormat(lastTick)) / 2),
          top: 0,
        };
        const h = props.height;
        const x = scaleLinear()
          .domain([0, lastTick])
          .range([m.left, width - m.right]);
        const y = scaleBand()
          .domain(props.rows.map((r) => r.name))
          .range([m.top, h - m.bottom]);
        const bh = y.bandwidth();

        return (
          <svg
            width={width}
            height={h}
            aria-label={props.label}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{props.label}</title>
            <defs>
              <Hatch ground="fill-paper" id={tex("bar")} tone="fill-l3" />
            </defs>
            <VGrid xs={props.ticks.map(x)} y0={m.top} y1={h - m.bottom} />
            {thinTicks(
              props.ticks,
              x,
              labelGap(props.ticks.map(tickFormat))
            ).map((t) => (
              <text
                key={t}
                className={TICK}
                x={x(t)}
                y={h - m.bottom + 14}
                dy="0.71em"
                textAnchor="middle"
              >
                {tickFormat(t)}
              </text>
            ))}
            {props.rows.map((r, i) => {
              const cy = (y(r.name) ?? 0) + bh / 2;
              const active = hover === r.name;
              const dim = hover !== null && !active;
              return (
                <g
                  key={r.name}
                  onPointerEnter={() => {
                    setHover(r.name);
                  }}
                >
                  <rect
                    x={0}
                    y={y(r.name)}
                    width={width}
                    height={bh}
                    fill="transparent"
                  />
                  <text
                    className={LABEL}
                    x={m.left - NAME_GAP}
                    y={cy}
                    dy="0.34em"
                    textAnchor="end"
                    fill="var(--muted)"
                  >
                    {r.name}
                  </text>
                  <Bar
                    bar={{ active, dim, lead: r.value === leadValue }}
                    hatch={paint(tex("bar"))}
                    i={i}
                    x={x(0)}
                    y={cy - BAR_H / 2}
                    width={x(r.value) - x(0)}
                  />
                  <text
                    className={`${VALUE} fade`}
                    style={{ "--i": i }}
                    x={x(r.value) + 14}
                    y={cy}
                    dy="0.34em"
                  >
                    {format(r.value)}
                  </text>
                </g>
              );
            })}
          </svg>
        );
      }}
    </Chart>
  );
};
