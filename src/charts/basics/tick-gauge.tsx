import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { MARK_WEIGHT, RING_STEP } from "../marks";
import { PlotNote } from "../plot-note";
import { DotRing } from "../texture";
import { clamp, stagger } from "../util";
import { tickGaugeDemo } from "./tick-gauge.data";
import type { TickGaugeDatum } from "./tick-gauge.data";
import { polar } from "./util-b";
import type { Tip } from "./util-b";

interface TickGaugeProps {
  /** Line under the big number; receives the ticks still to come. Defaults to the amount to come. */
  caption?: (remaining: number) => string;
  data?: TickGaugeDatum;
  /** Formats the raw value and target for the tooltip. */
  format?: (v: number) => string;
  height?: number;
  note?: string;
  /** Total sweep of the dial in degrees, centred on 12 o'clock. */
  sweep?: number;
  /** How many ticks make the full dial. */
  ticks?: number;
}

type Part = "earned" | "left";

interface Dial {
  a0: number;
  cx: number;
  cy: number;
  earned: number;
  endA: number;
  /** The svg height: the given height, less any slack around a width-bound dial. */
  height: number;
  len: number;
  n: number;
  radius: number;
  step: number;
  sweep: number;
}

const DEG = Math.PI / 180;
const SCALE_STOPS = [0.25, 0.5, 0.75, 1];

/** SVG arc path along radius r between two clockwise-from-noon angles. */
const arcPath = (dial: Dial, r: number, a0: number, a1: number): string => {
  const p0 = polar(dial.cx, dial.cy, r, a0);
  const p1 = polar(dial.cx, dial.cy, r, a1);
  return `M${p0.x},${p0.y}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p1.x},${p1.y}`;
};

const buildDial = (
  width: number,
  height: number,
  sweep: number,
  n: number,
  earned: number,
  hasNote: boolean
): Dial => {
  const top = 16;
  const bottom = hasNote ? 56 : 10;
  // The dial runs from its top (cy − R) down to its two ends (cy − R·cos(sweep/2)).
  const lowFrac = Math.max(-Math.cos(sweep / 2), 0.2);
  const radius = Math.min(
    width / 2 - 28,
    Math.max(150, width * 0.27),
    (height - top - bottom - 8) / (1 + lowFrac)
  );
  const a0 = -sweep / 2;
  const step = sweep / (n - 1);
  const fitted = Math.min(
    height,
    Math.ceil(top + bottom + 8 + radius * (1 + lowFrac))
  );
  return {
    a0,
    cx: width / 2,
    // Centre the dial in the space above the note.
    cy: top + (fitted - top - bottom - radius * (1 + lowFrac)) / 2 + radius,
    earned,
    endA: a0 + Math.max(0, earned - 1) * step + step * 0.9,
    height: fitted,
    len: clamp(radius * 0.19, 14, 34),
    n,
    radius,
    step,
    sweep,
  };
};

/**
 * Three tones only: every earned tick one mid grey, the rest pale, and the
 * one tick at the current value in ink.
 */
const tickTone = (i: number, dial: Dial) => {
  if (i === dial.earned - 1) {
    return "stroke-hero";
  }
  return i < dial.earned ? "stroke-l3" : "stroke-l6";
};

/** How far the dotted guide ring sits inside the tick ring. */
const GUIDE_INSET = 6;

const Ticks = (props: { dial: Dial }) => {
  const { dial } = props;
  const R = dial.radius;
  const ticks = Array.from({ length: dial.n }, (_, i) => {
    const a = dial.a0 + i * dial.step;
    return {
      i,
      id: `tick-${i}`,
      inner: polar(dial.cx, dial.cy, R - dial.len, a),
      on: i < dial.earned,
      outer: polar(dial.cx, dial.cy, R, a),
    };
  });
  return (
    <g>
      {ticks.map((t) => (
        <line
          className={`fade ${tickTone(t.i, dial)}`}
          key={t.id}
          strokeWidth={MARK_WEIGHT}
          style={stagger(t.i, "dense")}
          x1={t.inner.x}
          x2={t.outer.x}
          y1={t.inner.y}
          y2={t.outer.y}
        />
      ))}
    </g>
  );
};

const Scale = (props: { dial: Dial }) => {
  const { dial } = props;
  return (
    <g className="fade" style={stagger(12)}>
      {SCALE_STOPS.map((s) => {
        const a = dial.a0 + s * dial.sweep;
        const label = polar(dial.cx, dial.cy, dial.radius - dial.len - 20, a);
        const end = polar(dial.cx, dial.cy, dial.radius - dial.len - 14, a);
        const last = s === 1;
        return (
          <text
            className="t-axis"
            dy="0.34em"
            key={s}
            textAnchor={last ? "end" : "middle"}
            x={last ? end.x - 4 : label.x}
            y={last ? end.y : label.y}
          >
            {Math.round(s * dial.n)}
          </text>
        );
      })}
    </g>
  );
};

const Centre = (props: { caption: string; dial: Dial; pct: number }) => {
  const { dial } = props;
  const baseline = dial.cy + 6;
  return (
    <g>
      <text
        className="fade t-value-lg"
        textAnchor="middle"
        x={dial.cx}
        y={baseline}
      >
        {props.pct}%
      </text>
      <text
        className="fade t-axis"
        textAnchor="middle"
        x={dial.cx}
        y={baseline + 20}
      >
        {props.caption}
      </text>
    </g>
  );
};

/** Invisible bands over the earned arc and the remainder, for the tooltip. */
const HitBands = (props: { dial: Dial; onHover: (tip: Tip<Part>) => void }) => {
  const { dial } = props;
  const mid = dial.radius - dial.len / 2;
  const end = dial.a0 + dial.sweep + dial.step / 2;
  const bands = [
    {
      a0: dial.a0 - dial.step / 2,
      a1: dial.endA,
      part: "earned" as const,
      show: dial.earned > 0,
    },
    {
      a0: dial.endA,
      a1: end,
      part: "left" as const,
      show: dial.earned < dial.n,
    },
  ];
  return (
    <g>
      {bands
        .filter((b) => b.show)
        .map((b) => (
          <path
            className="fill-none stroke-transparent"
            d={arcPath(dial, mid, b.a0, b.a1)}
            key={b.part}
            onPointerEnter={() => {
              const p = polar(
                dial.cx,
                dial.cy,
                dial.radius + 6,
                (b.a0 + b.a1) / 2
              );
              props.onHover({ item: b.part, x: p.x, y: p.y });
            }}
            strokeWidth={dial.len + 12}
          />
        ))}
    </g>
  );
};

/**
 * F11 Progress dial. Progress toward a target as a dial of 2px rungs, one per
 * percent: earned rungs in one mid grey, the rung at the current value in
 * ink, the rest pale, inside an evenly dotted arc.
 * The big number says it plainly.
 */
export const TickGauge = (props: TickGaugeProps) => {
  const data = props.data ?? tickGaugeDemo;
  const height = props.height ?? 350;
  const format = props.format ?? String;
  const n = props.ticks ?? 100;
  const sweep = (props.sweep ?? 240) * DEG;
  const share = clamp(data.value / data.target, 0, 1);
  const earned = Math.round(share * n);
  const caption =
    props.caption?.(n - earned) ??
    `${format(Math.max(0, data.target - data.value))} to come`;
  const pct = Math.round(share * 100);
  const label = `${pct}% of target: ${format(data.value)} of ${format(data.target)}`;
  const [tip, setTip] = useState<Tip<Part> | null>(null);

  const tooltip =
    tip?.item === "earned" ? (
      <>
        <b>Fallen</b> · {format(data.value)} of {format(data.target)}
      </>
    ) : (
      <>
        <b>To come</b> · {format(Math.max(0, data.target - data.value))}
      </>
    );

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            {tooltip}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const dial = buildDial(
          width,
          height,
          sweep,
          n,
          earned,
          props.note !== undefined
        );
        return (
          <svg
            aria-label={label}
            height={dial.height}
            onPointerLeave={() => {
              setTip(null);
            }}
            width={width}
          >
            <title>{label}</title>
            <Ticks dial={dial} />
            <DotRing
              className="fade"
              tone="fill-l4"
              cx={dial.cx}
              cy={dial.cy}
              from={dial.a0}
              r={dial.radius - dial.len - GUIDE_INSET}
              step={RING_STEP.guide}
              to={dial.a0 + dial.sweep}
            />
            <Scale dial={dial} />
            <Centre caption={caption} dial={dial} pct={pct} />
            <HitBands dial={dial} onHover={setTip} />
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={dial.height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
