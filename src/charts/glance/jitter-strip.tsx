import { median, tickStep } from "d3-array";
import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { Ring } from "../markers";
import { DOT, MARK_WEIGHT } from "../marks";
import type { DotSize } from "../marks";
import { PlotNote } from "../plot-note";
import { dimClass, noteSpace, stagger } from "../util";
import { jitterStripDemo } from "./jitter-strip.data";
import type { JitterGroup } from "./jitter-strip.data";
import { labelRoom, textWidth } from "./util-a";

interface JitterStripProps {
  data?: JitterGroup[];
  height?: number;
  format?: (v: number) => string;
  /** Axis caption, e.g. "days after 21 March". */
  axisLabel?: string;
  /** Formats the labels on the scale; defaults to `format`. */
  tickFormat?: (v: number) => string;
  /** Unit for the tooltip noun when a record has no name, e.g. "year". */
  unit?: string;
  note?: string;
  /** Index of the hero group (default the first: median and name in ink); a given one also inks its rings. */
  highlight?: number;
}

interface Hit {
  g: number;
  k: number;
  x: number;
  y: number;
}

interface BandProps {
  band: number;
  /** Ring size at rest: sm when narrow, md when wide. */
  dot: DotSize;
  g: number;
  /** Ink the rings of this group (the highlight). */
  hero: boolean;
  /** The hero row: its median a 2px ink tick and its name in ink. */
  heroRow: boolean;
  group: JitterGroup;
  hover: Hit | null;
  med: number;
  onEnter: (hit: Hit) => void;
  top: number;
  x: ScaleLinear<number, number>;
  labelX: number;
}

const plain = (v: number) => `${Math.round(v * 10) / 10}`;

/** Gridlines at round steps, ending on the first one at or past the largest value. */
const gridTicks = (max: number) => {
  const step = tickStep(0, max, 4);
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, k) => k * step);
};

interface Seat {
  x: number;
  y: number;
}

/**
 * A dot plot on a lattice: each value snaps to a column `pitch` px wide and
 * stacks outward from the band's centre line (centre, below, above, ...),
 * one ring per seat. Rows tighten when a column would outgrow the band.
 */
const seats = (
  px: number[],
  pitch: number,
  centre: number,
  room: number,
  /** Leftmost x a ring's centre may take: clear of the zero rule. */
  floor: number
): Seat[] => {
  const first = Math.ceil(floor / pitch);
  const cols = px.map((v) => Math.max(first, Math.round(v / pitch)));
  const counts = new Map<number, number>();
  for (const c of cols) {
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const tallest = Math.max(1, ...counts.values());
  const row = Math.min(pitch, room / tallest);
  const used = new Map<number, number>();
  return cols.map((c) => {
    const j = used.get(c) ?? 0;
    used.set(c, j + 1);
    const step = Math.ceil(j / 2) * (j % 2 === 0 ? -1 : 1);
    return { x: c * pitch, y: centre + step * row };
  });
};

/** One group: its label, a dot per record jittered across the band, and a median tick. */
const Band = (p: BandProps) => {
  const radius = DOT[p.dot];
  const lattice = seats(
    p.group.values.map((v) => p.x(v)),
    radius * 2 + 2,
    Math.round(p.top + p.band / 2),
    p.band * 0.9,
    p.x(0) + radius + 2
  );
  return (
    <g className={dimClass(p.hover !== null && p.hover.g !== p.g)}>
      <text
        className={`t-label ${p.heroRow ? "fill-ink" : "fill-muted"}`}
        x={p.labelX}
        y={p.top + p.band / 2}
        dy="0.35em"
      >
        {p.group.label}
      </text>
      {p.group.values.map((_, k) => {
        const seat = lattice[k];
        const on = p.hover !== null && p.hover.g === p.g && p.hover.k === k;
        return (
          <Ring
            // Records carry no id; group + ordinal is their identity.
            key={`${p.group.label}-${String(k)}`}
            className={`pop ${on || p.hero ? "stroke-ink" : "stroke-l4"}`}
            style={stagger(k, "dense")}
            cx={seat.x}
            cy={seat.y}
            open
            size={on ? "lg" : p.dot}
            pointerEvents="visible"
            onPointerEnter={() => {
              p.onEnter({ g: p.g, k, x: seat.x, y: seat.y - radius - 4 });
            }}
          />
        );
      })}
      {p.heroRow ? (
        <line
          className="fade stroke-ink"
          style={{ "--i": 8 + p.g }}
          x1={Math.round(p.x(p.med))}
          x2={Math.round(p.x(p.med))}
          y1={Math.round(p.top + p.band * 0.04)}
          y2={Math.round(p.top + p.band * 0.96)}
          strokeWidth={MARK_WEIGHT}
        />
      ) : (
        <line
          className="fade stroke-rule"
          style={{ "--i": 8 + p.g }}
          x1={Math.round(p.x(p.med))}
          x2={Math.round(p.x(p.med))}
          y1={Math.round(p.top + p.band * 0.04)}
          y2={Math.round(p.top + p.band * 0.96)}
          strokeWidth={MARK_WEIGHT}
        />
      )}
    </g>
  );
};

/**
 * G15 Easter dates. One hollow ring per record, set on a lattice: values
 * snap to equal-pitch columns and stack outward from each band's centre
 * line, so pile-ups read as taller columns, evenly spaced, with no random
 * jitter. The hero row's median (the first group, or the highlight) is a
 * 2px ink tick; every other median is a quiet 2px rule.
 */
export const JitterStrip = (props: JitterStripProps) => {
  const data = props.data ?? jitterStripDemo;
  const height = props.height ?? 420;
  const format = props.format ?? plain;
  const unit = props.unit ?? "record";
  const tickFormat = props.tickFormat ?? format;
  const [hover, setHover] = useState<Hit | null>(null);
  const max = Math.max(...data.flatMap((d) => d.values));
  const medians = data.map((d) => median(d.values) ?? 0);
  const label = `Jitter strip: ${data.map((d, i) => `${d.label}, ${d.values.length} records, median ${format(medians[i])}`).join("; ")}`;

  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>{data[hover.g].label}</b> ·{" "}
            {data[hover.g].names?.[hover.k] ?? `this ${unit}`}{" "}
            {format(data[hover.g].values[hover.k])} · median{" "}
            {format(medians[hover.g])}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 480;
        const ticks = gridTicks(max);
        const m = {
          bottom: 40 + noteSpace(props.note, width - 16, 16),
          // Room for the longest group name.
          left: labelRoom(data.map((d) => d.label)) + 10,
          // Half the last tick label hangs past its gridline.
          right: Math.ceil(
            textWidth(tickFormat(ticks.at(-1) ?? 0), "t-axis") / 2
          ),
          top: 10,
        };
        const x = scaleLinear()
          .domain([0, ticks.at(-1) ?? max])
          .range([m.left + 6, width - m.right]);
        const band = (height - m.top - m.bottom) / data.length;
        const floor = height - m.bottom;

        return (
          <svg
            width={width}
            height={height}
            aria-label={label}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{label}</title>
            {ticks.map((t) => (
              <g key={t}>
                <line
                  className={t === 0 ? "hairline" : "grid-line"}
                  x1={crisp(x(t))}
                  x2={crisp(x(t))}
                  y1={m.top}
                  y2={floor}
                />
                <text
                  className="t-axis"
                  x={x(t)}
                  y={floor + 16}
                  textAnchor="middle"
                >
                  {tickFormat(t)}
                </text>
              </g>
            ))}
            {props.axisLabel === undefined ? null : (
              <text
                className="t-note"
                x={width}
                y={floor + 34}
                textAnchor="end"
              >
                {props.axisLabel}
              </text>
            )}
            {data.map((d, g) => (
              <Band
                key={d.label}
                band={band}
                dot={narrow ? "sm" : "md"}
                hero={props.highlight === g}
                heroRow={(props.highlight ?? 0) === g}
                g={g}
                group={d}
                hover={hover}
                labelX={0}
                med={medians[g]}
                onEnter={setHover}
                top={m.top + band * g}
                x={x}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
