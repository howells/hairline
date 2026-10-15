import { useState } from "react";

import { fmtInt } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { TEXTURE_PITCH } from "../texture-ids";
import { dimClass, noteSpace, sansWidth, stagger } from "../util";
import { hourglassDemo } from "./hourglass-stream.data";
import type { StageDatum } from "./hourglass-stream.data";
import { vCurve } from "./util-b";

interface HourglassStreamProps {
  data?: StageDatum[];
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Index of the stage drawn in the hero colour. Defaults to the last. */
  highlight?: number;
}

interface Bar {
  id: string;
  x: number;
}

interface Strip {
  x0: number;
  w: number;
  bars: Bar[];
}

interface Thread {
  id: string;
  step: number;
  k: number;
  d: string;
}

/** Distance between neighbouring bars in every strip: the hatch pitch. */
const PITCH = TEXTURE_PITCH.hatch;

/**
 * A stage's barcode: one 1px bar per handful of payments, all strips on the
 * same even pitch and centred on one axis, so widths compare directly.
 */
const stripFor = (
  d: StageDatum,
  max: number,
  cx: number,
  maxBars: number
): Strip => {
  const n = Math.max(3, Math.round((d.value / max) * maxBars));
  const w = n * PITCH;
  const x0 = Math.round(cx - w / 2);
  const bars = Array.from({ length: n }, (_, k) => ({
    id: `${d.label}-${k}`,
    x: crisp(x0 + PITCH * k + PITCH / 2),
  }));
  return { bars, w, x0 };
};

/**
 * Threads carry payments from each strip down to the next: one from every
 * other bar of the lower strip, rising from the evenly matching bar above,
 * so each step is a smooth, ordered fan rather than a tangle.
 */
const threadsFor = (
  strips: Strip[],
  yOf: (i: number) => number,
  h: number
): Thread[] =>
  strips.slice(1).flatMap((dn, j) => {
    const up = strips[j];
    const picks = dn.bars.filter((_, k) => k % 2 === 0);
    return picks.map((bar, k) => {
      const share = (bar.x - dn.x0) / dn.w;
      const at = Math.min(
        up.bars.length - 1,
        Math.floor(share * up.bars.length)
      );
      const xa = up.bars[at]?.x ?? up.x0;
      return {
        d: vCurve(xa, yOf(j) + h / 2, bar.x, yOf(j + 1) - h / 2, 0.55),
        id: `thread-${j}-${k}`,
        k,
        step: j,
      };
    });
  });

interface StageProps {
  stage: StageDatum;
  strip: Strip;
  index: number;
  y: number;
  h: number;
  labelX: number;
  hero: boolean;
  format: (v: number) => string;
}

const StageRow = ({
  stage,
  strip,
  index,
  y,
  h,
  labelX,
  hero,
  format,
}: StageProps) => (
  <>
    <rect
      x={strip.x0 - 6}
      y={y - h / 2 - 6}
      width={labelX + 100 - strip.x0}
      height={h + 12}
      fill="transparent"
    />
    {strip.bars.map((b, k) => (
      <line
        key={b.id}
        className={`grow-y shape-crisp ${hero ? "stroke-hero" : "stroke-l3"}`}
        style={stagger(index * 6 + k * 0.08, "mark")}
        x1={b.x}
        x2={b.x}
        y1={Math.round(y + h / 2)}
        y2={Math.round(y - h / 2)}
        strokeWidth={1}
      />
    ))}
    {labelX - 10 - (strip.x0 + strip.w + 14) < 16 ? null : (
      // The leader to the label, dropped when it would be only a stub.
      <line
        className="fade rule"
        style={stagger(index, "series")}
        x1={strip.x0 + strip.w + 14}
        x2={labelX - 10}
        y1={crisp(y)}
        y2={crisp(y)}
      />
    )}
    <text
      className="fade t-label"
      style={stagger(index, "series")}
      x={labelX}
      y={y - 4}
    >
      {stage.label}
    </text>
    <text
      className="fade t-value"
      style={stagger(index, "series")}
      x={labelX}
      y={y + 13}
    >
      {format(stage.value)}
    </text>
  </>
);

interface StepProps {
  data: StageDatum[];
  left: number;
  strips: Strip[];
  yOf: (i: number) => number;
}

/**
 * The share that gets through each step, level with the step's fan, and a
 * leader from it to the fan's outermost thread (which crosses the step's
 * middle halfway between the two strips' first bars), mirroring the stage
 * leaders on the right.
 */
const StepShares = ({ data, left, strips, yOf }: StepProps) => (
  <g>
    {data.slice(1).map((d, j) => {
      const prev = data[j]?.value ?? 1;
      const y = (yOf(j) + yOf(j + 1)) / 2;
      const share = `${Math.round((d.value / prev) * 100)}%`;
      const from = left + sansWidth(share, 11) + 10;
      const fan =
        ((strips[j]?.bars[0]?.x ?? 0) + (strips[j + 1]?.bars[0]?.x ?? 0)) / 2;
      return (
        <g
          key={`share-${d.label}`}
          className="fade"
          style={stagger(j + 3, "series")}
        >
          <text className="t-value" dy="0.34em" x={left} y={y}>
            {share}
          </text>
          {fan - 10 - from < 16 ? null : (
            <line
              className="rule"
              x1={Math.round(from)}
              x2={Math.round(fan - 10)}
              y1={crisp(y)}
              y2={crisp(y)}
            />
          )}
        </g>
      );
    })}
  </g>
);

/**
 * L13 Library earnings. A funnel poured top to bottom: each stage is a
 * barcode strip of evenly pitched bars whose width is the count at that
 * stage, ordered fans of hairline threads pour from one strip to the next,
 * and the share that gets through each step sits in the left margin, its
 * leader running into that step's fan.
 */
export const HourglassStream = (props: HourglassStreamProps) => {
  const data = props.data ?? hourglassDemo;
  const height = props.height ?? 470;
  const format = props.format ?? fmtInt;
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value));

  return (
    <Plot>
      {(width) => {
        const narrow = width < 460;
        const blockW = Math.min(width, 640);
        const left = (width - blockW) / 2;
        // The stage names and figures end at the block's edge.
        const labelW = Math.max(
          ...data.flatMap((d) => [
            sansWidth(d.label, 11),
            sansWidth(format(d.value), 11),
          ])
        );
        const labelX = left + blockW - labelW;
        const a0 = left + (narrow ? 60 : 96);
        const a1 = labelX - (narrow ? 16 : 30);
        const cx = (a0 + a1) / 2;
        const noteW = width - 16 - 2 * Math.abs(cx - width / 2);
        const h = narrow ? 20 : 28;
        const top = h / 2 + 4;
        const pitch =
          data.length > 1
            ? (height - top - h / 2 - 12 - noteSpace(props.note, noteW, 24)) /
              (data.length - 1)
            : 0;
        const yOf = (i: number) => top + pitch * i;
        const strips = data.map((d) =>
          stripFor(d, max, cx, Math.floor((a1 - a0) / PITCH))
        );
        const tip = hover === null ? undefined : data[hover];
        const [first] = data;
        return (
          <div className="relative">
            <svg
              width={width}
              height={height}
              aria-label={`Payments by size: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`}
              onPointerLeave={() => {
                setHover(null);
              }}
            >
              <title>Library earnings</title>
              <g className="stroke-l5 fill-none">
                {threadsFor(strips, yOf, h).map((t) => (
                  <path
                    key={t.id}
                    className={`draw ${dimClass(
                      hover !== null && hover !== t.step && hover !== t.step + 1
                    )}`}
                    pathLength={1}
                    style={stagger(t.step * 10 + (t.k % 10), "fine")}
                    d={t.d}
                    strokeWidth={1}
                  />
                ))}
              </g>
              <StepShares data={data} left={left} strips={strips} yOf={yOf} />
              {data.map((d, i) => (
                <g
                  key={d.label}
                  className={dimClass(hover !== null && hover !== i)}
                  onPointerEnter={() => {
                    setHover(i);
                  }}
                >
                  <StageRow
                    stage={d}
                    strip={strips[i]}
                    index={i}
                    y={yOf(i)}
                    h={h}
                    labelX={labelX}
                    hero={(props.highlight ?? data.length - 1) === i}
                    format={format}
                  />
                </g>
              ))}
              <PlotNote text={props.note} width={noteW} x={cx} y={height - 6} />
            </svg>
            {tip !== undefined && hover !== null && first !== undefined && (
              <Tooltip x={cx} y={yOf(hover) - h / 2 - 4}>
                <b>{tip.label}</b> · {format(tip.value)}
                {hover > 0 &&
                  ` · ${Math.round((tip.value / first.value) * 100)}% of ${first.label.toLowerCase()}`}
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
