import { bisectCenter } from "d3-array";
import { scaleLinear, scaleUtc } from "d3-scale";
import type { ScaleLinear, ScaleTime } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { utcMonth } from "d3-time";
import { utcFormat } from "d3-time-format";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";

import { monthTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Control } from "../control";
import { Plot, Tooltip } from "../core";
import { useReducedMotion, useReveal, useSvgId } from "../hooks";
import { Dot, Ring } from "../markers";
import { easeTravel } from "../motion";
import { PlotNote } from "../plot-note";
import { DotScreen } from "../texture";
import { HALFTONE_R, paint } from "../texture-ids";
import { noteSpace } from "../util";
import { ValueGrid } from "../value-grid";
import { ControlSlot } from "./control-slot";
import { drawInDemo } from "./draw-in.data";
import type { DrawInDatum } from "./draw-in.data";
import { CONTROL_SLOT_H, useInView } from "./util-b";

interface DrawInProps {
  data?: DrawInDatum[];
  height?: number;
  format?: (v: number) => string;
  /** Caption under the big number, e.g. "2024-25". */
  caption?: string;
  /** Draw duration in ms. */
  duration?: number;
  note?: string;
}

interface Hit {
  i: number;
  x: number;
  y: number;
}

const fmtDate = utcFormat("%-d %b");

const plain = (v: number) => Math.round(v).toLocaleString("en-GB");
const goalsOf = (v: number) => `${plain(v)} goals`;

/** Progress 0 → 1 of the draw. Runs once revealed and on screen; reduced motion starts at 1. */
const useDrawClock = (
  box: RefObject<HTMLDivElement | null>,
  duration: number
) => {
  const revealed = useReveal(box);
  const inView = useInView(box);
  const reduced = useReducedMotion();
  const [p, setP] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0
  );
  const running = revealed && inView && !reduced && p < 1;

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - prev);
      prev = now;
      setP((cur) => Math.min(1, cur + dt / duration));
      raf = requestAnimationFrame(tick);
    };
    if (running) {
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [running, duration]);

  const handleReplay = () => {
    setP(0);
  };
  return { handleReplay, p: reduced ? 1 : p, reduced };
};

/** Baseline of the big number, and of its caption below it. */
const COUNTER_Y = 30;
const CAPTION_Y = 52;

/** The big number (the system's one large figure) and its caption, top left. */
const Counter = (props: {
  caption: string | undefined;
  text: string;
  x: number;
}) => (
  <g>
    <text className="t-value-lg" x={props.x} y={COUNTER_Y}>
      {props.text}
    </text>
    {props.caption === undefined ? null : (
      <text className="t-label fill-muted" x={props.x} y={CAPTION_Y}>
        {props.caption}
      </text>
    )}
  </g>
);

interface CurveProps {
  clip: string;
  floor: number;
  /** The plot's left edge: the value grid's rules start here. */
  left: number;
  pts: [number, number][];
  tipX: number;
  height: number;
  /** The svg's width: the grid's values end here. */
  width: number;
  y: ScaleLinear<number, number>;
}

/**
 * The dot-screened area and its 2px line, revealed left to right up to the
 * tip, with the grid between them so its rules cross the area but not the
 * line.
 */
const Curve = (p: CurveProps) => (
  <>
    <defs>
      <DotScreen
        ground="fill-paper"
        id={`${p.clip}-screen`}
        r={HALFTONE_R[0]}
        tone="fill-l4"
      />
      <clipPath id={p.clip}>
        <rect x={0} y={0} width={Math.max(0, p.tipX + 2)} height={p.height} />
      </clipPath>
    </defs>
    <path
      clipPath={`url(#${p.clip})`}
      d={area().curve(curveMonotoneX).y0(p.floor)(p.pts) ?? ""}
      fill={paint(`${p.clip}-screen`)}
    />
    <ValueGrid
      floor={p.floor}
      ticks={p.y.ticks(4)}
      format={plain}
      side="right"
      x0={p.left}
      x1={p.width}
      y={p.y}
    />
    <g clipPath={`url(#${p.clip})`}>
      <path
        d={line().curve(curveMonotoneX)(p.pts) ?? ""}
        className="stroke-ink fill-none"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  </>
);

interface FrameProps {
  data: DrawInDatum[];
  floor: number;
  hover: Hit | null;
  left: number;
  narrow: boolean;
  /** The svg's width: the baseline runs under the scale to here. */
  width: number;
  x: ScaleTime<number, number>;
  y: ScaleLinear<number, number>;
}

/** Baseline, month labels (the year once) and the hover plumb line. */
const Frame = (p: FrameProps) => {
  const [first] = p.data;
  const last = p.data.at(-1) ?? first;
  // Every other month on a wide plot, every quarter on a phone: room for
  // the year on the first.
  const every = p.narrow ? 3 : 2;
  const months = utcMonth
    .range(first.date, last.date)
    .filter((d) => d.getUTCMonth() % every === 0);
  const labels = monthTickLabels(months);
  return (
    <>
      <line
        className="hairline"
        x1={p.left}
        x2={p.width}
        y1={crisp(p.floor)}
        y2={crisp(p.floor)}
      />
      {months.map((d, k) => (
        <text key={d.getTime()} className="t-axis" x={p.x(d)} y={p.floor + 16}>
          {labels[k]}
        </text>
      ))}
      {p.hover === null ? null : (
        <g pointerEvents="none">
          <line
            className="stroke-faint shape-crisp"
            x1={crisp(p.hover.x)}
            x2={crisp(p.hover.x)}
            y1={Math.round(p.y(p.data[p.hover.i].value))}
            y2={p.floor}
          />
          <Ring
            className="stroke-ink"
            cx={p.hover.x}
            cy={p.y(p.data[p.hover.i].value)}
            size="md"
            weight="cursor"
          />
        </g>
      )}
    </>
  );
};

const ReplayButton = (props: { onReplay: () => void }) => (
  <Control onClick={props.onReplay} label="Replay the draw">
    <svg width={9} height={10} viewBox="0 0 9 10" aria-hidden>
      <path
        d="M7.5 3.2A3.6 3.6 0 1 0 8 6"
        className="fill-none stroke-current"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
    Replay
  </Control>
);

/** Value at drawn fraction `e` (0–1), interpolated between readings. */
const valueAt = (data: DrawInDatum[], e: number) => {
  const fi = e * (data.length - 1);
  const i0 = Math.floor(fi);
  const i1 = Math.min(data.length - 1, i0 + 1);
  return data[i0].value + (data[i1].value - data[i0].value) * (fi - i0);
};

/**
 * G18 Premier League goals. One cumulative 2px line over a dot-screened area,
 * drawn left to right while the big number counts up in step with the tip of
 * the line. The scale reads at the right, each value on its rule.
 * Plays once when scrolled into view; Replay runs it again. Reduced motion
 * shows the end.
 */
export const DrawIn = (props: DrawInProps) => {
  const data = props.data ?? drawInDemo;
  const format = props.format ?? goalsOf;
  const clip = useSvgId("drawin");
  const box = useRef<HTMLDivElement>(null);
  const clock = useDrawClock(box, props.duration ?? 2200);
  // Under reduced motion there is nothing to replay, so no control slot.
  const height = (props.height ?? 380) - (clock.reduced ? 0 : CONTROL_SLOT_H);
  const [hover, setHover] = useState<Hit | null>(null);
  const [first] = data;
  const last = data.at(-1) ?? first;
  const eased = easeTravel(clock.p);
  const tipValue = valueAt(data, eased);
  const caption =
    hover === null ? props.caption : `to ${fmtDate(data[hover.i].date)}`;
  const label = `Cumulative line from ${format(first.value)} to ${format(last.value)}${props.caption === undefined ? "" : `, ${props.caption}`}`;

  return (
    <div ref={box} className="relative">
      {clock.reduced ? null : (
        <ControlSlot>
          <ReplayButton onReplay={clock.handleReplay} />
        </ControlSlot>
      )}
      <Plot
        overlay={
          hover === null ? null : (
            <Tooltip x={hover.x} y={hover.y}>
              <b>{fmtDate(data[hover.i].date)}</b> ·{" "}
              {format(data[hover.i].value)} to date
            </Tooltip>
          )
        }
      >
        {(width) => {
          const narrow = width < 480;
          // Narrow: the counter sits above the plot; leave caption room only when there is one.
          const counterH = props.caption === undefined ? 48 : 70;
          const m = {
            bottom: 26 + noteSpace(props.note, width - 16, 18),
            left: 4,
            // The scale reads at the right, beside the line's end.
            right: 48,
            top: narrow ? counterH : 52,
          };
          const x = scaleUtc()
            .domain([first.date, last.date])
            .range([m.left, width - m.right]);
          const y = scaleLinear()
            .domain([0, last.value])
            .range([height - m.bottom, m.top]);
          const pts = data.map((d): [number, number] => [
            x(d.date),
            y(d.value),
          ]);
          const xs = pts.map((q) => q[0]);
          const tipX = m.left + (width - m.right - m.left) * eased;
          const handleMove = (e: PointerEvent<SVGSVGElement>) => {
            if (clock.p >= 1) {
              const i = bisectCenter(
                xs,
                e.clientX - e.currentTarget.getBoundingClientRect().left
              );
              setHover({ i, x: xs[i], y: y(data[i].value) - 10 });
            }
          };
          return (
            <svg
              width={width}
              height={height}
              aria-label={label}
              className="touch-pan-y"
              onPointerMove={handleMove}
              onPointerLeave={() => {
                setHover(null);
              }}
            >
              <title>{label}</title>
              <Counter
                caption={caption}
                text={format(hover === null ? tipValue : data[hover.i].value)}
                x={m.left}
              />
              <Curve
                clip={clip}
                floor={height - m.bottom}
                height={height}
                left={m.left}
                pts={pts}
                tipX={tipX}
                width={width}
                y={y}
              />
              <Frame
                data={data}
                floor={height - m.bottom}
                hover={hover}
                left={m.left}
                narrow={narrow}
                width={width}
                x={x}
                y={y}
              />
              {clock.p > 0 && hover === null ? (
                <Dot
                  className="fill-hero"
                  cx={tipX}
                  cy={y(tipValue)}
                  size="md"
                />
              ) : null}
              <PlotNote
                text={props.note}
                width={width - 16}
                x={width / 2}
                y={height - 6}
              />
            </svg>
          );
        }}
      </Plot>
    </div>
  );
};
