import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { useMemo, useRef } from "react";
import type { PointerEvent, RefObject } from "react";

import { Control } from "../control";
import { Plot, Tooltip } from "../core";
import { useHover, useSvgId } from "../hooks";
import { TipText } from "../hover";
import { Dot, Ring } from "../markers";
import { usePlayhead } from "../playback";
import { FootNote } from "../plot-note";
import { HRule, VRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Stipple } from "../texture";
import { paint } from "../texture-ids";
import { noteSpace } from "../util";
import { ValueGrid } from "../value-grid";
import { ControlSlot } from "./control-slot";
import { dynamicStreamDemo } from "./dynamic-stream.data";
import type { StreamFeed } from "./dynamic-stream.data";
import { CONTROL_SLOT_H } from "./util-b";

interface DynamicStreamProps {
  /** Value for step n (n ≥ 0). Must be deterministic. */
  feed?: StreamFeed;
  /** Values visible at once. */
  window?: number;
  /** Milliseconds between values. */
  interval?: number;
  /** Fixed value domain; defaults to the range of the first 400 values. */
  domain?: [number, number];
  height?: number;
  format?: (v: number) => string;
  note?: string;
}

const whole = (v: number) => `${Math.round(v)}`;

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
 * Clock in ms. Runs while revealed, on screen and not paused. Under
 * reduced motion it starts paused, and when played it steps a whole value
 * every three intervals without scrolling.
 */
const useStreamClock = (
  box: RefObject<HTMLDivElement | null>,
  interval: number
) => {
  const clock = usePlayhead({
    box,
    end: Number.POSITIVE_INFINITY,
    rate: 1,
    reduced: "step",
    step: { every: interval * 3, unit: interval },
  });
  return {
    elapsed: clock.t,
    handleToggle: clock.handleToggle,
    playing: clock.playing,
    reduced: clock.reduced,
  };
};

/** Solid while running, hollow while paused. */
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
 * the head: its dot on the plot's edge and its value beside it. The scale
 * reads at the right, each value on its rule, next to the latest data.
 */
const StreamLayer = (p: LayerProps) => (
  <>
    <defs>
      <Stipple id={`${p.clip}-dots`} tone="fill-l4" />
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
    <HRule x0={p.left} x1={p.width} y={p.floor} />
    <Dot className="fill-hero" cx={p.right} cy={p.headY} size="md" />
    <Label dy="0.35em" halo voice="value" x={p.right + 9} y={p.headY}>
      {p.format(p.latest)}
    </Label>
  </>
);

/**
 * G17 Rolling swell. A line that keeps moving: a new value arrives every
 * `interval` ms and the window scrolls left to make room. The latest value is
 * printed beside the head, and the scale reads at the right, each value on its
 * rule. Runs only while on screen; the Running control pauses and resumes.
 */
export const DynamicStream = (props: DynamicStreamProps) => {
  const feed = props.feed ?? dynamicStreamDemo;
  const win = props.window ?? 50;
  const interval = props.interval ?? 300;
  // The plot's share of the height, under the control slot.
  const height = (props.height ?? 320) - CONTROL_SLOT_H;
  const format = props.format ?? whole;
  const clip = useSvgId("stream");
  const box = useRef<HTMLDivElement>(null);
  const clock = useStreamClock(box, interval);
  const hover = useHover<number>();
  const auto = useMemo(() => domainOf(feed), [feed]);
  const [lo, hi] = props.domain ?? auto;
  const head = win + Math.floor(clock.elapsed / interval);
  const frac = clock.reduced ? 0 : (clock.elapsed % interval) / interval;
  // One extra value past each edge so the scroll never shows a gap.
  const steps = Array.from({ length: win + 2 }, (_, k) => head - win + k);
  // The newest value still sliding in sits past the edge; the edge shows the one before it.
  const latest = feed(head - 1);
  const label = `Rolling line, latest value ${format(latest)}, last ${win} values`;

  return (
    <div ref={box} className="relative">
      <ControlSlot>
        <Control
          onClick={clock.handleToggle}
          label={clock.playing ? "Pause the swell" : "Resume the swell"}
        >
          <LiveDot playing={clock.playing} />
          {clock.playing ? "Running" : "Paused"}
        </Control>
      </ControlSlot>
      <Plot
        overlay={
          hover.at === null ? null : (
            <Tooltip x={hover.at.x} y={hover.at.y}>
              <TipText
                facts={[format(feed(hover.at.key))]}
                lead={`${(((head - 1 - hover.at.key) * interval) / 1000).toFixed(1)}s ago`}
              />
            </Tooltip>
          )
        }
      >
        {(width) => {
          const m = {
            bottom: 12 + noteSpace(props.note, width - 16, 18),
            left: 4,
            // The gutter holds the head value, then the scale flush right.
            right: 64,
            top: 14,
          };
          const right = width - m.right;
          const dx = (right - m.left) / (win - 1);
          // The newest value sits one step past the right edge and slides in.
          const xOf = (s: number) => right - (head - s - 1 + frac) * dx;
          const y = scaleLinear()
            .domain([lo, hi])
            .nice()
            .range([height - m.bottom, m.top]);
          const handleMove = (e: PointerEvent<SVGSVGElement>) => {
            const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
            const s = Math.round(head - 1 + frac - (right - px) / dx);
            const k = Math.max(head - win + 1, Math.min(head - 1, s));
            hover.show(k, xOf(k), y(feed(k)) - 10);
          };
          return (
            <ChartSvg
              className="touch-pan-y"
              height={height}
              label={label}
              leave={hover.clear}
              onPointerMove={handleMove}
              width={width}
            >
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
              {hover.key === null ? null : (
                <g pointerEvents="none">
                  <VRule
                    kind="cursor"
                    x={xOf(hover.key)}
                    y0={m.top - 6}
                    y1={height - m.bottom}
                  />
                  <Ring
                    className="stroke-ink"
                    cx={xOf(hover.key)}
                    cy={y(feed(hover.key))}
                    size="md"
                    weight="cursor"
                  />
                </g>
              )}
              <FootNote height={height} text={props.note} width={width} />
            </ChartSvg>
          );
        }}
      </Plot>
    </div>
  );
};
