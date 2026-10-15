import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import type { ReactNode } from "react";

import { MONTHS } from "../../lib/data";
import { crisp, phase } from "../axes";
import type { Margin } from "../axes";
import { Chart } from "../core";
import { useScrub } from "../hooks";
import type { Sync } from "../hooks";
import { Hatch, PlateLabel, Rules, Stipple } from "../texture";
import { TEXTURE_PITCH, paint, useTextureIds } from "../texture-ids";
import { stagger } from "../util";
import { ValueGrid } from "../value-grid";
import { Key } from "./key";
import type { KeyItem } from "./key";
import { MonthAxis } from "./month-axis";
import { labelledTicks, monthTickIndices } from "./month-ticks";
import { SIDE_GAP, sideRoom } from "./room";
import {
  CAPTION,
  LABEL,
  MARK,
  OUTLINE,
  RULE_TARGET,
  RULE_ZERO,
  TICK,
  VALUE,
} from "./styles";
import { gridEnd, sideMargins } from "./time-frame";
import type { YAxis } from "./time-frame";

type Phase = "past" | "active" | "future";

/**
 * What a bar segment shows. The first series is solid up to the cursor, ink
 * at it, and hatched after; the second is always stippled, the third finely
 * ruled and the fourth ruled upright, so stacked segments read by grammar. Signed bars hatch their
 * gains and stipple their losses. The part over a plan is told by texture,
 * not colour: a dense falling hatch in ink inside an ink rule, the same before
 * and after the cursor.
 */
type Grammar = "s1" | "s2" | "s3" | "s4" | "over" | "gain" | "loss";

interface Paint {
  className: string;
  fill: string | undefined;
  /** Textured: drawn on paper inside a 1px rule of this class; null when solid. */
  outline: string | null;
}

const solid = (className: string): Paint => ({
  className,
  fill: undefined,
  outline: null,
});

/** The overflow's rule: ink, so the engraved excess reads as one shape. */
const OVER_OUTLINE = "fill-none stroke-ink shape-crisp";

const engraved = (tex: (name: string) => string, name: string): Paint => ({
  className: "",
  fill: paint(tex(name)),
  outline: name === "over" ? OVER_OUTLINE : OUTLINE,
});

const SOLID: Partial<Record<Grammar, Record<Phase, string | null>>> = {
  gain: { active: "fill-hero", future: null, past: null },
  loss: { active: "fill-hero", future: null, past: null },
  s1: { active: "fill-hero", future: null, past: "fill-l2" },
};

/**
 * Bars too thin to carry an engraving (a sparkline on a phone) fall back to
 * one solid tone per grammar, so they read as bars rather than as noise.
 */
const THIN: Record<Grammar, Record<Phase, string>> = {
  gain: { active: "fill-hero", future: "fill-l3", past: "fill-l3" },
  loss: { active: "fill-hero", future: "fill-l5", past: "fill-l5" },
  over: { active: "fill-hero", future: "fill-hero", past: "fill-hero" },
  s1: { active: "fill-hero", future: "fill-l4", past: "fill-l2" },
  s2: { active: "fill-l3", future: "fill-l3", past: "fill-l3" },
  s3: { active: "fill-l4", future: "fill-l4", past: "fill-l4" },
  s4: { active: "fill-l5", future: "fill-l5", past: "fill-l5" },
};

/** Narrower than this, px, a bar's engraving breaks up. */
const MIN_ENGRAVED = 5;

const segmentPaint = (
  grammar: Grammar,
  when: Phase,
  frame: Pick<Frame, "tex" | "thin">
): Paint => {
  if (frame.thin) {
    return solid(THIN[grammar][when]);
  }
  const tone = SOLID[grammar]?.[when] ?? null;
  return tone === null ? engraved(frame.tex, grammar) : solid(tone);
};

/** The engravings, one per grammar, all on paper. */
const BarPatterns = (props: { tex: (name: string) => string }) => {
  const { tex } = props;
  return (
    <defs>
      <Hatch ground="fill-paper" id={tex("s1")} tone="fill-l3" />
      <Stipple ground="fill-paper" id={tex("s2")} tone="fill-l3" />
      <Rules ground="fill-paper" id={tex("s3")} tone="fill-l5" />
      <Rules
        angle="upright"
        ground="fill-paper"
        id={tex("s4")}
        tone="fill-l5"
      />
      <Hatch
        angle="falling"
        ground="fill-paper"
        id={tex("over")}
        tone="fill-hero"
      />
      <Hatch ground="fill-paper" id={tex("gain")} tone="fill-l2" />
      <Stipple
        ground="fill-paper"
        id={tex("loss")}
        pitch={TEXTURE_PITCH.dense}
        tone="fill-l2"
      />
    </defs>
  );
};

/** A key swatch for each series, in its resting grammar. */
const keySwatch = (
  tone: Stack["tone"],
  tex: (name: string) => string
): Pick<KeyItem, "fill" | "tone"> =>
  tone === "s1" ? { tone: "fill-l2" } : { fill: paint(tex(tone)) };

export interface Stack {
  values: (number | null)[];
  tone: "s1" | "s2" | "s3" | "s4";
  label?: string;
}

interface Plan {
  value: number;
  label?: string;
}

type Readout = "legend" | "value" | "none";

interface MonthlyBarsProps {
  stacks: Stack[];
  height: number;
  /** Resting cursor; null leaves every bar in the "past" tone. */
  rest: number | null;
  y: YAxis;
  format: (v: number) => string;
  margin?: Partial<Margin>;
  /** Single stack: the part above this value is engraved in ink. */
  plan?: Plan;
  /** Signed values around a zero rule: gains hatched, losses stippled. */
  diverging?: boolean;
  readout?: Readout;
  compact?: { title: string };
  sync?: Sync;
  label: string;
  /** One bar per month, first of the month in UTC. Defaults to Jan 2023 – Dec 2024. */
  months?: Date[];
}

/** Plot geometry shared by every layer of one render. */
interface Frame {
  months: Date[];
  width: number;
  height: number;
  m: Margin;
  plotBottom: number;
  x: ScaleBand<number>;
  y: ScaleLinear<number, number>;
  center: (i: number) => number;
  /** Pattern id for a named engraving. */
  tex: (name: string) => string;
  /** Bars too thin to engrave: solid tones instead. */
  thin: boolean;
}

/** A bar's left edge and width on whole pixels, so its hatch sits on the grid. */
const barX = (frame: Frame, i: number) => ({
  width: Math.round(frame.x.bandwidth()),
  x: Math.round(frame.x(i) ?? 0),
});

const LABEL_FILL = {
  s1: "var(--text)",
  s2: "var(--board-label-2)",
  s3: "var(--muted)",
  s4: "var(--muted)",
};

const hasLabel = (s: Stack) => s.label !== undefined && s.label !== "";
const monthKey = (months: Date[], i: number) => months[i].toISOString();

/** Series names sit beside the last bar unless a key above names them. */
const sideLabelled = (props: MonthlyBarsProps, readout: Readout) =>
  readout !== "legend" && props.stacks.some(hasLabel);

const plotMargin = (props: MonthlyBarsProps, readout: Readout): Margin => {
  if (props.compact !== undefined) {
    return { bottom: 4, left: 2, right: 2, top: 4, ...props.margin };
  }
  const top = props.y.side === "right" ? 18 : 8;
  const right = sideLabelled(props, readout) ? sideRoom(props.stacks) : 2;
  return {
    bottom: 30,
    ...sideMargins(props.y, 12, right),
    top: readout === "value" ? 30 : top,
    ...props.margin,
  };
};

const chartTop = (
  props: MonthlyBarsProps,
  readout: Readout,
  index: number,
  tex: (name: string) => string
): ReactNode => {
  if (props.compact !== undefined) {
    return <div className={`${CAPTION} pb-2.5`}>{props.compact.title}</div>;
  }
  if (readout === "legend") {
    return (
      <Key
        className="mb-3"
        items={props.stacks.map((s) => ({
          ...keySwatch(s.tone, tex),
          label: s.label,
          value: props.format(s.values[index] ?? 0),
        }))}
      />
    );
  }
  return null;
};

/** One segment: its fill, and the 1px rule around it when it is engraved. */
const SegmentRect = (props: {
  paint: Paint;
  x: number;
  width: number;
  top: number;
  bottom: number;
}) => {
  const { bottom, top, width, x } = props;
  const height = Math.max(0, bottom - top);
  return (
    <>
      <rect
        className={`${MARK} ${props.paint.className}`}
        fill={props.paint.fill}
        x={x}
        y={top}
        width={width}
        height={height}
      />
      {props.paint.outline !== null && height >= 2 && width >= 2 && (
        <rect
          className={props.paint.outline}
          x={x + 0.5}
          y={top + 0.5}
          width={width - 1}
          height={height - 1}
        />
      )}
    </>
  );
};

/** One signed bar hanging from the zero rule: gains hatched, losses stippled. */
const DivergingBar = (props: {
  frame: Frame;
  i: number;
  tone: Phase;
  value: number;
}) => {
  const { frame, i, tone, value } = props;
  const y0 = Math.round(frame.y(0));
  const yv = Math.round(frame.y(value));
  const neg = value < 0;
  return (
    <g className={`grow-y ${neg ? "from-top" : ""}`} style={{ "--i": i }}>
      <SegmentRect
        paint={segmentPaint(neg ? "loss" : "gain", tone, frame)}
        {...barX(frame, i)}
        top={Math.min(y0, yv)}
        bottom={Math.max(y0, yv)}
      />
    </g>
  );
};

interface Segment {
  id: string;
  grammar: Grammar;
  top: number;
  bottom: number;
}

/** The stacked segments of one month, splitting off any part over plan. */
const segmentsFor = (props: MonthlyBarsProps, frame: Frame, i: number) => {
  const plan = props.plan?.value;
  let acc = 0;
  return props.stacks.flatMap((s): Segment[] => {
    const from = acc;
    acc += s.values[i] ?? 0;
    const id = `${monthKey(frame.months, i)}-${s.tone}`;
    if (plan !== undefined && acc > plan) {
      return [
        { bottom: from, grammar: s.tone, id, top: plan },
        { bottom: plan, grammar: "over", id: `${id}-over`, top: acc },
      ];
    }
    return [{ bottom: from, grammar: s.tone, id, top: acc }];
  });
};

/** The least height an overflow cap is drawn at, px, so a sliver still shows. */
const MIN_OVER = 3;
/** A cap smaller than this either way, px, can't carry its hatch: solid ink. */
const MIN_HATCH = 8;

/**
 * A segment's whole-pixel edges and paint. An overflow cap is never shorter
 * than MIN_OVER, and too small to engrave cleanly it is solid ink instead.
 */
const placeSegment = (
  seg: Segment,
  k: number,
  frame: Frame,
  tone: Phase,
  width: number
) => {
  // A 1px paper gap above each lower segment.
  const bottom = Math.round(frame.y(seg.bottom)) - (k > 0 ? 1 : 0);
  const top = Math.round(frame.y(seg.top));
  if (seg.grammar !== "over") {
    return { bottom, paint: segmentPaint(seg.grammar, tone, frame), top };
  }
  const capTop = Math.min(top, bottom - MIN_OVER);
  const small = bottom - capTop < MIN_HATCH || width < MIN_HATCH;
  return {
    bottom,
    paint: small ? solid("fill-hero") : segmentPaint("over", tone, frame),
    top: capTop,
  };
};

const StackedBar = (props: {
  chart: MonthlyBarsProps;
  frame: Frame;
  i: number;
  tone: Phase;
}) => {
  const { frame, i } = props;
  const x = barX(frame, i);
  return (
    <g className="grow-y" style={stagger(i, "fine")}>
      {segmentsFor(props.chart, frame, i).map((seg, k) => (
        <SegmentRect
          key={seg.id}
          {...x}
          {...placeSegment(seg, k, frame, props.tone, x.width)}
        />
      ))}
    </g>
  );
};

const Bars = (props: {
  chart: MonthlyBarsProps;
  frame: Frame;
  cursor: number;
}) => {
  const { chart, cursor, frame } = props;
  return frame.months.map((month, i) => {
    const tone = phase(i, cursor);
    if (chart.diverging === true) {
      const v = chart.stacks[0].values[i];
      if (v === null) {
        return null;
      }
      return (
        <DivergingBar
          key={month.toISOString()}
          frame={frame}
          i={i}
          tone={tone}
          value={v}
        />
      );
    }
    return (
      <StackedBar
        key={month.toISOString()}
        chart={chart}
        frame={frame}
        i={i}
        tone={tone}
      />
    );
  });
};

/** The plan line, drawn behind the bars. */
const PlanRule = (props: { plan: Plan; frame: Frame }) => {
  const { m, width, y } = props.frame;
  const by = crisp(y(props.plan.value));
  return (
    <line
      className={`${RULE_TARGET} fade`}
      x1={m.left}
      x2={width - m.right}
      y1={by}
      y2={by}
    />
  );
};

/** The plan's name on a plate at the left, over the bars that run past it. */
const PlanLabel = (props: { plan: Plan; frame: Frame }) => {
  const { m, y } = props.frame;
  const text = props.plan.label;
  if (text === undefined || text === "") {
    return null;
  }
  return (
    <g className="fade">
      <PlateLabel
        anchor="start"
        className={TICK}
        text={text}
        x={m.left + 6}
        y={y(props.plan.value) - 14}
      />
    </g>
  );
};

/** Series labels beside the last bar, centred on each segment. */
const SideLabels = (props: { stacks: Stack[]; frame: Frame }) => {
  const { m, months, width, y } = props.frame;
  const last = months.length - 1;
  let acc = 0;
  return props.stacks.map((s) => {
    const v = s.values[last] ?? 0;
    const mid = acc + v / 2;
    acc += v;
    if (s.label === undefined || s.label === "") {
      return null;
    }
    return (
      <text
        key={s.label}
        className={`${LABEL} fade`}
        x={width - m.right + SIDE_GAP}
        y={y(mid)}
        dy="0.34em"
        style={{ fill: LABEL_FILL[s.tone] }}
      >
        {s.label}
      </text>
    );
  });
};

const Axes = (props: {
  chart: MonthlyBarsProps;
  frame: Frame;
  readout: Readout;
  ticks: number[];
}) => {
  const { chart, frame } = props;
  return (
    <>
      <MonthAxis
        ticks={labelledTicks(props.ticks, (i) => frame.months[i], frame.center)}
        y={frame.plotBottom + 14}
        width={frame.width}
      />
      {sideLabelled(chart, props.readout) && (
        <SideLabels stacks={chart.stacks} frame={frame} />
      )}
    </>
  );
};

/** Clear space between a bar's end and its value, px. */
const VALUE_LIFT = 6;

/**
 * The total (or signed value) at the cursor. At rest it sits just off its
 * bar's end; while scrubbing it rides at the top of the plot, over the cursor.
 */
const ValueReadout = (props: {
  chart: MonthlyBarsProps;
  frame: Frame;
  index: number;
  scrubbing: boolean;
}) => {
  const { chart, frame, index } = props;
  const value =
    chart.diverging === true
      ? (chart.stacks[0].values[index] ?? 0)
      : chart.stacks.reduce((sum, s) => sum + (s.values[index] ?? 0), 0);
  const end = Math.round(frame.y(value));
  const below = !props.scrubbing && value < 0;
  let y = end - VALUE_LIFT;
  if (props.scrubbing) {
    y = frame.m.top - 16;
  } else if (below) {
    y = end + VALUE_LIFT;
  }
  return (
    <text
      x={frame.center(index)}
      y={y}
      dy={below ? "0.71em" : undefined}
      textAnchor="middle"
      className={VALUE}
    >
      {chart.format(value)}
    </text>
  );
};

type Scrub = ReturnType<typeof useScrub>;

const makeFrame = (
  chart: MonthlyBarsProps,
  readout: Readout,
  months: Date[],
  tex: (name: string) => string,
  width: number
): Frame => {
  const m = plotMargin(chart, readout);
  const h = chart.height;
  const x = scaleBand<number>()
    .domain(months.map((_, i) => i))
    .range([m.left, width - m.right])
    .paddingInner(chart.compact === undefined ? 0.38 : 0.3)
    .paddingOuter(0.2);
  return {
    center: (i: number) => (x(i) ?? 0) + x.bandwidth() / 2,
    height: h,
    m,
    months,
    plotBottom: h - m.bottom,
    tex,
    thin: x.bandwidth() < MIN_ENGRAVED,
    width,
    x,
    y: scaleLinear()
      .domain(chart.y.domain)
      .range([h - m.bottom, m.top]),
  };
};

const MonthlyBarsPlot = (props: {
  chart: MonthlyBarsProps;
  cursor: number;
  tex: (name: string) => string;
  months: Date[];
  readout: Readout;
  scrub: Scrub;
  width: number;
}) => {
  const { chart, cursor, months, readout, scrub, width } = props;
  const frame = makeFrame(chart, readout, months, props.tex, width);
  const { center, m } = frame;
  const positions = months.map((_, i) => center(i));
  const ticks = monthTickIndices(months);
  const compact = chart.compact !== undefined;
  // Rules reach a little left of the first bar, unless the scale sits right.
  const ruleX0 = m.left - (compact || chart.y.side === "right" ? 0 : 4);
  const ruleX1 = gridEnd(chart.y, width, m.right);
  const diverging = chart.diverging === true;
  // The baseline: zero for signed bars, else the bottom of the scale.
  const baseY = crisp(frame.y(diverging ? 0 : chart.y.domain[0]));
  // Signed bars rule every tick, the bottom one too; the zero rule covers its own.
  const floor = diverging ? frame.plotBottom + 2 : frame.plotBottom;

  return (
    <svg
      width={width}
      height={chart.height}
      aria-label={chart.label}
      {...scrub.bind(positions)}
    >
      <title>{chart.label}</title>
      <BarPatterns tex={props.tex} />
      {!compact && (
        <ValueGrid
          floor={floor}
          format={chart.y.format ?? String}
          labelFloor
          side={chart.y.side}
          ticks={chart.y.ticks ?? []}
          x0={ruleX0}
          x1={ruleX1}
          y={frame.y}
        />
      )}
      {chart.plan !== undefined && <PlanRule plan={chart.plan} frame={frame} />}
      <Bars chart={chart} frame={frame} cursor={cursor} />
      <line
        className={RULE_ZERO}
        x1={ruleX0}
        x2={ruleX1}
        y1={baseY}
        y2={baseY}
      />
      {!compact && (
        <Axes chart={chart} frame={frame} readout={readout} ticks={ticks} />
      )}
      {chart.plan !== undefined && (
        <PlanLabel plan={chart.plan} frame={frame} />
      )}
      {readout === "value" && cursor !== Infinity && (
        <ValueReadout
          chart={chart}
          frame={frame}
          index={scrub.index}
          scrubbing={scrub.isHovering}
        />
      )}
    </svg>
  );
};

/** Monthly bars, single or stacked, with a scrub cursor splitting past from future. */
export const MonthlyBars = (props: MonthlyBarsProps) => {
  const tex = useTextureIds("mb");
  const months = props.months ?? MONTHS;
  const scrub = useScrub(props.rest ?? 0, months, props.sync);
  const cursor =
    props.rest === null && !scrub.isHovering ? Infinity : scrub.index;
  const readout = props.readout ?? "none";

  return (
    <Chart top={chartTop(props, readout, scrub.index, tex)}>
      {(width) => (
        <MonthlyBarsPlot
          chart={props}
          cursor={cursor}
          tex={tex}
          months={months}
          readout={readout}
          scrub={scrub}
          width={width}
        />
      )}
    </Chart>
  );
};
