// The engraved fills of the time-line chart: the shade under or between the
// lines, the gap where one series leads, and season bands.

import { area } from "d3-shape";

import type { Point } from "../../lib/data";
import { OUTLINE } from "../roles";
import { Label } from "../text";
import { DotScreen, Hatch, Rules, Stipple } from "../texture";
import { HALFTONE_R, paint } from "../texture-ids";
import { TICK_CHAR } from "./thin-ticks";
import { curveOf } from "./time-frame";
import type {
  Band,
  Frame,
  LineSeries,
  Shade,
  TimeLinesProps,
} from "./time-frame";

/** One shared pattern per engraving, all on paper. */
const ShadePattern = (props: { id: string; kind: Shade }) => {
  if (props.kind === "stipple") {
    return <Stipple id={props.id} tone="fill-l3" />;
  }
  if (props.kind === "rules") {
    return <Rules angle="upright" id={props.id} tone="fill-l5" />;
  }
  if (props.kind === "screen") {
    return <DotScreen id={props.id} r={HALFTONE_R[0]} tone="fill-l4" />;
  }
  return <Hatch id={props.id} tone="fill-l4" />;
};

export const Patterns = (props: { chart: TimeLinesProps; frame: Frame }) => {
  const { tex } = props.frame;
  return (
    <defs>
      <ShadePattern id={tex("shade")} kind={props.chart.texture ?? "hatch"} />
      <Hatch angle="falling" id={tex("lead-1")} tone="fill-l3" />
      <Hatch id={tex("lead-2")} tone="fill-l4" />
      <Stipple id={tex("season")} tone="fill-l4" />
    </defs>
  );
};

/** The shaded region: under the first series, or between the first two. */
const fillPath = (props: TimeLinesProps, frame: Frame) => {
  const [primary, secondary] = props.series;
  const { x, y } = frame;
  const region = area<Point>()
    .x((d) => x(d.date))
    .curve(curveOf(props));
  if (props.fill === "band" && secondary !== undefined) {
    return region
      .y0((_, i) => y(secondary.data[i].value))
      .y1((d) => y(d.value))(primary.data);
  }
  if (props.fill === "area") {
    return region.y0(y(props.y.domain[0])).y1((d) => y(d.value))(primary.data);
  }
  return null;
};

/**
 * The gap between two series, split by which one leads: each path is empty
 * wherever the other series is on top.
 */
const GapFill = (props: { chart: TimeLinesProps; frame: Frame }) => {
  const [a, b] = props.chart.series;
  const { tex, x, y } = props.frame;
  if (b === undefined) {
    return null;
  }
  const lead = (top: LineSeries, under: LineSeries) =>
    area<Point>()
      .x((d) => x(d.date))
      .y0((_, i) => y(under.data[i].value))
      .y1((d, i) => y(Math.max(d.value, under.data[i].value)))
      .curve(curveOf(props.chart))(top.data) ?? "";
  return (
    <g>
      <path d={lead(a, b)} fill={paint(tex("lead-1"))} />
      <path d={lead(b, a)} fill={paint(tex("lead-2"))} />
    </g>
  );
};

/** Narrowest a band is drawn, px. */
const MIN_BAND = 8;

/** A band's name over its middle, held inside the plot so it clears the scale. */
const BandLabel = (props: {
  band: Band;
  frame: Frame;
  x0: number;
  x1: number;
}) => {
  const { m, width } = props.frame;
  const half = (props.band.label.length * TICK_CHAR) / 2;
  const mid = (props.x0 + props.x1) / 2;
  const left = m.left + half;
  const right = width - m.right - half;
  return (
    <Label
      anchor="middle"
      voice="axis"
      x={Math.max(left, Math.min(right, mid))}
      y={m.top - 8}
    >
      {props.band.label}
    </Label>
  );
};

export const SeasonBands = (props: { bands: Band[]; frame: Frame }) => {
  const { m, plotBottom, tex, x } = props.frame;
  return props.bands.map((band) => {
    // A band too narrow to engrave is widened about its centre.
    const mid = (x(band.from) + x(band.to)) / 2;
    const half = Math.max(
      MIN_BAND / 2,
      Math.abs(x(band.to) - x(band.from)) / 2
    );
    const x0 = Math.round(mid - half);
    const x1 = Math.round(mid + half);
    return (
      <g key={band.from.toISOString()}>
        <rect
          x={x0}
          y={Math.round(m.top)}
          width={x1 - x0}
          height={Math.round(plotBottom) - Math.round(m.top)}
          fill={paint(tex("season"))}
        />
        <rect
          className={OUTLINE}
          x={x0 + 0.5}
          y={Math.round(m.top) + 0.5}
          width={x1 - x0 - 1}
          height={Math.round(plotBottom) - Math.round(m.top) - 1}
        />
        <BandLabel band={band} frame={props.frame} x0={x0} x1={x1} />
      </g>
    );
  });
};

/** The shade: past the cursor it stops, unless nothing changes there. */
export const ShadeLayer = (props: { chart: TimeLinesProps; frame: Frame }) => {
  const { chart, frame } = props;
  if (chart.fill === "gap") {
    return <GapFill chart={chart} frame={frame} />;
  }
  const shade = fillPath(chart, frame);
  if (shade === null || shade === undefined) {
    return null;
  }
  const clip = frame.future === "none" ? undefined : `url(#${frame.id}-past)`;
  return <path d={shade} fill={paint(frame.tex("shade"))} clipPath={clip} />;
};
