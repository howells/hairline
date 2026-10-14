import { scaleSqrt } from "d3-scale";
import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { clamp, dimClass, noteSpace, stagger } from "../util";
import { dottyMatrixDemo } from "./dotty-matrix.data";
import type { DottyGroup } from "./dotty-matrix.data";

interface DottyMatrixProps {
  data?: DottyGroup[];
  height?: number;
  format?: (v: number) => string;
  /** Name of one grid cell for the tooltip, e.g. "week". */
  cell?: string;
  /** Noun for the value, e.g. "tasks". */
  noun?: string;
  note?: string;
}

interface DotHover {
  g: number;
  k: number;
  x: number;
  y: number;
}

interface PlaneGeometry {
  a: number;
  b: number;
  cx: number;
  gap: number;
  halfW: number;
  /** Height the stack and any footnote need. */
  height: number;
  n: number;
  top: number;
}

/** Lightness is data: the first (most important) plane is the hero. */
const TONES = ["fill-hero", "fill-l3", "fill-l4", "fill-l5"];

const planeGeometry = (
  width: number,
  height: number,
  groups: number,
  n: number,
  noteH: number
): PlaneGeometry => {
  // Planes are halfW tall and step down 0.485 halfW each, from 16px down.
  const stack = 1 + 0.485 * (groups - 1);
  const halfW = clamp(
    Math.min((height - 24 - noteH) / stack, (width - 116) / 2),
    70,
    190
  );
  const a = halfW / (n - 1 + 1.55);
  return {
    a,
    b: a / 2,
    cx: (width - 2 * halfW - 96) / 2 + halfW,
    gap: halfW * 0.485,
    halfW,
    height: Math.min(height, Math.round(16 + halfW * stack + 8 + noteH)),
    n,
    top: 16 + halfW / 2,
  };
};

interface PlaneProps {
  /** Id of the stipple screen engraved on every plane. */
  screen: string;
  dim: boolean;
  g: number;
  geo: PlaneGeometry;
  group: DottyGroup;
  onHover: (h: DotHover) => void;
  radius: (v: number) => number;
}

const Plane = ({ dim, g, geo, group, onHover, radius, screen }: PlaneProps) => {
  const { a, b, cx, gap, halfW, n } = geo;
  const cy = geo.top + g * gap;
  const outline = `M${cx},${cy - halfW / 2}L${cx + halfW},${cy}L${cx},${cy + halfW / 2}L${cx - halfW},${cy}Z`;
  const tone = TONES.at(g) ?? "fill-l5";
  return (
    <g className={dimClass(dim)}>
      <g className="fade" style={{ "--i": g }}>
        <path
          className="stroke-l5"
          d={outline}
          fill={paint(screen)}
          strokeWidth={1}
        />
      </g>
      {group.values.map((v, k) => {
        const i = Math.floor(k / n);
        const j = k % n;
        const x = cx + (j - i) * a;
        const y = cy + (i + j - (n - 1)) * b;
        const id = `${group.label}-${k}`;
        if (v <= 0) {
          return null;
        }
        return (
          <circle
            className={`pop ${tone}`}
            cx={x}
            cy={y}
            key={id}
            onPointerEnter={() => {
              onHover({ g, k, x, y: y - radius(v) - 4 });
            }}
            r={radius(v)}
            style={stagger(g * 12 + k, "dense")}
          />
        );
      })}
      <text
        className={`fade t-label ${g === 0 ? "" : "fill-muted"}`}
        dy="0.34em"
        x={cx + halfW + 14}
        y={cy}
      >
        {group.label}
      </text>
    </g>
  );
};

/**
 * L8 Team weeks. Groups × grid × amount: each group is an isometric plane
 * of dots (area = amount) on a fine stipple screen, stacked in space with the most important on top.
 */
export const DottyMatrix = (props: DottyMatrixProps) => {
  const data = props.data ?? dottyMatrixDemo;
  const height = props.height ?? 440;
  const format = props.format ?? String;
  const cell = props.cell ?? "week";
  const noun = props.noun ?? "tasks";
  const [hover, setHover] = useState<DotHover | null>(null);
  const screen = useTextureIds("plane")("screen");
  const n = Math.max(
    2,
    Math.round(Math.sqrt(Math.max(...data.map((d) => d.values.length))))
  );
  const max = Math.max(1, ...data.flatMap((d) => d.values));

  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>{data[hover.g].label}</b> · {cell} {hover.k + 1} ·{" "}
            {format(data[hover.g].values[hover.k])} {noun}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const geo = planeGeometry(
          width,
          height,
          data.length,
          n,
          noteSpace(props.note, width - 16, 20)
        );
        const scale = scaleSqrt()
          .domain([0, max])
          .range([0, geo.a * 0.3]);
        const radius = (v: number) => Math.max(2, scale(v));
        // Painter's order: the bottom plane first, so upper planes sit on top.
        const order = data.map((group, g) => ({ g, group })).toReversed();
        return (
          <svg
            aria-label={`Stacked dot planes: ${data.map((d) => `${d.label} ${format(d.values.reduce((s, v) => s + v, 0))} ${noun}`).join(", ")}`}
            height={geo.height}
            onPointerLeave={() => {
              setHover(null);
            }}
            width={width}
          >
            <title>Isometric planes of dots, one plane per group</title>
            <defs>
              <Stipple ground="fill-paper" id={screen} tone="fill-l5" />
            </defs>
            {order.map(({ g, group }) => (
              <Plane
                dim={hover !== null && hover.g !== g}
                g={g}
                geo={geo}
                group={group}
                key={group.label}
                onHover={setHover}
                radius={radius}
                screen={screen}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={geo.height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
