import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { PixelLine } from "../texture";
import { clamp, dimClass, noteSpace, sansWidth, stagger } from "../util";
import { dotCascadeDemo } from "./dot-cascade.data";
import type { DotCascadeDatum } from "./dot-cascade.data";

interface DotCascadeProps {
  data?: DotCascadeDatum[];
  /** Records per dot. */
  unit?: number;
  /** Sort ascending (the staircase). Default true. */
  sort?: boolean;
  height?: number;
  format?: (v: number) => string;
  /** Noun for the tooltip, e.g. "incidents". */
  noun?: string;
  note?: string;
  /** Label of the column drawn in ink. Defaults to the last (largest). */
  highlight?: string;
}

interface CascadeLayout {
  /** Width of the 2px cap that tops each column. */
  capW: number;
  colX: (i: number) => number;
  dy: number;
  floorY: (x: number) => number;
  gap: number;
  /** Height the columns, labels and any footnote need. */
  height: number;
  pitch: number;
  /** Width of each 1px unit tick. */
  tickW: number;
}

const cascadeLayout = (
  width: number,
  height: number,
  counts: number[],
  labels: string[],
  noteH: number
): CascadeLayout => {
  const pitch = clamp((width - 40) / counts.length, 16, 38);
  const x0 = (width - pitch * counts.length) / 2 + pitch / 2;
  const colX = (i: number) => x0 + i * pitch;
  // The floor sits as low as the rotated labels hanging off it allow.
  const drop = Math.max(
    0,
    ...labels.map((l, i) => 10 + sansWidth(l, 11) - (colX(i) - x0) * 0.32)
  );
  const floor0 = height - 6 - noteH - drop;
  const floorY = (x: number) => floor0 - (x - x0) * 0.32;
  const gap = 14;
  // Vertical dot pitch: the tallest column (above its own floor) must clear the top.
  const room = counts.map((k, i) =>
    k > 1 ? (floorY(colX(i)) - gap - 34) / (k - 1) : 99
  );
  // A whole-pixel pitch, so every tick in a column sits on the pixel grid.
  const dy = Math.floor(clamp(Math.min(...room), 4, 10));
  // When the dot pitch tops out, the columns fall short of the top: lift the
  // whole cascade by the spare room and shorten the plot to match.
  const slack = Math.max(
    0,
    Math.min(...counts.map((k, i) => floorY(colX(i)) - gap - (k - 1) * dy - 34))
  );
  return {
    capW: Math.round(Math.min(pitch * 0.6, 14)),
    colX,
    dy,
    floorY: (x) => floorY(x) - slack,
    gap,
    height: height - slack,
    pitch,
    tickW: Math.round(Math.min(pitch * 0.4, 9)),
  };
};

interface ColumnProps {
  count: number;
  datum: DotCascadeDatum;
  dim: boolean;
  format: (v: number) => string;
  hero: boolean;
  i: number;
  layout: CascadeLayout;
  onEnter: (x: number, y: number) => void;
}

const Column = ({
  count,
  datum,
  dim,
  format,
  hero,
  i,
  layout,
  onEnter,
}: ColumnProps) => {
  const { capW, colX, dy, floorY, gap, pitch, tickW } = layout;
  const x = colX(i);
  const base = Math.round(floorY(x) - gap);
  const topY = base - (count - 1) * dy;
  const units = Array.from({ length: count - 1 }, (_, r) => r);
  return (
    <g
      className={dimClass(dim)}
      onPointerEnter={() => {
        onEnter(x, topY - 22);
      }}
    >
      <rect
        fill="transparent"
        height={floorY(x) - topY + 70}
        width={pitch}
        x={x - pitch / 2}
        y={topY - 26}
      />
      {units.map((r) => (
        <rect
          className={`pop ${hero ? "fill-l3" : "fill-l5"}`}
          height={1}
          key={`${datum.label}-${r}`}
          style={stagger(i * 2 + r, "fine")}
          width={tickW}
          x={Math.round(x - tickW / 2)}
          y={base - r * dy}
        />
      ))}
      <rect
        className={`pop ${hero ? "fill-hero" : "fill-l3"}`}
        height={2}
        style={stagger(i * 2 + count, "fine")}
        width={capW}
        x={Math.round(x - capW / 2)}
        y={topY - 1}
      />
      <text
        className={`fade ${hero ? "t-value" : "t-axis"}`}
        style={stagger(i, "mark")}
        textAnchor="middle"
        x={x}
        y={topY - 9}
      >
        {format(datum.value)}
      </text>
      <text
        className="t-label fill-muted"
        dy="0.34em"
        textAnchor="end"
        transform={`translate(${x},${floorY(x) + 10}) rotate(-90)`}
      >
        {datum.label}
      </text>
    </g>
  );
};

/**
 * L2 Ranked causes. Ranked counts as columns of 1px unit ticks (one tick =
 * `unit` records) at one even pitch, rising off a slanted floor, so the
 * ranking reads as a staircase. A 2px cap tops each column, its value above.
 */
export const DotCascade = (props: DotCascadeProps) => {
  const raw = props.data ?? dotCascadeDemo;
  const data =
    props.sort === false ? raw : raw.toSorted((a, b) => a.value - b.value);
  const unit = props.unit ?? 2;
  const height = props.height ?? 440;
  const format = props.format ?? String;
  const noun = props.noun ?? "incidents";
  const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(
    null
  );
  const hero = props.highlight ?? data.at(-1)?.label;
  const counts = data.map((d) => Math.max(1, Math.ceil(d.value / unit)));

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].label}</b> · {format(data[tip.i].value)} {noun}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const layout = cascadeLayout(
          width,
          height,
          counts,
          data.map((d) => d.label),
          noteSpace(props.note, width - 16, 20)
        );
        const fx0 = layout.colX(0) - layout.pitch * 0.7;
        const fx1 = layout.colX(data.length - 1) + layout.pitch * 0.7;
        return (
          <svg
            aria-label={`Ranked counts: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`}
            height={layout.height}
            onPointerLeave={() => {
              setTip(null);
            }}
            width={width}
          >
            <title>Ranked counts as stacked unit ticks</title>
            <PixelLine
              className="fade"
              tone="fill-l5"
              x0={fx0}
              x1={fx1}
              y0={layout.floorY(fx0)}
              y1={layout.floorY(fx1)}
            />
            {data.map((d, i) => (
              <Column
                count={counts[i]}
                datum={d}
                dim={tip !== null && tip.i !== i}
                format={format}
                hero={hero === d.label}
                i={i}
                key={d.label}
                layout={layout}
                onEnter={(x, y) => {
                  setTip({ i, x, y });
                }}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={layout.height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
