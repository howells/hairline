import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { TICK } from "../marks";
import { FootNote } from "../plot-note";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { noteSpace, sansWidth, stagger } from "../util";
import { ballotTallyDemo } from "./ballot-tally.data";
import type { TallyDatum } from "./ballot-tally.data";
import { argMax } from "./util-b";

interface BallotTallyProps {
  data?: TallyDatum[];
  /** The whole sample, for the tooltip: "44 of 100 went". */
  total?: number;
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Index of the row drawn in the hero colour. Defaults to the largest. */
  highlight?: number;
}

/** One row's geometry, all in whole pixels. */
interface RulerLayout {
  /** Baseline: the ticks stand on this pixel row. */
  base: number;
  /** Whole-pixel step between ticks. */
  pitch: number;
  /** Height of a tick for someone who went. */
  tall: number;
  /** Left edge of the first tick. */
  x0: number;
}

interface RowProps {
  format: (v: number) => string;
  hero: boolean;
  index: number;
  layout: RulerLayout;
  /** Hover band, as tall as the row. */
  band: { h: number; w: number; x: number; y: number };
  row: TallyDatum;
  /** Ticks in the ruler, the scale every row shares. */
  ruler: number;
}

/** Ruler tick heights in px: every tick, every fifth, every tenth. */
const RULER = { five: TICK.md, one: TICK.sm, ten: TICK.lg } as const;

/**
 * Ruler length: the next ten above the largest value, so the tens keep
 * their cadence and even the longest run leaves a little ruler showing.
 */
const rulerLength = (data: TallyDatum[], total: number) =>
  Math.min(
    total,
    (Math.floor(Math.max(0, ...data.map((d) => d.value)) / 10) + 1) * 10
  );

/** Height of the k-th short tick: a ruler, longer every 5 and every 10. */
const rulerTick = (k: number) => {
  if ((k + 1) % 10 === 0) {
    return RULER.ten;
  }
  return (k + 1) % 5 === 0 ? RULER.five : RULER.one;
};

/** One answer: a ruler with the share who went standing tall. */
const RulerRow = ({
  band,
  format,
  hero,
  index,
  layout,
  row,
  ruler,
}: RowProps) => {
  const { base, pitch, tall, x0 } = layout;
  const n = Math.round(row.value);
  const tone = hero ? "fill-hero" : "fill-l2";
  const end = x0 + pitch * (n - 1) + 1;
  return (
    <>
      <HitRect height={band.h} width={band.w} x={band.x} y={band.y} />
      <Label
        muted={!hero}
        order={index}
        tier="series"
        voice="label"
        x={x0}
        y={base - tall - 12}
      >
        {row.label}
      </Label>
      <g className="fade fill-l5" style={stagger(index, "series")}>
        {Array.from({ length: Math.max(0, ruler - n) }, (_, j) => {
          const k = n + j;
          const h = rulerTick(k);
          return (
            <rect
              height={h}
              key={`rule-${row.label}-${k}`}
              width={1}
              x={x0 + pitch * k}
              y={base - h}
            />
          );
        })}
      </g>
      <g className={tone}>
        {Array.from({ length: n }, (_, k) => {
          // Tall ticks keep the ruler's cadence: the tens stand tallest.
          const h = tall - RULER.ten + rulerTick(k);
          return (
            <rect
              className="grow-y"
              height={h}
              key={`tall-${row.label}-${k}`}
              style={stagger(index * 12 + k, "dense")}
              width={1}
              x={x0 + pitch * k}
              y={base - h}
            />
          );
        })}
      </g>
      <Label
        order={index + 3}
        tier="series"
        voice="value"
        x={end + 6}
        y={base - tall + 9}
      >
        {format(row.value)}
      </Label>
    </>
  );
};

/**
 * L15 Days out. Multi-select answers as rulers: every person who went is
 * one tall 1px tick at one whole-pixel pitch, standing on a faint shared
 * ruler (longer every ten) that runs to the next ten above the largest
 * value, so the rows compare at the widest scale. Rows are independent.
 */
export const BallotTally = (props: BallotTallyProps) => {
  const data = props.data ?? ballotTallyDemo;
  const total = props.total ?? 100;
  const format = props.format ?? String;
  const height = props.height ?? 460;
  const hover = useHover<number>();
  const hero = props.highlight ?? argMax(data.map((d) => d.value));
  const ruler = rulerLength(data, total);

  return (
    <Plot>
      {(width) => {
        const noteH = noteSpace(props.note, width - 16, 24);
        // Whole-pixel pitch, the widest that fits the ruler and the value
        // after its longest run; that block is centred.
        const valueW = data.map((d) => sansWidth(format(d.value), 11));
        const blockAt = (p: number) =>
          Math.max(
            p * (ruler - 1) + 1,
            ...data.map(
              (d, i) => p * (Math.round(d.value) - 1) + 7 + (valueW[i] ?? 0)
            )
          );
        let pitch = Math.max(2, Math.floor((width - 1) / (ruler - 1)));
        while (pitch > 2 && blockAt(pitch) > width) {
          pitch -= 1;
        }
        const x0 = Math.round((width - blockAt(pitch)) / 2);
        const rowH = (height - noteH - 8) / Math.max(1, data.length);
        const tall = Math.round(Math.min(44, rowH * 0.42));
        const layoutAt = (i: number): RulerLayout => ({
          base: Math.round(rowH * (i + 1) - rowH * 0.22),
          pitch,
          tall,
          x0,
        });
        const tip = hover.key === null ? undefined : data[hover.key];
        return (
          <div className="relative">
            <ChartSvg
              height={height}
              label={data
                .map((d) => `${d.label}: ${format(d.value)} of ${total}`)
                .join(", ")}
              leave={hover.clear}
              title="Days out"
              width={width}
            >
              {data.map((d, i) => (
                <DimGroup
                  dim={hover.dim(i)}
                  key={d.label}
                  onPointerEnter={() => {
                    hover.show(i);
                  }}
                >
                  <RulerRow
                    band={{ h: rowH, w: width, x: 0, y: rowH * i }}
                    format={format}
                    hero={hero === i}
                    index={i}
                    layout={layoutAt(i)}
                    row={d}
                    ruler={ruler}
                  />
                </DimGroup>
              ))}
              <FootNote height={height} text={props.note} width={width} />
            </ChartSvg>
            {tip !== undefined && hover.key !== null && (
              <Tooltip
                x={x0 + pitch * Math.round(tip.value) * 0.5}
                // Over the row's label, so the label stays readable.
                y={layoutAt(hover.key).base - tall - 24}
              >
                <TipText
                  facts={[`${format(tip.value)} of ${total} went`]}
                  lead={tip.label}
                />
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
