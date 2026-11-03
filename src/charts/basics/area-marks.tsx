import { monthTickLabels } from "../../lib/format";
import { Dot } from "../markers";
import { MARK_WEIGHT } from "../marks";
import { Label } from "../text";
import { sansWidth, stagger } from "../util";
import { hasStem, isLongSpan, startsMonth, stemClass } from "./area-shapes";
import type { Frame } from "./area-shapes";
import { reactKeyOf, valueAt } from "./daily-readings";
import type { Reading, Series } from "./daily-readings";

/** Weekly (or monthly) 2px stems, floor to value, on whole pixels. */
export interface DayStemsProps extends Series {
  /** Whether a reading clears the reference line that asks for ink; undefined when none does. */
  clearing: (i: number) => boolean | undefined;
  /** The first forecast reading: its days stand no stems. */
  forecast: number;
  frame: Frame;
  hero: number;
  hover: number | null;
}

export const DayStems = ({
  clearing,
  forecast,
  frame,
  hero,
  hover,
  live,
  readings,
}: DayStemsProps) => (
  <g>
    {live.map((i) => {
      const monthly = isLongSpan(readings);
      if (
        !hasStem(readings, i, { hero, hover, monthly }) ||
        (i >= forecast && i !== hero)
      ) {
        return null;
      }
      const top = Math.round(frame.y(valueAt(readings, i)));
      const base = Math.round(frame.floor);
      return (
        <rect
          className={`transition-tone ${stemClass(i === hero, i === hover, clearing(i))}`}
          height={Math.max(0, base - top)}
          key={reactKeyOf(readings[i], i)}
          style={stagger(i, "fine")}
          width={MARK_WEIGHT}
          x={Math.round(frame.x(i)) - MARK_WEIGHT / 2}
          y={top}
        />
      );
    })}
  </g>
);

/** Room kept between two month labels, px. */
const MONTH_GAP = 6;

/**
 * A label at each first of the month (each quarter over a long span); the
 * year on the first and where it changes.
 */
export const MonthAxis = ({
  frame,
  readings,
}: {
  frame: Frame;
  readings: Reading[];
}) => {
  const every = isLongSpan(readings) ? 3 : 1;
  // The first reading of each month, so weekly readings get month ticks too.
  const months = readings.flatMap((r, i) =>
    r.date.getUTCMonth() % every === 0 && startsMonth(readings, i) ? [i] : []
  );
  const axis = months.includes(0) ? months : [0, ...months];
  const labels = monthTickLabels(axis.map((i) => readings[i].date));
  // A narrow plot (a small multiple) drops a label that would touch the last.
  const kept: { i: number; k: number }[] = [];
  let end = -Infinity;
  for (const [k, i] of axis.entries()) {
    const width = sansWidth(labels[k]);
    const left = k === 0 ? frame.x(i) - 6 : frame.x(i) - width / 2;
    if (left >= end + MONTH_GAP) {
      end = left + width;
      kept.push({ i, k });
    }
  }
  return (
    <g>
      {kept.map(({ i, k }) => (
        <Label
          anchor={k === 0 ? "start" : "middle"}
          dx={k === 0 ? -6 : 0}
          key={reactKeyOf(readings[i], i)}
          voice="axis"
          x={frame.x(i)}
          y={frame.floor + 20}
        >
          {labels[k]}
        </Label>
      ))}
    </g>
  );
};

/** The hero: an ink dot on the line with its value above. */
export const HeroMark = ({
  format,
  frame,
  value,
  x,
}: {
  format: (v: number) => string;
  frame: Frame;
  value: number;
  x: number;
}) => (
  <>
    <Dot
      className="pop fill-hero"
      cx={x}
      cy={frame.y(value)}
      size="md"
      style={stagger(40, "fine")}
    />
    <Label
      anchor="middle"
      order={10}
      voice="value"
      x={x}
      y={frame.y(value) - 13}
    >
      {format(value)}
    </Label>
  </>
);
