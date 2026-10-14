import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";

import { crisp } from "../axes";
import { Control } from "../control";
import { Plot, Tooltip } from "../core";
import { useReducedMotion, useReveal, useSvgId } from "../hooks";
import { PlotNote } from "../plot-note";
import { Stipple } from "../texture";
import { paint } from "../texture-ids";
import { noteSpace } from "../util";
import { ValueGrid } from "../value-grid";
import { ControlSlot } from "./control-slot";
import { dynamicStreamDemo } from "./dynamic-stream.data";
import type { StreamFeed } from "./dynamic-stream.data";
import { CONTROL_SLOT_H, useInView } from "./util-b";

interface DynamicStreamProps {
  /** Reading for step n (n ≥ 0). Must be deterministic. */
  feed?: StreamFeed;
  /** Readings visible at once. */
  window?: number;
  /** Milliseconds between readings. */
  interval?: number;
  /** Fixed value domain; defaults to the range of the first 400 readings. */
  domain?: [number, number];
  height?: number;
  format?: (v: number) => string;
  note?: string;
}

interface Hit {
  s: number;
  x: number;
  y: number;
}

const thousands = (v: number) => `${Math.round(v)}k`;

const domainOf = (feed: StreamFeed): [number, number] => {
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (let s = 0; s < 400; s += 1) {
    const v = feed(s);
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  const pad = (hi - lo) * 0.1;
  return [lo - pad, hi + pad];
};

/**
 * Stream clock in ms. Runs while revealed, on screen and not paused. Under
 * reduced motion it starts paused, and when played it steps a whole reading
 * at a time without scrolling.
 */
const useStreamClock = (
  box: RefObject<HTMLDivElement | null>,
  interval: number
) => {
  const revealed = useReveal(box);
  const inView = useInView(box);
  const reduced = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const running = playing && revealed && inView;

  useEffect(() => {
    let raf = 0;
    let timer = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      // Cap the step so a backgrounded tab doesn't jump on return.
      const dt = Math.min(64, now - prev);
      prev = now;
      setElapsed((e) => e + dt);
      raf = requestAnimationFrame(tick);
    };
    if (running && reduced) {
      timer = window.setInterval(() => {
        setElapsed((e) => (Math.floor(e / interval) + 1) * interval);
      }, interval * 3);
    } else if (running) {
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
    };
  }, [running, reduced, interval]);

  const handleToggle = () => {
    setPlaying((p) => !p);
  };
  return { elapsed, handleToggle, playing, reduced };
};

/** Solid while live, hollow while paused. */
const LiveDot = (props: { playing: boolean }) => (
  <svg width={8} height={8} viewBox="0 0 8 8" aria-hidden>
    <circle
      cx={4}
      cy={4}
      r={3}
      className={`stroke-current ${props.playing ? "fill-current" : "fill-none"}`}
      strokeWidth={1}
    />
  </svg>
);

interface LayerProps {
  clip: string;
  floor: number;
  format: (v: number) => string;
  headY: number;
  latest: number;
  left: number;
  pts: [number, number][];
  right: number;
  /** The svg's width: the scale's values end here. */
  width: number;
  y: ScaleLinear<number, number>;
}

/**
 * The stippled area and its line over a solid value grid, the baseline, and
 * the head: its dot on the plot's edge and its reading beside it. The scale
 * reads at the right, each value on its rule, next to the latest data.
 */
const StreamLayer = (p: LayerProps) => (
  <>
    <defs>
      <Stipple ground="fill-paper" id={`${p.clip}-dots`} tone="fill-l4" />
      <clipPath id={p.clip}>
        <rect x={p.left} y={0} width={p.right - p.left} height={p.floor + 20} />
      </clipPath>
    </defs>
    <path
      clipPath={`url(#${p.clip})`}
      d={area().curve(curveMonotoneX).y0(p.floor)(p.pts) ?? ""}
      fill={paint(`${p.clip}-dots`)}
    />
    <ValueGrid
      floor={p.floor}
      ticks={p.y.ticks(4)}
      format={p.format}
      side="right"
      x0={p.left}
      x1={p.width}
      y={p.y}
    />
    <path
      clipPath={`url(#${p.clip})`}
      d={line().curve(curveMonotoneX)(p.pts) ?? ""}
      className="stroke-ink fill-none"
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <line
      className="hairline"
      x1={p.left}
      x2={p.width}
      y1={crisp(p.floor)}
      y2={crisp(p.floor)}
    />
    <circle className="fill-ink" cx={p.right} cy={p.headY} r={4.5} />
    <text className="t-value t-halo" x={p.right + 9} y={p.headY} dy="0.35em">
      {p.format(p.latest)}
    </text>
  </>
);

/**
 * G17 Live users. A live series: a new reading arrives every `interval`
 * ms and the window scrolls left to make room. The latest reading is printed
 * beside the head, and the scale reads at the right, each value on its rule. Runs only while
 * on screen; the Live control pauses and resumes.
 */
export const DynamicStream = (props: DynamicStreamProps) => {
  const feed = props.feed ?? dynamicStreamDemo;
  const win = props.window ?? 50;
  const interval = props.interval ?? 300;
  // The plot's share of the height, under the control slot.
  const height = (props.height ?? 320) - CONTROL_SLOT_H;
  const format = props.format ?? thousands;
  const clip = useSvgId("stream");
  const box = useRef<HTMLDivElement>(null);
  const clock = useStreamClock(box, interval);
  const [hover, setHover] = useState<Hit | null>(null);
  const auto = useMemo(() => domainOf(feed), [feed]);
  const [lo, hi] = props.domain ?? auto;
  const head = win + Math.floor(clock.elapsed / interval);
  const frac = clock.reduced ? 0 : (clock.elapsed % interval) / interval;
  // One extra reading past each edge so the scroll never shows a gap.
  const steps = Array.from({ length: win + 2 }, (_, k) => head - win + k);
  // The newest reading still sliding in sits past the edge; the edge shows the one before it.
  const latest = feed(head - 1);
  const label = `Live series, latest reading ${format(latest)}, window of ${win} readings`;

  return (
    <div ref={box} className="relative">
      <ControlSlot>
        <Control
          onClick={clock.handleToggle}
          label={clock.playing ? "Pause the live feed" : "Resume the live feed"}
        >
          <LiveDot playing={clock.playing} />
          {clock.playing ? "Live" : "Paused"}
        </Control>
      </ControlSlot>
      <Plot
        overlay={
          hover === null ? null : (
            <Tooltip x={hover.x} y={hover.y}>
              <b>
                {(((head - 1 - hover.s) * interval) / 1000).toFixed(1)}s ago
              </b>{" "}
              · {format(feed(hover.s))}
            </Tooltip>
          )
        }
      >
        {(width) => {
          const m = {
            bottom: 12 + noteSpace(props.note, width - 16, 18),
            left: 4,
            // The gutter holds the head reading, then the scale flush right.
            right: 64,
            top: 14,
          };
          const right = width - m.right;
          const dx = (right - m.left) / (win - 1);
          // The newest reading sits one step past the right edge and slides in.
          const xOf = (s: number) => right - (head - s - 1 + frac) * dx;
          const y = scaleLinear()
            .domain([lo, hi])
            .nice()
            .range([height - m.bottom, m.top]);
          const handleMove = (e: PointerEvent<SVGSVGElement>) => {
            const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
            const s = Math.round(head - 1 + frac - (right - px) / dx);
            const k = Math.max(head - win + 1, Math.min(head - 1, s));
            setHover({ s: k, x: xOf(k), y: y(feed(k)) - 10 });
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
              <StreamLayer
                clip={clip}
                floor={height - m.bottom}
                format={format}
                headY={y(latest) + (y(feed(head)) - y(latest)) * frac}
                latest={latest}
                left={m.left}
                pts={steps.map((s): [number, number] => [xOf(s), y(feed(s))])}
                right={right}
                width={width}
                y={y}
              />
              {hover === null ? null : (
                <g pointerEvents="none">
                  <line
                    className="stroke-faint shape-crisp"
                    x1={crisp(xOf(hover.s))}
                    x2={crisp(xOf(hover.s))}
                    y1={m.top - 6}
                    y2={height - m.bottom}
                  />
                  <circle
                    className="fill-paper stroke-ink"
                    cx={xOf(hover.s)}
                    cy={y(feed(hover.s))}
                    r={4.5}
                    strokeWidth={2}
                  />
                </g>
              )}
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
