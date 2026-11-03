import { scaleBand } from "d3-scale";

import type { NoteProps } from "../../schema/options";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch, Rules } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { NOTE_LINE, hasText, noteLines, stagger, noteOf } from "../util";
import { pairedRungsDemo } from "./paired-rungs.data";
import type { PairDatum } from "./paired-rungs.data";
import { RUNG, rungPitch, rungY } from "./rung-geometry";
import { Rungs } from "./rungs";
import { SeriesKey } from "./series-key";
import { maxIndex } from "./util-b";

interface PairedRungsProps extends NoteProps {
  data?: PairDatum[];
  /** Units per rung. */
  unit?: number;
  height?: number;
  format?: (v: number) => string;
  /** Period names for the tooltip, earlier first. */
  periods?: [string, string];
  /** Index of the category whose current ladder is drawn in the hero colour. */
  highlight?: number;
  /** Responsive mode only: the width of the first render, before measuring. */
  initialWidth?: number;
  /** Fixed width in px. Giving it turns measuring off. */
  width?: number;
}

interface PairProps {
  bw: number;
  /** Pattern id of the earlier period's hatch. */
  hatch: string;
  datum: PairDatum;
  dim: boolean;
  floor: number;
  format: (v: number) => string;
  gap: number;
  hero: boolean;
  index: number;
  left: number;
  onEnter: (x: number, y: number) => void;
  pitch: number;
  unit: number;
}

/** One category: the hatched earlier column, the current ladder, both values and the name. */
const Pair = ({
  bw,
  hatch,
  datum,
  dim,
  floor,
  format,
  gap,
  hero,
  index,
  left,
  onEnter,
  pitch,
  unit,
}: PairProps) => {
  const nPrev = Math.round(datum.previous / unit);
  const nCur = Math.round(datum.current / unit);
  const top = rungY(floor, Math.max(nPrev, nCur) - 1, pitch) - 26;
  const band = bw * 2 + gap;
  const prevTop = rungY(floor, nPrev - 1, pitch);
  return (
    <DimGroup
      dim={dim}
      onPointerEnter={() => {
        onEnter(left + band / 2, top);
      }}
    >
      <HitRect height={floor - top} width={band + 12} x={left - 6} y={top} />
      {nPrev > 0 ? (
        <rect
          className="grow-y stroke-l5 shape-crisp"
          fill={paint(hatch)}
          height={Math.round(floor) - prevTop - 1}
          strokeWidth={1}
          style={stagger(index * 2)}
          width={Math.round(bw) - 1}
          x={Math.round(left) + 0.5}
          y={prevTop + 0.5}
        />
      ) : null}
      <Rungs
        accent={hero ? "fill-hero" : "fill-l2"}
        className={hero ? "fill-hero" : "fill-l3"}
        floor={floor}
        id={`${datum.label}-current`}
        left={left + bw + gap}
        n={nCur}
        order={index * 2 + 1}
        pitch={pitch}
        width={bw}
      />
      <Label
        anchor="middle"
        order={index}
        voice="axis"
        x={left + bw / 2}
        y={rungY(floor, nPrev - 1, pitch) - 10}
      >
        {format(datum.previous)}
      </Label>
      <Label
        anchor="middle"
        order={index}
        voice="value"
        x={left + bw + gap + bw / 2}
        y={rungY(floor, nCur - 1, pitch) - 10}
      >
        {format(datum.current)}
      </Label>
      <Label
        anchor="middle"
        muted
        voice="label"
        x={left + band / 2}
        y={floor + 18}
      >
        {datum.label}
      </Label>
    </DimGroup>
  );
};

/** Below this width per category, the columns give way to rows. */
const COLUMN_ROOM = 78;
/** Height of one row in the narrow layout. */
const ROW_H = 58;
/** Height of a row's current rungs, and of its earlier bar. */
const ROW_RUNG = 12;
const ROW_BAR = 5;

interface PairRowProps {
  datum: PairDatum;
  dim: boolean;
  format: (v: number) => string;
  hatch: string;
  hero: boolean;
  index: number;
  onEnter: (x: number, y: number) => void;
  /** Pixels per data unit along the track. */
  scale: number;
  top: number;
  unit: number;
  x0: number;
  x1: number;
}

/**
 * One category as a row, for a chart too narrow for columns: the name and
 * both values on one line, then the current period as rungs along a track
 * and the earlier period as a hatched bar beneath them, on one scale.
 */
const PairRow = ({
  datum,
  dim,
  format,
  hatch,
  hero,
  index,
  onEnter,
  scale,
  top,
  unit,
  x0,
  x1,
}: PairRowProps) => {
  const n = Math.round(datum.current / unit);
  const pitch = unit * scale;
  const base = top + 22 + ROW_RUNG;
  const prevW = Math.round(datum.previous * scale);
  const rungs = Array.from({ length: n }, (_, k) => ({
    id: `${datum.label}-row-${k}`,
    k,
  }));
  return (
    <DimGroup
      dim={dim}
      onPointerEnter={() => {
        onEnter(x0 + Math.max(0, n - 1) * pitch, base - ROW_RUNG - 6);
      }}
    >
      <HitRect height={ROW_H} width={x1 - x0} x={x0} y={top} />
      <Label muted voice="label" x={x0} y={top + 12}>
        {datum.label}
      </Label>
      <Label
        anchor="end"
        className={hero ? "fill-hero" : ""}
        order={index}
        voice="value"
        x={x1}
        y={top + 12}
      >
        {format(datum.current)}
        <tspan className="fill-muted" dx={6}>
          {format(datum.previous)}
        </tspan>
      </Label>
      <HRule kind="rule" x0={x0} x1={x1} y={base} />
      {rungs.map((rung) => (
        <rect
          className={`grow-y ${hero ? "fill-hero" : "fill-l3"}`}
          height={ROW_RUNG}
          key={rung.id}
          style={stagger(index * 3 + rung.k, "fine")}
          width={RUNG}
          x={Math.round(x0 + rung.k * pitch)}
          y={base - ROW_RUNG}
        />
      ))}
      {prevW > 0 ? (
        <rect
          className="stroke-l5 shape-crisp"
          fill={paint(hatch)}
          height={ROW_BAR}
          strokeWidth={1}
          width={prevW}
          x={x0 + 0.5}
          y={base + 3.5}
        />
      ) : null}
    </DimGroup>
  );
};

interface PairRowsProps {
  curName: string;
  data: PairDatum[];
  format: (v: number) => string;
  hasNote: boolean;
  highlight?: number;
  hover: ReturnType<typeof useHover<number>>;
  ids: (name: string) => string;
  label: string;
  note: string | undefined;
  prevName: string;
  unit: number;
  width: number;
}

/** The whole chart as rows, for a width the columns cannot stand in. */
const PairRows = ({
  curName,
  data,
  format,
  hasNote,
  highlight,
  hover,
  ids,
  label,
  note,
  prevName,
  unit,
  width,
}: PairRowsProps) => {
  const x0 = 2;
  const x1 = width - 2;
  const max = Math.max(...data.flatMap((d) => [d.current, d.previous]));
  const notes = noteLines(note, width - 24);
  const rowsH =
    40 +
    data.length * ROW_H +
    (hasNote ? 30 : 0) +
    Math.max(0, notes.length - 1) * NOTE_LINE;
  const hero = highlight ?? maxIndex(data.map((d) => d.current));
  return (
    <ChartSvg height={rowsH} label={label} leave={hover.clear} width={width}>
      <defs>
        <Hatch id={ids("hatch")} tone="fill-l4" />
        <Rules id={ids("rules")} tone="fill-l3" />
      </defs>
      <SeriesKey
        items={[
          { fill: paint(ids("rules")), name: curName },
          { fill: paint(ids("hatch")), name: prevName },
        ]}
        x={x0}
        y={16}
      />
      {data.map((d, i) => (
        <PairRow
          datum={d}
          dim={hover.dim(i)}
          format={format}
          hatch={ids("hatch")}
          hero={hero === i}
          index={i}
          key={d.label}
          onEnter={hover.showAt(i)}
          scale={(x1 - x0) / max}
          top={40 + i * ROW_H}
          unit={unit}
          x0={x0}
          x1={x1}
        />
      ))}
      <FootNote gutter={12} height={rowsH} text={note} width={width} />
    </ChartSvg>
  );
};

/** The chart's text for a screen reader: every category, both periods. */
const pairsLabel = (
  data: PairDatum[],
  format: (v: number) => string,
  prevName: string,
  curName: string
) =>
  data
    .map(
      (d) =>
        `${d.label}: ${curName} ${format(d.current)}, ${prevName} ${format(d.previous)}`
    )
    .join("; ");

/**
 * F6 Getting to work. Per category, the earlier period is a quiet column of
 * hatch on paper inside a 1px rule, and the current period a stack of grey
 * 2px rungs (one per unit, every fifth darker). Only the leader's current
 * stack is in ink; a two-swatch key names the periods. Narrower than the
 * columns can stand, each category becomes a row: its values on one line,
 * the current rungs along a track and the earlier period hatched beneath, so
 * the chart grows taller instead of crowding.
 */
export const PairedRungs = (props: PairedRungsProps) => {
  const data = props.data ?? pairedRungsDemo;
  const unit = props.unit ?? 1;
  const height = props.height ?? 440;
  const format = props.format ?? String;
  const [prevName, curName] = props.periods ?? ["2011", "2021"];
  const hasNote = hasText(noteOf(props));
  const hover = useHover<number>();
  const ids = useTextureIds("paired");
  const label = pairsLabel(data, format, prevName, curName);

  return (
    <Plot
      initialWidth={props.initialWidth}
      width={props.width}
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                `${curName} ${format(data[hover.at.key].current)}`,
                `${prevName} ${format(data[hover.at.key].previous)}`,
              ]}
              lead={data[hover.at.key].label}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        if (width - 32 < data.length * COLUMN_ROOM) {
          return (
            <PairRows
              curName={curName}
              data={data}
              format={format}
              hasNote={hasNote}
              hover={hover}
              ids={ids}
              label={label}
              note={noteOf(props)}
              prevName={prevName}
              highlight={props.highlight}
              unit={unit}
              width={width}
            />
          );
        }
        const plotW = Math.min(width - 32, data.length * 130);
        const x0 = (width - plotW) / 2;
        const x = scaleBand()
          .domain(data.map((d) => d.label))
          .range([x0, x0 + plotW])
          .paddingInner(0.34)
          .paddingOuter(0.2);
        const band = x.bandwidth();
        const gap = Math.max(4, Math.round(band * 0.1));
        const max = Math.max(
          ...data.flatMap((d) => [d.current / unit, d.previous / unit])
        );
        const notes = noteLines(noteOf(props), width - 24);
        const floor = Math.round(
          height -
            (hasNote ? 50 : 30) -
            Math.max(0, notes.length - 1) * NOTE_LINE
        );
        const pitch = rungPitch(floor - 32, max);
        const hero = props.highlight ?? maxIndex(data.map((d) => d.current));
        return (
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Hatch id={ids("hatch")} tone="fill-l4" />
              <Rules id={ids("rules")} tone="fill-l3" />
            </defs>
            <SeriesKey
              align="end"
              items={[
                { fill: paint(ids("hatch")), name: prevName },
                { fill: paint(ids("rules")), name: curName },
              ]}
              x={Math.round(x0 + plotW)}
              y={16}
            />
            <HRule x0={Math.round(x0)} x1={Math.round(x0 + plotW)} y={floor} />
            {data.map((d, i) => (
              <Pair
                bw={(band - gap) / 2}
                hatch={ids("hatch")}
                datum={d}
                dim={hover.dim(i)}
                floor={floor}
                format={format}
                gap={gap}
                hero={hero === i}
                index={i}
                key={d.label}
                left={x(d.label) ?? 0}
                onEnter={hover.showAt(i)}
                pitch={pitch}
                unit={unit}
              />
            ))}
            <FootNote
              gutter={12}
              height={height}
              text={noteOf(props)}
              width={width}
            />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
