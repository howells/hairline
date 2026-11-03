import { scaleLinear } from "d3-scale";

import { Plot, Tooltip } from "../core";
import { DataTable } from "../data-table";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { MARK_WEIGHT } from "../marks";
import { OUTLINE } from "../roles";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { sansWidth, stagger } from "../util";
import { bulletDemo } from "./bullet.data";
import type { BulletDatum } from "./bullet.data";

interface BulletProps {
  data?: BulletDatum[];
  /** How a value prints. */
  format?: (v: number) => string;
  /** Fixed height in px. Without it the chart is as tall as its rows need. */
  height?: number;
  /** Fixed width in px: nothing is measured, so a server render is complete. */
  width?: number;
}

/** Height of the ranges, of the measure bar, and of the target tick. */
const BAND = 20;
const BAR = 8;
const TICK = 26;

/** Distance from one row's ranges to the next, and the space above the first. */
const PITCH = 56;
const TOP = 4;

/** The ranges darken toward the poor end; the last is the paper itself. */
const RANGE_FILL = ["fill-l4", "fill-l5"] as const;

interface RowProps {
  datum: BulletDatum;
  dim: boolean;
  format: (v: number) => string;
  index: number;
  labelW: number;
  onHover: (x: number, y: number) => void;
  right: number;
  width: number;
}

const Row = (props: RowProps) => {
  const { datum, index } = props;
  const x0 = props.labelW + 12;
  const top = TOP + index * PITCH;
  const mid = top + BAND / 2;
  // Each row has its own scale, ending at its widest range, or past it when
  // the measure or the target reaches further.
  const x = scaleLinear()
    .domain([0, Math.max(...datum.ranges, datum.value, datum.target)])
    .range([x0, props.right]);
  const edges = [x0, ...datum.ranges.map((r) => Math.round(x(r)))];
  const barW = Math.max(0, Math.round(x(datum.value)) - x0);
  return (
    <DimGroup
      dim={props.dim}
      onPointerEnter={() => {
        props.onHover(x(datum.value), top - 6);
      }}
    >
      <HitRect
        height={PITCH}
        width={props.width}
        x={0}
        y={top - (PITCH - BAND) / 2}
      />
      <Label anchor="end" middle muted voice="label" x={props.labelW} y={mid}>
        {datum.label}
      </Label>
      <g className="fade" style={stagger(index, "series")}>
        {RANGE_FILL.map((fill, k) => (
          <rect
            className={fill}
            height={BAND}
            key={fill}
            width={edges[k + 1] - edges[k]}
            x={edges[k]}
            y={top}
          />
        ))}
        <rect
          className={OUTLINE}
          height={BAND - 1}
          width={edges[3] - x0 - 1}
          x={x0 + 0.5}
          y={top + 0.5}
        />
      </g>
      <rect
        className="grow-x fill-hero"
        height={BAR}
        style={stagger(index, "series")}
        width={barW}
        x={x0}
        y={mid - BAR / 2}
      />
      <rect
        className="fade fill-hero"
        height={TICK}
        style={stagger(index + 3, "series")}
        width={MARK_WEIGHT}
        x={Math.round(x(datum.target)) - MARK_WEIGHT / 2}
        y={mid - TICK / 2}
      />
      <Label
        muted
        order={index + 3}
        tier="series"
        voice="axis"
        x={x0}
        y={top + BAND + 16}
      >
        {`${props.format(datum.value)} of ${props.format(datum.target)}`}
      </Label>
    </DimGroup>
  );
};

const pct = (d: BulletDatum) =>
  `${Math.round((d.value / d.target) * 100)}% of target`;

const check = (d: BulletDatum) => {
  const [a, b, c] = d.ranges;
  if (!(a > 0 && a <= b && b <= c)) {
    throw new Error(
      `Bullet "${d.label}": ranges must be positive and rise, got ${d.ranges.join(", ")}`
    );
  }
};

/**
 * O12 Bullet. One row per metric: a thin ink bar for the measure, a 2px tick
 * for the target, over three ranges that darken toward the poor end, with
 * "820 of 1000" under the bar. Each row has its own scale, so metrics in
 * different units sit in one chart.
 */
export const Bullet = (props: BulletProps) => {
  const data = props.data ?? bulletDemo;
  for (const d of data) {
    check(d);
  }
  const format = props.format ?? String;
  const height = props.height ?? TOP + PITCH * data.length - 8;
  const hover = useHover<number>();
  const hovered = hover.at === null ? undefined : data[hover.at.key];
  const label = data
    .map((d) => `${d.label}: ${format(d.value)} of ${format(d.target)}`)
    .join(", ");

  return (
    <Plot
      width={props.width}
      overlay={
        hover.at === null || hovered === undefined ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                `${format(hovered.value)} of ${format(hovered.target)}`,
                pct(hovered),
              ]}
              lead={hovered.label}
            />
          </Tooltip>
        )
      }
      table={
        <DataTable
          caption="Measures against targets"
          columns={["Label", "Value", "Target", "Ranges, to"]}
          rows={data.map((d) => [
            d.label,
            format(d.value),
            format(d.target),
            d.ranges.map(format).join(", "),
          ])}
        />
      }
    >
      {(width) => {
        const labelW =
          2 +
          Math.ceil(Math.max(0, ...data.map((d) => sansWidth(d.label, 11))));
        return (
          <ChartSvg
            desc={`${data.length} measures, each against its target.`}
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            {data.map((d, i) => (
              <Row
                datum={d}
                dim={hover.dim(i)}
                format={format}
                index={i}
                key={d.label}
                labelW={labelW}
                onHover={hover.showAt(i)}
                right={width - 4}
                width={width}
              />
            ))}
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
