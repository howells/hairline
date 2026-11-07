import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { Plot, Tooltip } from "../core";
import { DataTable } from "../data-table";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Bar } from "../markers";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { sansWidth, stagger } from "../util";
import { pyramidDemo, pyramidSides } from "./pyramid.data";
import type { PyramidDatum } from "./pyramid.data";

interface PyramidProps {
  /** One band each, from the top down. */
  data?: PyramidDatum[];
  /** How a value prints. */
  format?: (v: number) => string;
  /** Fixed height in px. Without it the chart is as tall as its rows need. */
  height?: number;
  /** Fixed width in px: nothing is measured, so a server render is complete. */
  width?: number;
  /** The names of the left and the right side, set under them. */
  sides?: [string, string];
}

const ROW = 34;
const TOP = 4;
const NAMES = 32;

/** Space either side of the band names, and between a bar and its value. */
const GUTTER_PAD = 12;
const VALUE_GAP = 6;

/** Width of the widest of `texts` in the 11px roles, rounded up. */
const widest = (texts: string[]) =>
  Math.ceil(Math.max(0, ...texts.map((t) => sansWidth(t, 11))));

interface BandProps {
  barH: number;
  cx: number;
  cy: number;
  datum: PyramidDatum;
  dim: boolean;
  edgeL: number;
  edgeR: number;
  format: (v: number) => string;
  hatch: string;
  index: number;
  handleHover: () => void;
  pitch: number;
  width: number;
  x: ScaleLinear<number, number>;
}

/** One band: its name in the gutter, a bar either side, a value at each outer end. */
const Band = (p: BandProps) => {
  const lw = p.x(p.datum.left);
  const rw = p.x(p.datum.right);

  return (
    <DimGroup dim={p.dim} onPointerEnter={p.handleHover}>
      <HitRect height={p.pitch} width={p.width} x={0} y={p.cy - p.pitch / 2} />
      <Label anchor="middle" middle muted voice="label" x={p.cx} y={p.cy}>
        {p.datum.label}
      </Label>
      <Bar
        className="fade"
        dir="left"
        fill={paint(p.hatch)}
        h={p.barH}
        style={stagger(p.index, "series")}
        w={lw}
        x={p.edgeL - lw}
        y={p.cy - p.barH / 2}
      />
      <Bar
        className="grow-x fill-hero"
        dir="right"
        h={p.barH}
        style={stagger(p.index, "series")}
        w={rw}
        x={p.edgeR}
        y={p.cy - p.barH / 2}
      />
      <Label
        anchor="end"
        middle
        muted
        order={p.index + 3}
        tier="series"
        voice="value"
        x={p.edgeL - lw - VALUE_GAP}
        y={p.cy}
      >
        {p.format(p.datum.left)}
      </Label>
      <Label
        middle
        order={p.index + 3}
        tier="series"
        voice="value"
        x={p.edgeR + rw + VALUE_GAP}
        y={p.cy}
      >
        {p.format(p.datum.right)}
      </Label>
    </DimGroup>
  );
};

/**
 * O13 Pyramid. Two sides of bars back to back around a gutter of band names,
 * on one scale: the left engraved (hatch on paper in a 1px outline), the
 * right solid ink. Values sit at the outer ends and the sides are named
 * under them.
 */
export const Pyramid = (props: PyramidProps) => {
  const data = props.data ?? pyramidDemo;
  const sides = props.sides ?? pyramidSides;
  const format = props.format ?? String;
  const height = props.height ?? TOP + ROW * data.length + NAMES;
  const hover = useHover<number>();
  const tex = useTextureIds("pyramid");
  const hovered = hover.at === null ? undefined : data[hover.at.key];

  const label = data
    .map(
      (d) =>
        `${d.label}: ${sides[0]} ${format(d.left)}, ${sides[1]} ${format(d.right)}`
    )
    .join("; ");

  return (
    <Plot
      width={props.width}
      overlay={
        hover.at === null || hovered === undefined ? null : (
          <Tooltip clear={40} place="beside" x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                `${sides[0]} ${format(hovered.left)}`,
                `${sides[1]} ${format(hovered.right)}`,
              ]}
              lead={hovered.label}
            />
          </Tooltip>
        )
      }
      table={
        <DataTable
          caption={`${sides[0]} and ${sides[1]} by band`}
          columns={["Band", sides[0], sides[1]]}
          rows={data.map((d) => [d.label, format(d.left), format(d.right)])}
        />
      }
    >
      {(width) => {
        const gutter = widest(data.map((d) => d.label)) + 2 * GUTTER_PAD;

        const valueW =
          VALUE_GAP +
          widest(data.flatMap((d) => [format(d.left), format(d.right)]));

        const room = Math.max(0, (width - gutter) / 2 - valueW - 2);

        const x = scaleLinear()
          .domain([0, Math.max(1, ...data.flatMap((d) => [d.left, d.right]))])
          .range([0, room]);

        const cx = width / 2;
        const pitch = (height - TOP - NAMES) / Math.max(1, data.length);
        const barH = Math.min(24, Math.round(pitch * 0.64));
        const edgeL = Math.round(cx - gutter / 2);
        const edgeR = Math.round(cx + gutter / 2);
        const nameY = height - 10;

        return (
          <ChartSvg
            desc={`${data.length} bands; ${sides[0]} against ${sides[1]}.`}
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Hatch id={tex("hatch")} tone="fill-l3" />
            </defs>
            {data.map((d, i) => {
              const cy = TOP + pitch * (i + 0.5);

              return (
                <Band
                  barH={barH}
                  cx={cx}
                  cy={cy}
                  datum={d}
                  dim={hover.dim(i)}
                  edgeL={edgeL}
                  edgeR={edgeR}
                  format={format}
                  hatch={tex("hatch")}
                  index={i}
                  key={d.label}
                  handleHover={hover.enter(i, edgeR + x(d.right), cy)}
                  pitch={pitch}
                  width={width}
                  x={x}
                />
              );
            })}
            <Label anchor="end" muted voice="label" x={edgeL} y={nameY}>
              {sides[0]}
            </Label>
            <Label voice="label" x={edgeR} y={nameY}>
              {sides[1]}
            </Label>
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
