import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { utcFormat } from "d3-time-format";
import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import { monthTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { MARK_WEIGHT } from "../marks";
import { Stipple } from "../texture";
import { paint, TEXTURE_PITCH, useTextureIds } from "../texture-ids";
import { centreOn, dragTo, keyTo } from "./brush-math";
import type { Drag, Grip, Span } from "./brush-math";
import type { DayValue } from "./brushed-overview.data";

/** Strip height: a 44px touch target on its own, plus a pixel of floor. */
const STRIP_H = 48;
/** Half the invisible hit width of each handle (44px in all). */
const GRIP = 22;

const fmtDay = utcFormat("%-d %b %Y");

/** Room a month name needs: "Jan 2026" and a gap, at 11px. */
const MONTH_ROOM = 64;

/** Label every month, every other, or every quarter, as the room allows. */
const monthStep = (span: number) => {
  const month = span / 12;
  if (month >= MONTH_ROOM) {
    return 1;
  }
  return month * 2 >= MONTH_ROOM ? 2 : 3;
};

/** Month names under the strip, at each month's first day. */
const StripMonths = (props: {
  data: DayValue[];
  every: number;
  x: (i: number) => number;
}) => {
  const firsts = props.data.flatMap((d, i) =>
    d.date.getUTCDate() === 1 && d.date.getUTCMonth() % props.every === 0
      ? [i]
      : []
  );
  const labels = monthTickLabels(firsts.map((i) => props.data[i].date));
  return (
    <g>
      {firsts.map((i, k) => (
        <text
          className="t-axis"
          key={props.data[i].date.toISOString()}
          x={props.x(i) + 4}
          y={STRIP_H + 16}
        >
          {labels[k]}
        </text>
      ))}
    </g>
  );
};

/** Pointer handlers for each grip: capture on press, follow, let go. */
const useDrag = (
  x: ScaleLinear<number, number>,
  span: Span,
  last: number,
  onChange: (s: Span) => void
) => {
  const drag = useRef<Drag | null>(null);
  const dayAt = (e: PointerEvent<SVGElement>) => {
    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    return x.invert(e.clientX - (box?.left ?? 0));
  };
  const stop = () => {
    drag.current = null;
  };
  return (grip: Grip) => ({
    onLostPointerCapture: stop,
    onPointerDown: (e: PointerEvent<SVGRectElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const from = grip === "outside" ? centreOn(span, dayAt(e), last) : span;
      if (grip === "outside") {
        onChange(from);
      }
      const held = grip === "outside" ? "body" : grip;
      drag.current = { from, grip: held, origin: dayAt(e) };
    },
    onPointerMove: (e: PointerEvent<SVGRectElement>) => {
      if (drag.current !== null) {
        const delta = Math.round(dayAt(e) - drag.current.origin);
        onChange(dragTo(drag.current, delta, last));
      }
    },
    onPointerUp: stop,
  });
};

type GripHandlers = ReturnType<ReturnType<typeof useDrag>>;

/** The outlined window, its two grips, and the 44px hit areas around them. */
const Window = (props: {
  focused: boolean;
  grip: (g: Grip) => GripHandlers;
  xa: number;
  xb: number;
}) => {
  const { xa, xb } = props;
  // Handles keep their full 44px; on a narrow window they split the middle.
  const inner = Math.min(GRIP, Math.max(0, (xb - xa) / 2));
  const line2 = props.focused ? 2 : 1;
  return (
    <g>
      <rect
        className="stroke-ink shape-crisp fill-none"
        height={STRIP_H - line2}
        strokeWidth={line2}
        width={Math.max(1, xb - xa)}
        x={xa + line2 / 2}
        y={line2 / 2}
      />
      {[xa + 1, xb].map((x) => (
        <line
          className="stroke-ink"
          key={x === xb ? "end" : "start"}
          strokeWidth={MARK_WEIGHT}
          x1={x}
          x2={x}
          y1={STRIP_H / 2 - 8}
          y2={STRIP_H / 2 + 8}
        />
      ))}
      <rect
        className="cursor-grab fill-transparent active:cursor-grabbing"
        height={STRIP_H}
        width={Math.max(0, xb - xa)}
        x={xa}
        y={0}
        {...props.grip("body")}
      />
      <rect
        className="cursor-ew-resize fill-transparent"
        height={STRIP_H}
        width={GRIP + inner}
        x={xa - GRIP}
        y={0}
        {...props.grip("start")}
      />
      <rect
        className="cursor-ew-resize fill-transparent"
        height={STRIP_H}
        width={GRIP + inner}
        x={xb - inner}
        y={0}
        {...props.grip("end")}
      />
    </g>
  );
};

interface StripProps {
  data: DayValue[];
  /** Each day's 7-day mean: the strip draws this, a smooth silhouette. */
  mean: number[];
  onChange: (s: Span) => void;
  span: Span;
  width: number;
  x0: number;
  x1: number;
}

/**
 * The overview: the whole year's 7-day mean as a quiet silhouette, the window an outlined
 * rectangle to drag, resize at either edge, or move with the arrow keys.
 * Keys go to a visually hidden range input; its focus thickens the outline.
 */
export const BrushStrip = (props: StripProps) => {
  const tex = useTextureIds("brush");
  const [focused, setFocused] = useState(false);
  const last = props.data.length - 1;
  const x = scaleLinear().domain([0, last]).range([props.x0, props.x1]);
  const grip = useDrag(x, props.span, last, props.onChange);
  const y = scaleLinear()
    .domain([Math.min(...props.mean), Math.max(...props.mean)])
    .range([STRIP_H - 6, 6]);
  const path =
    line<number>()
      .x((_, i) => x(i))
      .y((m) => y(m))
      .curve(curveMonotoneX)(props.mean) ?? "";
  const tint =
    area<number>()
      .x((_, i) => x(i))
      .y0(STRIP_H - 1)
      .y1((m) => y(m))
      .curve(curveMonotoneX)(props.mean) ?? "";
  const xa = Math.round(x(props.span.a));
  const xb = Math.round(x(props.span.b));
  const len = props.span.b - props.span.a;
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const next = keyTo(e.key, props.span, last);
    if (next !== null) {
      e.preventDefault();
      props.onChange(next);
    }
  };
  return (
    <div className="relative">
      <input
        aria-label="Window over the year"
        aria-valuetext={`${fmtDay(props.data[props.span.a].date)} to ${fmtDay(props.data[props.span.b].date)}`}
        className="sr-only"
        max={last - len}
        min={0}
        onBlur={() => {
          setFocused(false);
        }}
        onChange={(e) => {
          const a = Number(e.currentTarget.value);
          props.onChange({ a, b: a + len });
        }}
        onFocus={() => {
          setFocused(true);
        }}
        onKeyDown={onKey}
        type="range"
        value={props.span.a}
      />
      <svg
        aria-hidden="true"
        className="touch-none"
        height={STRIP_H + 24}
        width={props.width}
      >
        <defs>
          <clipPath id={tex("in")}>
            <rect height={STRIP_H} width={Math.max(0, xb - xa)} x={xa} y={0} />
          </clipPath>
          <Stipple id={tex("out")} pitch={TEXTURE_PITCH.dense} tone="fill-l5" />
          <Stipple id={tex("sel")} pitch={TEXTURE_PITCH.dense} tone="fill-l4" />
        </defs>
        <line
          className="hairline"
          x1={props.x0}
          x2={props.x1}
          y1={crisp(STRIP_H - 1)}
          y2={crisp(STRIP_H - 1)}
        />
        <path d={tint} fill={paint(tex("out"))} />
        <path clipPath={paint(tex("in"))} d={tint} fill={paint(tex("sel"))} />
        <path
          className="stroke-l5 stroke-medium cap-round fill-none"
          d={path}
        />
        <path
          className="stroke-l2 stroke-medium cap-round fill-none"
          clipPath={paint(tex("in"))}
          d={path}
        />
        <StripMonths
          data={props.data}
          every={monthStep(props.x1 - props.x0)}
          x={(i) => x(i)}
        />
        <rect
          className="fill-transparent"
          height={STRIP_H}
          width={props.x1 - props.x0}
          x={props.x0}
          y={0}
          {...grip("outside")}
        />
        <Window focused={focused} grip={grip} xa={xa} xb={xb} />
      </svg>
    </div>
  );
};
