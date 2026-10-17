import { scaleLinear } from "d3-scale";
import { curveCatmullRomClosed, lineRadial } from "d3-shape";
import type { PointerEvent } from "react";

import { fmtDegC, fmtMonth, monthTickLabels } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { TipText } from "../hover";
import { Dot } from "../markers";
import { RING_STEP } from "../marks";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { DotRing, Hatch, PlateLabel } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { stagger } from "../util";
import { signupMonthsDemo } from "./radial-year.data";
import type { MonthValue } from "./radial-year.data";

const fmt = fmtDegC;
/** Ring values are whole degrees ("20 °C"). */
const fmtRing = (v: number) => fmtDegC(v).replace(".0 °C", " °C");

/** Room outside the outer ring for the month names. */
const EDGE = 30;

/** Month i's angle, clockwise from twelve o'clock. */
const angleOf = (i: number, n: number) => (i / n) * Math.PI * 2;

/** Ring values sit just inside their rings, half a month past twelve o'clock. */
const RING_LABEL = Math.PI / 12;

const polar = (angle: number, r: number) => ({
  x: Math.sin(angle) * r,
  y: -Math.cos(angle) * r,
});

interface DialProps {
  data: MonthValue[];
  hover: number | null;
  r: (v: number) => number;
  rings: number[];
  outer: number;
}

/** Ring values sit this far inside their rings; a plate is 15px tall. */
const RING_INSET = 10;
const PLATE_HALF = 7.5;

/**
 * The year's radius along the ring labels' line, half a month past noon: the
 * midpoint of the smooth curve between the first two months.
 */
const yearRadiusAtLabels = (props: DialProps) => {
  const n = props.data.length;
  const at = (i: number) => {
    const k = (i + n) % n;
    return polar(angleOf(k, n), props.r(props.data[k].value));
  };
  const [a, b, c, d] = [at(-1), at(0), at(1), at(2)];
  return Math.hypot(
    (9 * (b.x + c.x) - a.x - d.x) / 16,
    (9 * (b.y + c.y) - a.y - d.y) / 16
  );
};

/**
 * Evenly dotted rings, the chart's one dotted system, with their values up
 * the twelve o'clock line; months round the edge. A value that falls on the
 * hatched year sits on a plate; off it, on its halo.
 */
const Furniture = (props: DialProps) => {
  const n = props.data.length;
  const names = monthTickLabels(props.data.map((d) => d.date));
  const year = yearRadiusAtLabels(props);
  return (
    <g>
      {props.rings.map((v) => {
        const at = polar(RING_LABEL, props.r(v) - RING_INSET);
        const onYear = year > props.r(v) - RING_INSET - PLATE_HALF;
        return (
          <g key={v}>
            <DotRing
              cx={0}
              cy={0}
              r={props.r(v)}
              step={RING_STEP.guide}
              tone="fill-l4"
            />
            {onYear ? (
              <PlateLabel
                className="t-axis"
                text={fmtRing(v)}
                x={at.x}
                y={at.y}
              />
            ) : (
              <Label anchor="middle" halo middle voice="axis" x={at.x} y={at.y}>
                {fmtRing(v)}
              </Label>
            )}
          </g>
        );
      })}
      {props.data.map((d, i) => {
        const p = polar(angleOf(i, n), props.outer + EDGE / 2);
        return (
          <Label
            anchor="middle"
            key={d.date.toISOString()}
            middle
            voice={props.hover === i ? "label" : "axis"}
            x={p.x}
            y={p.y}
          >
            {names[i]}
          </Label>
        );
      })}
    </g>
  );
};

/** The closed year as one smooth path. */
const yearPath = (props: DialProps) =>
  lineRadial<MonthValue>()
    .curve(curveCatmullRomClosed.alpha(0.5))
    .angle((_, i) => angleOf(i, props.data.length))
    .radius((d) => props.r(d.value))(props.data) ?? "";

/** The year's area, hatched on paper; the rings are drawn over it. */
const YearFill = (props: DialProps & { hatch: string }) => (
  <path className="fade" d={yearPath(props)} fill={paint(props.hatch)} />
);

/** The year's outline, the peak in ink with its value, the hovered month as a dot. */
const Trace = (props: DialProps & { peak: number }) => {
  const n = props.data.length;
  const path = yearPath(props);
  const peak = props.data[props.peak];
  const pp = polar(angleOf(props.peak, n), props.r(peak.value));
  const hp =
    props.hover === null
      ? null
      : polar(angleOf(props.hover, n), props.r(props.data[props.hover].value));
  return (
    <g>
      <path
        className="draw stroke-l3 stroke-medium cap-round fill-none"
        d={path}
        pathLength={1}
      />
      {hp === null ? null : (
        <Dot className="fill-l2" cx={hp.x} cy={hp.y} size="sm" />
      )}
      <Dot
        className="pop fill-hero"
        cx={pp.x}
        cy={pp.y}
        size="md"
        style={stagger(4, "series")}
      />
      <Label
        anchor={pp.x >= 0 ? "start" : "end"}
        dx={pp.x >= 0 ? 10 : -10}
        halo
        middle
        order={4}
        tier="series"
        voice="value"
        x={pp.x}
        y={pp.y}
      >
        {fmt(peak.value)}
      </Label>
    </g>
  );
};

/**
 * O7 Year in the round. Twelve months as one closed, hatched shape under
 * evenly dotted rings; the peak month is the single ink mark, with its value.
 */
export const RadialYear = (props: { data?: MonthValue[] }) => {
  const data = props.data ?? signupMonthsDemo;
  const hover = useHover<number>();
  const hatch = useTextureIds("year")("hatch");
  const values = data.map((d) => d.value);
  const peak = values.indexOf(Math.max(...values));
  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[`${fmt(data[hover.at.key].value)} mean daily maximum`]}
              lead={fmtMonth(data[hover.at.key].date)}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const size = Math.min(width, 460);
        const outer = size / 2 - EDGE;
        const scale = scaleLinear()
          .domain([0, Math.max(...values)])
          .nice(3)
          .range([0, outer]);
        const rings = scale.ticks(3).filter((v) => v > 0);
        const cx = Math.round(width / 2);
        const cy = Math.round(size / 2);
        const label = `Mean daily maximum temperature by month, 2022: warmest ${fmt(data[peak].value)} in ${fmtMonth(data[peak].date)}`;
        const onMove = (e: PointerEvent<SVGSVGElement>) => {
          const box = e.currentTarget.getBoundingClientRect();
          const dx = e.clientX - box.left - cx;
          const dy = e.clientY - box.top - cy;
          const turn = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
          const i =
            Math.round((turn / (Math.PI * 2)) * data.length) % data.length;
          const p = polar(angleOf(i, data.length), scale(data[i].value));
          hover.show(i, cx + p.x, cy + p.y - 10);
        };
        const dial: DialProps = {
          data,
          hover: hover.key,
          outer: scale(scale.domain()[1]),
          r: scale,
          rings,
        };
        return (
          <ChartSvg
            className="touch-pan-y"
            height={size}
            label={label}
            leave={hover.clear}
            onPointerMove={onMove}
            width={width}
          >
            <defs>
              <Hatch id={hatch} tone="fill-l5" />
            </defs>
            <g transform={`translate(${cx} ${cy})`}>
              <YearFill {...dial} hatch={hatch} />
              <Furniture {...dial} />
              <Trace {...dial} peak={peak} />
            </g>
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
