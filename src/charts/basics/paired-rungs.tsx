import { scaleBand } from "d3-scale";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { PlotNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch, Rules } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { NOTE_LINE, hasText, noteLines, stagger } from "../util";
import { pairedRungsDemo } from "./paired-rungs.data";
import type { PairDatum } from "./paired-rungs.data";
import { rungPitch, rungY } from "./rung-geometry";
import { Rungs } from "./rungs";
import { SeriesKey } from "./series-key";
import { maxIndex } from "./util-b";

interface PairedRungsProps {
  data?: PairDatum[];
  /** Units per rung. */
  unit?: number;
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Period names for the tooltip, earlier first. */
  periods?: [string, string];
  /** Index of the category whose current ladder is drawn in the hero colour. */
  highlight?: number;
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

/**
 * F6 Getting to work. Per category, the earlier period is a quiet column of
 * hatch on paper inside a 1px rule, and the current period a stack of grey
 * 2px rungs (one per unit, every fifth darker). Only the leader's current
 * stack is in ink; a two-swatch key names the periods.
 */
export const PairedRungs = (props: PairedRungsProps) => {
  const data = props.data ?? pairedRungsDemo;
  const unit = props.unit ?? 1;
  const height = props.height ?? 440;
  const format = props.format ?? String;
  const [prevName, curName] = props.periods ?? ["2011", "2021"];
  const hasNote = hasText(props.note);
  const hover = useHover<number>();
  const ids = useTextureIds("paired");
  const label = data
    .map(
      (d) =>
        `${d.label}: ${curName} ${format(d.current)}, ${prevName} ${format(d.previous)}`
    )
    .join("; ");

  return (
    <Plot
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
        const notes = noteLines(props.note, width - 24);
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
