import { scaleBand } from "d3-scale";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Beads } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { NOTE_LINE, dimClass, hasText, noteLines, stagger } from "../util";
import { rungPitch, rungY } from "./rung-geometry";
import { rungWaterfallDemo } from "./rung-waterfall.data";
import type { WaterfallDatum } from "./rung-waterfall.data";
import { Rungs } from "./rungs";
import { isDim, useHoverTip } from "./util-a";

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

const valueClass = (c: Step) => (c.step ? "fade t-axis" : "fade t-value");

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
    <g
      className={dimClass(dim)}
      onPointerEnter={() => {
        onEnter(left + bw / 2, top - 26);
      }}
    >
      <rect
        className="fill-transparent"
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
      <text
        className={valueClass(col)}
        style={stagger(index, "series")}
        textAnchor="middle"
        x={left + bw / 2}
        y={top - 11}
      >
        {shownText(col, format)}
      </text>
      <text
        className="t-label fill-muted"
        textAnchor="middle"
        x={left + bw / 2}
        y={floor + 18}
      >
        {col.label}
      </text>
    </g>
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
  const { clear, hover, show, tip } = useHoverTip();
  const ids = useTextureIds("waterfall");
  const label = cols
    .map((c) => `${c.label} ${shownText(c, format)}`)
    .join(", ");

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{cols[tip.i].label}</b> · {shownText(cols[tip.i], format)}
            {cols[tip.i].step ? ` → ${format(cols[tip.i].to)}` : ""}
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
          y: crisp(rungY(floor, Math.round(c.to / unit) - 1, pitch)),
        }));
        return (
          <svg
            aria-label={label}
            height={height}
            onPointerLeave={clear}
            width={width}
          >
            <title>{label}</title>
            <defs>
              <Beads ground="fill-paper" id={ids("beads")} tone="fill-l3" />
            </defs>
            <line
              className="hairline"
              x1={Math.round(x0)}
              x2={Math.round(x0 + plotW)}
              y1={crisp(floor)}
              y2={crisp(floor)}
            />
            {links.map((link, i) => (
              <line
                className="fade rule"
                key={link.id}
                style={stagger(i + 2, "series")}
                x1={Math.round(link.x1)}
                x2={Math.round(link.x2)}
                y1={link.y}
                y2={link.y}
              />
            ))}
            {cols.map((c, i) => (
              <Block
                beads={ids("beads")}
                bw={bw}
                col={c}
                dim={isDim(hover, i)}
                floor={floor}
                format={format}
                hero={hero === i}
                index={i}
                key={c.label}
                left={x(c.label) ?? 0}
                onEnter={(px, py) => {
                  show(i, px, py);
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
          </svg>
        );
      }}
    </Plot>
  );
};
