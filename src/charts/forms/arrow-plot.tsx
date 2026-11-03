import type { DumbbellDatum } from "../../schema/dumbbell-queue";
import {
  buildLayout,
  describe,
  reactKeys,
  summary,
} from "../basics/before-after";
import type { Layout, SideLabels } from "../basics/before-after";
import { Plot, Tooltip } from "../core";
import { DataTable } from "../data-table";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Dot, Ring } from "../markers";
import { DOT, STEM } from "../marks";
import { VGrid } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { stagger } from "../util";
import { arrowPlotDemo } from "./arrow-plot.data";

interface ArrowPlotProps {
  /** One row each: its name, the value before and the value after. */
  data?: DumbbellDatum[];
  /** Fixed height in px. Without it the chart is as tall as its rows need. */
  height?: number;
  /** Fixed width in px: nothing is measured, so a server render is complete. */
  width?: number;
  /** How a value prints, on the rows and the axis. */
  format?: (v: number) => string;
}

/** Arrowhead: how far back from the tip its base sits, and its half-width. */
const HEAD = { half: 3.5, length: 7 } as const;

/** A change under this many px is two dots, not an arrow. */
const TINY = 16;

/** Gap between the tip of an arrow and its value label. */
const GAP = 6;

const TOP = 20;
const ROW = 44;

/** The label sits at the head, on the outer side: right of a rise, left of a fall. */
const sideLabels = (format: (v: number) => string): SideLabels => ({
  left: (d) => (d.after < d.before ? format(d.after) : ""),
  right: (d) => (d.after < d.before ? "" : format(d.after)),
});

interface RowProps {
  datum: DumbbellDatum;
  dim: boolean;
  format: (v: number) => string;
  index: number;
  layout: Layout;
  onHover: (x: number, y: number) => void;
  width: number;
}

const Row = ({
  datum,
  dim,
  format,
  index,
  layout,
  onHover,
  width,
}: RowProps) => {
  const rise = datum.after >= datum.before;
  const dir = rise ? 1 : -1;
  const y = Math.round(layout.top + index * layout.pitch);
  const xa = layout.x(datum.after);
  const xb = layout.x(datum.before);
  const tiny = Math.abs(xa - xb) < TINY;
  // Rises are ink at the hero's 2px; falls are quiet at the rest 1px.
  const cy = rise ? y : y + 0.5;
  const stroke = rise ? "stroke-hero" : "stroke-l3";
  const fill = rise ? "fill-hero" : "fill-l3";
  const base = xa - dir * HEAD.length;
  return (
    <DimGroup
      dim={dim}
      onPointerEnter={() => {
        onHover((xa + xb) / 2, y - 16);
      }}
    >
      <HitRect
        height={layout.pitch}
        width={width}
        x={0}
        y={y - layout.pitch / 2}
      />
      <Label
        anchor="end"
        middle
        muted={!rise}
        voice="label"
        x={layout.labelW}
        y={y}
      >
        {datum.label}
      </Label>
      {tiny ? (
        <g style={stagger(index, "mark")}>
          <Ring className="pop stroke-l3" cx={xb} cy={y + 0.5} size="sm" />
          <Dot className="pop fill-l3" cx={xa} cy={y + 0.5} size="sm" />
        </g>
      ) : (
        <g className="fade" style={stagger(index, "mark")}>
          <line
            className={`shape-crisp ${stroke}`}
            strokeWidth={rise ? STEM.hero : STEM.rest}
            x1={xb}
            x2={base}
            y1={cy}
            y2={cy}
          />
          <Dot className={fill} cx={xb} cy={cy} size="sm" />
          <path
            className={fill}
            d={`M${xa},${cy}L${base},${cy - HEAD.half}L${base},${cy + HEAD.half}Z`}
          />
        </g>
      )}
      <Label
        anchor={rise ? "start" : "end"}
        middle
        muted={!rise}
        order={index + 4}
        tier="mark"
        voice="value"
        x={xa + dir * (tiny ? DOT.sm + GAP : GAP)}
        y={y}
      >
        {format(datum.after)}
      </Label>
    </DimGroup>
  );
};

/**
 * O11 Arrow plot. Each row is a change from a before to an after: a dot at
 * the before, a shaft and an arrowhead at the after, and the after's value at
 * the head on the outer side. Rises are ink; falls are a quieter tone. A
 * change too small to draw as an arrow is a pair of dots, the hollow one the
 * before. Rows share DumbbellQueue's layout.
 */
export const ArrowPlot = (props: ArrowPlotProps) => {
  const data = (props.data ?? arrowPlotDemo).filter(
    (d) => Number.isFinite(d.before) && Number.isFinite(d.after)
  );
  const height = props.height ?? TOP + 24 + ROW * data.length;
  const format = props.format ?? ((v: number) => `${String(v)}%`);
  const keys = reactKeys(data);
  const hover = useHover<number>();
  const label =
    data.length === 0
      ? "No data"
      : data
          .map((d) => `${d.label}: ${format(d.before)} to ${format(d.after)}`)
          .join(", ");
  const hovered = hover.at === null ? undefined : data[hover.at.key];

  return (
    <Plot
      width={props.width}
      overlay={
        hover.at === null || hovered === undefined ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                `${format(hovered.before)} → ${format(hovered.after)}`,
                describe(hovered, format),
              ]}
              lead={hovered.label}
            />
          </Tooltip>
        )
      }
      table={
        <DataTable
          caption="Before and after"
          columns={["Label", "Before", "After"]}
          rows={data.map((d) => [d.label, format(d.before), format(d.after)])}
        />
      }
    >
      {(width) => {
        const layout = buildLayout(
          width,
          height,
          data,
          false,
          sideLabels(format),
          TOP
        );
        const axisY = height - 10;
        const ticks = layout.x.ticks(4);
        return (
          <ChartSvg
            desc={summary(data, format)}
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <VGrid
              xs={ticks.map((t) => layout.x(t))}
              y0={TOP - 12}
              y1={height - 30}
            />
            {data.map((d, i) => (
              <Row
                datum={d}
                dim={hover.dim(i)}
                format={format}
                index={i}
                key={keys[i]}
                layout={layout}
                onHover={hover.showAt(i)}
                width={width}
              />
            ))}
            <g className="fade" style={stagger(data.length + 4)}>
              {ticks.map((t) => (
                <Label
                  anchor="middle"
                  key={`tick-${t}`}
                  voice="axis"
                  x={layout.x(t)}
                  y={axisY}
                >
                  {format(t)}
                </Label>
              ))}
            </g>
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
