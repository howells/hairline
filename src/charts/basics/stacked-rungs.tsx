import { scaleBand } from "d3-scale";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { PlotNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Beads, Rules, Stipple } from "../texture";
import { TEXTURE_PITCH, paint, useTextureIds } from "../texture-ids";
import { NOTE_LINE, hasText, noteLines, sum } from "../util";
import { rungPitch, rungY } from "./rung-geometry";
import { Rungs } from "./rungs";
import { SeriesKey } from "./series-key";
import { stackedRungsDemo, stackedRungsSeries } from "./stacked-rungs.data";
import type { StackDatum } from "./stacked-rungs.data";
import { maxIndex } from "./util-b";

interface StackedRungsProps {
  data?: StackDatum[];
  /** Series names, bottom (darkest) first. At most three. */
  series?: string[];
  /** Units per rung. */
  unit?: number;
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Index of the category whose bottom segment is drawn in the hero colour. */
  highlight?: number;
}

/*
 * Segment engraving, bottom first: solid dark rungs, solid light rungs, then
 * broken (beaded) rungs. Every fifth solid rung reaches a little wider, and
 * on the light rungs steps darker too.
 */
const RUNG_CLASSES = ["fill-l2", "fill-l4", ""];
const ACCENT_CLASSES = ["fill-l2", "fill-l3"];
/** Whole px a count-off rung reaches past its column on each side. */
const ACCENT_REACH = 2;
const pick = (list: string[], k: number) => list[Math.min(k, list.length - 1)];

/** Key swatches that read as each segment's engraving: dark rules, light rules, dots. */
const KEY_LOOKS = [
  { Pattern: Rules, name: "key-0", tone: "fill-l2" },
  { Pattern: Rules, name: "key-1", tone: "fill-l4" },
  { Pattern: Stipple, name: "key-2", tone: "fill-l3" },
] as const;

/** Rung slots a column needs: every part plus a one-rung gap between parts. */
const slotsOf = (d: StackDatum, unit: number) =>
  d.parts.reduce((a, p) => a + Math.round(p / unit), 0) +
  Math.max(0, d.parts.length - 1);

interface Segment {
  id: string;
  k: number;
  n: number;
  start: number;
  value: number;
}

const segmentsOf = (d: StackDatum, unit: number) => {
  const segments: Segment[] = [];
  let slot = 0;
  for (const [k, value] of d.parts.entries()) {
    const n = Math.round(value / unit);
    segments.push({ id: `${d.label}-part-${k}`, k, n, start: slot, value });
    slot += n + 1;
  }
  return segments;
};

interface ColumnProps {
  /** Pattern id of the beads for the top segment. */
  beads: string;
  bw: number;
  datum: StackDatum;
  dim: boolean;
  floor: number;
  format: (v: number) => string;
  hero: boolean;
  index: number;
  labelRoom: number;
  left: number;
  onEnter: (x: number, y: number) => void;
  pitch: number;
  unit: number;
}

/** One category: its stacked segments, each segment's count beside it, the total on top. */
const Column = ({
  beads,
  bw,
  datum,
  dim,
  floor,
  format,
  hero,
  index,
  labelRoom,
  left,
  onEnter,
  pitch,
  unit,
}: ColumnProps) => {
  const top = rungY(floor, slotsOf(datum, unit) - 1, pitch);
  const segments = segmentsOf(datum, unit);
  return (
    <DimGroup
      dim={dim}
      onPointerEnter={() => {
        onEnter(left + bw / 2, top - 30);
      }}
    >
      <HitRect
        height={floor - top + 30}
        width={bw + labelRoom + 16}
        x={left - 8}
        y={top - 30}
      />
      {segments.map((seg) => (
        <g key={seg.id}>
          <Rungs
            accent={
              hero && seg.k === 0 ? "fill-hero" : ACCENT_CLASSES.at(seg.k)
            }
            className={
              hero && seg.k === 0 ? "fill-hero" : pick(RUNG_CLASSES, seg.k)
            }
            fill={seg.k >= 2 ? paint(beads) : undefined}
            floor={floor}
            from={seg.start}
            id={seg.id}
            left={left}
            n={seg.n}
            order={seg.start * 0.35 + index * 2}
            pitch={pitch}
            reach={ACCENT_REACH}
            width={bw}
          />
          {seg.n > 0 ? (
            <Label
              dy="0.35em"
              order={index + seg.k}
              voice="axis"
              x={left + bw + 7}
              y={Math.round(floor) - (seg.start + seg.n / 2) * pitch}
            >
              {format(seg.value)}
            </Label>
          ) : null}
        </g>
      ))}
      <Label
        anchor="middle"
        order={index + 3}
        voice="value"
        x={left + bw / 2}
        y={top - 14}
      >
        {format(sum(datum.parts))}
      </Label>
      <Label
        anchor="middle"
        muted
        voice="label"
        x={left + bw / 2}
        y={floor + 18}
      >
        {datum.label}
      </Label>
    </DimGroup>
  );
};

/**
 * F7 Stacked counts. Each category is one stack of 2px rungs split into up to
 * three engravings (dark rungs, light rungs, beaded rungs) with a one-rung gap
 * between segments. The leader's bottom segment is in ink. Segment counts sit beside the stack, the total on top.
 */
export const StackedRungs = (props: StackedRungsProps) => {
  const data = props.data ?? stackedRungsDemo;
  const series = props.series ?? stackedRungsSeries;
  const unit = props.unit ?? 1;
  const height = props.height ?? 440;
  const format = props.format ?? String;
  const hasNote = hasText(props.note);
  const hover = useHover<number>();
  const ids = useTextureIds("stack");
  const partName = (k: number) => series.at(k) ?? `#${k + 1}`;
  const breakdown = (d: StackDatum) =>
    d.parts.map((p, k) => `${partName(k)} ${format(p)}`).join(" · ");
  const label = data
    .map((d) => `${d.label} ${format(sum(d.parts))}: ${breakdown(d)}`)
    .join("; ");

  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                format(sum(data[hover.at.key].parts)),
                breakdown(data[hover.at.key]),
              ]}
              lead={data[hover.at.key].label}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const plotW = Math.min(width - 32, data.length * 135);
        const x0 = (width - plotW) / 2;
        const x = scaleBand()
          .domain(data.map((d) => d.label))
          .range([x0, x0 + plotW])
          .paddingInner(0.3)
          .paddingOuter(0.3);
        const band = x.bandwidth();
        const labelRoom = width < 440 ? 18 : 26;
        const bw = Math.round(Math.min(56, band - labelRoom - 6));
        const notes = noteLines(props.note, width - 24);
        const floor = Math.round(
          height -
            (hasNote ? 50 : 30) -
            Math.max(0, notes.length - 1) * NOTE_LINE
        );
        const pitch = rungPitch(
          floor - 52,
          Math.max(...data.map((d) => slotsOf(d, unit))),
          10
        );
        const hero = props.highlight ?? maxIndex(data.map((d) => sum(d.parts)));
        return (
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Beads id={ids("beads")} tone="fill-l3" />
              {KEY_LOOKS.map((look) => (
                <look.Pattern
                  id={ids(look.name)}
                  key={look.name}
                  pitch={TEXTURE_PITCH.dense}
                  tone={look.tone}
                />
              ))}
            </defs>
            <SeriesKey
              align="end"
              items={series.slice(0, KEY_LOOKS.length).map((name, k) => ({
                fill: paint(ids(KEY_LOOKS[k].name)),
                name,
              }))}
              x={Math.round(x0 + plotW)}
              y={16}
            />
            <HRule x0={Math.round(x0)} x1={Math.round(x0 + plotW)} y={floor} />
            {data.map((d, i) => (
              <Column
                beads={ids("beads")}
                bw={bw}
                datum={d}
                dim={hover.dim(i)}
                floor={floor}
                format={format}
                hero={hero === i}
                index={i}
                key={d.label}
                labelRoom={labelRoom}
                left={(x(d.label) ?? 0) + band / 2 - (bw + labelRoom) / 2}
                onEnter={(px, py) => {
                  hover.show(i, px, py);
                }}
                pitch={pitch}
                unit={unit}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 24}
              x={width / 2}
              y={height - 6}
            />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
