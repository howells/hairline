import { fmtKInt } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { FootNote } from "../plot-note";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { PixelLine } from "../texture";
import { clamp, noteSpace, sansWidth, stagger } from "../util";
import { dotCascadeDemo } from "./dot-cascade.data";
import type { DotCascadeDatum } from "./dot-cascade.data";

interface DotCascadeProps {
  data?: DotCascadeDatum[];
  /** Puzzles per tick. */
  unit?: number;
  /** Sort ascending (the staircase). Default true. */
  sort?: boolean;
  height?: number;
  format?: (v: number) => string;
  /** Words after the value in the tooltip, e.g. "puzzles". */
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
    <DimGroup
      dim={dim}
      onPointerEnter={() => {
        onEnter(x, topY - 22);
      }}
    >
      <HitRect
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
      <Label
        anchor="middle"
        order={i}
        tier="mark"
        voice={hero ? "value" : "axis"}
        x={x}
        y={topY - 9}
      >
        {format(datum.value)}
      </Label>
      <Label
        anchor="end"
        middle
        muted
        transform={`translate(${x},${floorY(x) + 10}) rotate(-90)`}
        voice="label"
      >
        {datum.label}
      </Label>
    </DimGroup>
  );
};

/**
 * L2 Named mates. Ranked counts as columns of 1px unit ticks (one tick =
 * `unit` puzzles) at one even pitch, rising off a slanted floor, so the
 * ranking reads as a staircase. A 2px cap tops each column, its value above.
 */
export const DotCascade = (props: DotCascadeProps) => {
  const raw = props.data ?? dotCascadeDemo;
  const data =
    props.sort === false ? raw : raw.toSorted((a, b) => a.value - b.value);
  const unit = props.unit ?? 10_000;
  const height = props.height ?? 440;
  const format = props.format ?? fmtKInt;
  const noun = props.noun ?? "puzzles";
  const hover = useHover<number>();
  const hero = props.highlight ?? data.at(-1)?.label;
  const counts = data.map((d) => Math.max(1, Math.ceil(d.value / unit)));

  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[`${format(data[hover.at.key].value)} ${noun}`]}
              lead={data[hover.at.key].label}
            />
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
          <ChartSvg
            height={layout.height}
            label={`Puzzles by mate: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`}
            leave={hover.clear}
            title="Puzzles by named mate as stacked unit ticks"
            width={width}
          >
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
                dim={hover.dim(i)}
                format={format}
                hero={hero === d.label}
                i={i}
                key={d.label}
                layout={layout}
                onEnter={hover.showAt(i)}
              />
            ))}
            <FootNote height={layout.height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
