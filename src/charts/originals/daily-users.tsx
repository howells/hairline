import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area as d3area, curveMonotoneX, line as d3line } from "d3-shape";
import { utcFormat } from "d3-time-format";

import { fmtDegC, monthTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useScrub } from "../hooks";
import { Dot } from "../markers";
import { STEM } from "../marks";
import { Hatch, KeySwatch, Stipple } from "../texture";
import { paint, TEXTURE_PITCH, useTextureIds } from "../texture-ids";
import { stagger, weeklyMean } from "../util";
import { ValueGrid } from "../value-grid";
import { dailyUsers } from "./daily-users.data";
import type { DayCount } from "./daily-users.data";
import { Key } from "./key";

const fmtDay = utcFormat("%a %-d %b");
const fmtSigned = (v: number) => {
  const t = Math.abs(v).toFixed(1);
  return `${v < 0 && t !== "0.0" ? "−" : "+"}${t} °C`;
};
/** Value rules at whole degrees need no decimal ("30 °C"). */
const fmtTick = (v: number) => fmtDegC(v).replace(".0 °C", " °C");

interface Frame {
  floor: number;
  x: (i: number) => number;
  x0: number;
  x1: number;
  y: ScaleLinear<number, number>;
}

interface StemsProps {
  data: DayCount[];
  frame: Frame;
  hero: number;
  hover: number | null;
  mean: number[];
}

const stemClass = (hero: boolean, hover: boolean) => {
  if (hero) {
    return "stroke-ink";
  }
  return hover ? "stroke-l1" : "stroke-l4";
};

/** One stem per day, from the week's mean out to the day's maximum. */
const Stems = ({ data, frame, hero, hover, mean }: StemsProps) => (
  <g>
    {data.map((d, i) => {
      const above = d.value >= mean[i];
      const x = i === hero ? Math.round(frame.x(i)) : crisp(frame.x(i));
      return (
        <line
          className={`grow-y transition-tone shape-crisp ${above ? "" : "from-top"} ${stemClass(i === hero, hover === i)}`}
          key={d.date.toISOString()}
          strokeWidth={i === hero ? STEM.hero : STEM.rest}
          style={stagger(i, "dense")}
          x1={x}
          x2={x}
          y1={frame.y(mean[i])}
          y2={frame.y(d.value)}
        />
      );
    })}
  </g>
);

interface ExcursionProps {
  frame: Frame;
  mean: number[];
  tex: (name: string) => string;
  values: number[];
}

/**
 * The room between each day and its week, engraved on paper inside a 1px
 * rule: a stipple where a day ran over the mean, a falling hatch where it
 * fell short.
 */
const Excursions = ({ frame, mean, tex, values }: ExcursionProps) => {
  const band = d3area<number>()
    .x((_, i) => frame.x(i))
    .y0((_, i) => frame.y(mean[i]))
    .y1((v) => frame.y(v))
    .curve(curveMonotoneX)(values);
  const side = (edge: number) =>
    d3area<number>()
      .x((_, i) => frame.x(i))
      .y0((m) => frame.y(m))
      .y1(edge)
      .curve(curveMonotoneX)(mean) ?? "";
  return (
    <g className="fade" style={stagger(4)}>
      <defs>
        <Stipple id={tex("over")} pitch={TEXTURE_PITCH.dense} tone="fill-l3" />
        <Hatch
          angle="falling"
          id={tex("under")}
          pitch={TEXTURE_PITCH.hatch}
          tone="fill-l4"
        />
        <clipPath id={tex("above")}>
          <path d={side(0)} />
        </clipPath>
        <clipPath id={tex("below")}>
          <path d={side(frame.floor + 40)} />
        </clipPath>
      </defs>
      {["above", "below"].map((half) => (
        <path
          className="stroke-l5"
          clipPath={paint(tex(half))}
          d={band ?? ""}
          fill={paint(tex(half === "above" ? "over" : "under"))}
          key={half}
          strokeWidth={1}
        />
      ))}
    </g>
  );
};

interface AxesProps {
  data: DayCount[];
  frame: Frame;
  width: number;
}

/**
 * Count rules across the plot with their values on the right, beside the
 * latest days; month names under it, the year on the first.
 */
const Axes = ({ data, frame, width }: AxesProps) => {
  const firsts = data.flatMap((d, i) => (d.date.getUTCDate() === 1 ? [i] : []));
  const months = monthTickLabels(firsts.map((i) => data[i].date));
  return (
    <g>
      <ValueGrid
        floor={frame.floor}
        ticks={frame.y.ticks(width < 420 ? 3 : 4)}
        format={fmtTick}
        side="right"
        x0={frame.x0}
        x1={width}
        y={frame.y}
      />
      {firsts.map((i, k) => (
        <text
          className="t-axis"
          key={data[i].date.toISOString()}
          x={frame.x(i)}
          y={frame.floor + 22}
        >
          {months[k]}
        </text>
      ))}
    </g>
  );
};

/** The key: the mean's line, and a swatch of each side's engraving. */
const keyItems = (tex: (name: string) => string) => [
  {
    label: "Weekly mean",
    mark: (
      <line
        className="stroke-l2 cap-round"
        strokeWidth={1.5}
        x1={1}
        x2={11}
        y1={0}
        y2={0}
      />
    ),
  },
  {
    label: "Above",
    mark: <KeySwatch fill={paint(tex("over"))} x={0} y={-6} />,
  },
  {
    label: "Below",
    mark: <KeySwatch fill={paint(tex("under"))} x={0} y={-6} />,
  },
];

/** Left of the plot is bare; the value column sits on the right. */
const MARGIN = { bottom: 30, left: 0, right: 40, top: 44 };

const makeFrame = (data: DayCount[], width: number, height: number) => {
  const values = data.map((d) => d.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x0 = MARGIN.left;
  const x1 = width - MARGIN.right;
  const floor = height - MARGIN.bottom;
  const pitch = (x1 - x0) / data.length;
  return {
    floor,
    x: (i: number) => x0 + (i + 0.5) * pitch,
    x0,
    x1,
    y: scaleLinear()
      .domain([lo - (hi - lo) * 0.06, hi])
      .range([floor, MARGIN.top]),
  };
};

interface SvgProps {
  data: DayCount[];
  height: number;
  scrub: ReturnType<typeof useScrub>;
  width: number;
}

const DailyUsersSvg = ({ data, height, scrub, width }: SvgProps) => {
  const tex = useTextureIds("daily-users");
  const frame = makeFrame(data, width, height);
  const mean = weeklyMean(data.map((d) => d.value));
  const values = data.map((d) => d.value);
  const hero = values.indexOf(Math.max(...values));
  const hover = scrub.isHovering ? scrub.index : null;
  const path =
    d3line<number>()
      .x((_, i) => frame.x(i))
      .y((m) => frame.y(m))
      .curve(curveMonotoneX)(mean) ?? "";
  const label = `Daily maximum temperature, ${fmtDay(data[0].date)} to ${fmtDay(data.at(-1)?.date ?? data[0].date)}: hottest ${fmtDegC(values[hero])} on ${fmtDay(data[hero].date)}`;

  return (
    <>
      <svg
        aria-label={label}
        height={height}
        width={width}
        {...scrub.bind(data.map((_, i) => frame.x(i)))}
      >
        <title>{label}</title>
        <Axes data={data} frame={frame} width={width} />
        <Excursions frame={frame} mean={mean} tex={tex} values={values} />
        <Stems
          data={data}
          frame={frame}
          hero={hero}
          hover={hover}
          mean={mean}
        />
        <path
          className="draw stroke-l2 cap-round fill-none"
          d={path}
          pathLength={1}
          strokeWidth={1.5}
        />
        <Dot
          className="pop fill-hero"
          cx={Math.round(frame.x(hero))}
          cy={frame.y(values[hero])}
          size="md"
          style={stagger(8)}
        />
        <text
          className="fade t-value"
          style={stagger(8)}
          textAnchor="middle"
          x={frame.x(hero)}
          y={frame.y(values[hero]) - 10}
        >
          {fmtDegC(values[hero])}
        </text>
        {hover === null || hover === hero ? null : (
          <Dot
            className="fill-l2"
            cx={crisp(frame.x(hover))}
            cy={frame.y(values[hover])}
            size="sm"
          />
        )}
        <Key items={keyItems(tex)} right={width} y={10} />
      </svg>
      {hover === null ? null : (
        <Tooltip
          x={frame.x(hover)}
          y={Math.min(frame.y(values[hover]), frame.y(mean[hover])) - 6}
        >
          <b>{fmtDay(data[hover].date)}</b> · {fmtDegC(values[hover])} ·{" "}
          {fmtSigned(values[hover] - mean[hover])} vs mean
        </Tooltip>
      )}
    </>
  );
};

interface DailyUsersProps {
  data?: DayCount[];
  height?: number;
}

/**
 * O1 Summer of 1976. The 7-day mean as one quiet line, and every day hung from
 * it as a stem out to its own maximum: each day reaches above the
 * week or falls short of it, so the heatwave and the break in the weather read
 * as a comb along the trend. The hottest day is in ink.
 */
export const DailyUsers = (props: DailyUsersProps) => {
  const data = props.data ?? dailyUsers;
  const height = props.height ?? 460;
  const scrub = useScrub(
    0,
    data.map((d) => d.date)
  );

  return (
    <Plot>
      {(width) => (
        <DailyUsersSvg
          data={data}
          height={height}
          scrub={scrub}
          width={width}
        />
      )}
    </Plot>
  );
};
