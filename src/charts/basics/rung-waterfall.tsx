import { scaleBand } from "d3-scale";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Beads } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { NOTE_LINE, hasText, noteLines, stagger } from "../util";
import { rungPitch, rungY } from "./rung-geometry";
import { rungWaterfallDemo } from "./rung-waterfall.data";
import type { WaterfallDatum } from "./rung-waterfall.data";
import { Rungs } from "./rungs";

interface RungWaterfallProps {
  data?: WaterfallDatum[];
  /** Units per rung. */
  unit?: number;
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Index drawn in the hero colour. */
  highlight?: number;
}

/** A column resolved to the span of levels it covers. */
interface Step {
  from: number;
  label: string;
  shown: number;
  step: boolean;
  to: number;
}

const signed = (v: number, format: (v: number) => string) =>
  v < 0 ? `−${format(-v)}` : `+${format(v)}`;
const shownText = (c: Step, format: (v: number) => string) =>
  c.step ? signed(c.shown, format) : format(c.shown);

/** Walk the data, carrying the running level. A total with no value shows the level reached. */
const resolve = (data: WaterfallDatum[]) => {
  let level = 0;
  return data.map((d): Step => {
    if (d.total === true) {
      level = d.value ?? level;
      return { from: 0, label: d.label, shown: level, step: false, to: level };
    }
    const from = level;
    level += d.value ?? 0;
    return { from, label: d.label, shown: d.value ?? 0, step: true, to: level };
  });
};

/** True for a step that takes value away: drawn as broken (beaded) rungs. */
const isDeduction = (c: Step) => c.step && c.shown < 0;

/** Totals mid grey, additions lighter, deductions beaded; the hero in ink. */
const rungClass = (c: Step, hero: boolean) => {
  if (hero) {
    return "fill-hero";
  }
  if (isDeduction(c)) {
    return "";
  }
  return c.step ? "fill-l4" : "fill-l3";
};

/** Every fifth solid rung steps one grey darker. */
const accentClass = (c: Step, hero: boolean) => {
  if (hero) {
    return "fill-hero";
  }
  if (isDeduction(c)) {
    return "";
  }
  return "fill-l2";
};

interface BlockProps {
  /** Pattern id of the beads for deductions. */
  beads: string;
  bw: number;
  col: Step;
  dim: boolean;
  floor: number;
  format: (v: number) => string;
  hero: boolean;
  index: number;
  left: number;
  onEnter: (x: number, y: number) => void;
  pitch: number;
  unit: number;
}

/** One column: totals stand on the floor, steps float at the running level. */
const Block = ({
  beads,
  bw,
  col,
  dim,
  floor,
  format,
  hero,
  index,
  left,
  onEnter,
  pitch,
  unit,
}: BlockProps) => {
  const lo = Math.round(Math.min(col.from, col.to) / unit);
  const hi = Math.round(Math.max(col.from, col.to) / unit);
  const top = rungY(floor, hi - 1, pitch);
  return (
    <DimGroup
      dim={dim}
      onPointerEnter={() => {
        onEnter(left + bw / 2, top - 26);
      }}
    >
      <HitRect
        height={floor - top + 26}
        width={bw + 12}
        x={left - 6}
        y={top - 26}
      />
      <Rungs
        accent={accentClass(col, hero)}
        className={rungClass(col, hero)}
        fill={!hero && isDeduction(col) ? paint(beads) : undefined}
        floor={floor}
        from={lo}
        id={col.label}
        left={left}
        n={hi - lo}
        order={index * 4}
        pitch={pitch}
        width={bw}
      />
      <Label
        anchor="middle"
        order={index}
        tier="series"
        voice={col.step ? "axis" : "value"}
        x={left + bw / 2}
        y={top - 11}
      >
        {shownText(col, format)}
      </Label>
      <Label
        anchor="middle"
        muted
        voice="label"
        x={left + bw / 2}
        y={floor + 18}
      >
        {col.label}
      </Label>
    </DimGroup>
  );
};

/**
 * F9 Waterfall. Gross to net as floating blocks of 2px rungs at one pitch:
 * totals stand on the floor, steps float at the running level, deductions are
 * broken (beaded) rungs. Solid hairline connectors carry the level across;
 * the closing total is in ink.
 */
export const RungWaterfall = (props: RungWaterfallProps) => {
  const cols = resolve(props.data ?? rungWaterfallDemo);
  const unit = props.unit ?? 1;
  const height = props.height ?? 440;
  const format = props.format ?? String;
  const hasNote = hasText(props.note);
  const hover = useHover<number>();
  const ids = useTextureIds("waterfall");
  const label = cols
    .map((c) => `${c.label} ${shownText(c, format)}`)
    .join(", ");

  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                `${shownText(cols[hover.at.key], format)}${cols[hover.at.key].step ? ` → ${format(cols[hover.at.key].to)}` : ""}`,
              ]}
              lead={cols[hover.at.key].label}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const plotW = Math.min(width - 32, cols.length * 135);
        const x0 = (width - plotW) / 2;
        const x = scaleBand()
          .domain(cols.map((c) => c.label))
          .range([x0, x0 + plotW])
          .paddingInner(0.42)
          .paddingOuter(0.22);
        const bw = x.bandwidth();
        const notes = noteLines(props.note, width - 24);
        const floor = Math.round(
          height -
            (hasNote ? 50 : 30) -
            Math.max(0, notes.length - 1) * NOTE_LINE
        );
        const pitch = rungPitch(
          floor - 34,
          Math.max(...cols.flatMap((c) => [c.from, c.to])) / unit
        );
        const hero = props.highlight ?? cols.length - 1;
        // Connectors: the running level carried from one column to the next.
        const links = cols.slice(0, -1).map((c, i) => ({
          id: `link-${c.label}`,
          x1: (x(c.label) ?? 0) + bw,
          x2: x(cols[i + 1].label) ?? 0,
          // Level with the top edge of the highest rung at this level.
          y: rungY(floor, Math.round(c.to / unit) - 1, pitch),
        }));
        return (
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Beads id={ids("beads")} tone="fill-l3" />
            </defs>
            <HRule x0={Math.round(x0)} x1={Math.round(x0 + plotW)} y={floor} />
            {links.map((link, i) => (
              <HRule
                className="fade"
                key={link.id}
                kind="rule"
                style={stagger(i + 2, "series")}
                x0={Math.round(link.x1)}
                x1={Math.round(link.x2)}
                y={link.y}
              />
            ))}
            {cols.map((c, i) => (
              <Block
                beads={ids("beads")}
                bw={bw}
                col={c}
                dim={hover.dim(i)}
                floor={floor}
                format={format}
                hero={hero === i}
                index={i}
                key={c.label}
                left={x(c.label) ?? 0}
                onEnter={hover.showAt(i)}
                pitch={pitch}
                unit={unit}
              />
            ))}
            <FootNote
              gutter={12}
              height={height}
              text={props.note}
              width={width}
            />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
