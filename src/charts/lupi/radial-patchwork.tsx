import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { HitPath, TipText } from "../hover";
import { TICK } from "../marks";
import { FootNote } from "../plot-note";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { CrossHatch, Hatch, PixelLine } from "../texture";
import { paint, TEXTURE_PITCH, useTextureIds } from "../texture-ids";
import { clamp, noteSpace, stagger } from "../util";
import { radialPatchworkDemo } from "./radial-patchwork.data";
import type { PatchworkEvent } from "./radial-patchwork.data";
import { clock, sectorPath } from "./util-a";

interface RadialPatchworkProps {
  data?: PatchworkEvent[];
  height?: number;
  /** What a flagged (crosshatched) wedge means, e.g. "class M or stronger". */
  outlined?: string;
  note?: string;
}

interface Dial {
  cx: number;
  cy: number;
  r0: number;
  R: number;
}

/** Hatch pitch for one, two, and three or more overlapping wedges. */
const DENSITY = [
  TEXTURE_PITCH.cross,
  TEXTURE_PITCH.hatch,
  TEXTURE_PITCH.dense,
] as const;

const hhmm = (hour: number) => {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** One rim tick per hour, drawn on whole pixels; every sixth is labelled. */
const DialFace = (props: { dial: Dial }) => {
  const { cx, cy, R } = props.dial;
  const ticks = Array.from({ length: 24 }, (_, k) => k);
  return (
    <g className="fade">
      {ticks.map((k) => {
        const deg = k * 15;
        const major = k % 6 === 0;
        const [x0, y0] = clock(
          cx,
          cy,
          R + 18 - (major ? TICK.lg : TICK.sm),
          deg
        );
        const [x1, y1] = clock(cx, cy, R + 18, deg);
        return (
          <PixelLine
            key={`tick-${deg}`}
            tone={major ? "fill-l3" : "fill-l5"}
            x0={x0}
            x1={x1}
            y0={y0}
            y1={y1}
          />
        );
      })}
      {[0, 6, 12, 18].map((h) => {
        const [x, y] = clock(cx, cy, R + 32, h * 15);
        return (
          <Label
            anchor="middle"
            key={`hour-${h}`}
            middle
            voice="axis"
            x={x}
            y={y}
          >
            {h}:00
          </Label>
        );
      })}
    </g>
  );
};

interface Span {
  a0: number;
  a1: number;
  reach: number;
}

/** A wedge's clock angles (degrees) and reach. */
const spanOf = (dial: Dial, event: PatchworkEvent, maxSize: number): Span => {
  const a0 = event.hour * 15;
  return {
    a0,
    a1: a0 + Math.max(4, event.minutes / 4),
    reach: dial.r0 + ((dial.R - dial.r0) * event.size) / maxSize,
  };
};

/** One angular slice and how far its first, second and third wedge reach. */
interface Slice {
  e: number;
  reaches: number[];
  s: number;
}

/** Cut the dial at every wedge edge; inside a slice the overlap is constant. */
const slicesOf = (spans: Span[]): Slice[] => {
  const cuts = [...new Set(spans.flatMap((w) => [w.a0, w.a1]))].toSorted(
    (a, b) => a - b
  );
  return cuts.slice(1).map((e, k) => {
    const s = cuts[k] ?? e;
    const reaches = spans
      .flatMap((w) => (w.a0 <= s && w.a1 >= e ? [w.reach] : []))
      .toSorted((a, b) => b - a);
    return { e, reaches, s };
  });
};

/**
 * The outline of everywhere at least `level + 1` wedges overlap: one closed
 * stepped sector per unbroken run of slices.
 */
const levelPath = (dial: Dial, slices: Slice[], level: number) => {
  const { cx, cy, r0 } = dial;
  const runs: { e: number; r: number; s: number }[][] = [];
  let run: { e: number; r: number; s: number }[] = [];
  for (const slice of slices) {
    const r = slice.reaches.at(level);
    const last = run.at(-1);
    if (r === undefined || (last !== undefined && last.e !== slice.s)) {
      if (run.length > 0) {
        runs.push(run);
      }
      run = [];
    }
    if (r !== undefined) {
      run.push({ e: slice.e, r, s: slice.s });
    }
  }
  if (run.length > 0) {
    runs.push(run);
  }
  return runs
    .map((steps) => {
      const start = steps[0]?.s ?? 0;
      const end = steps.at(-1)?.e ?? start;
      const outer = steps
        .map((st) => {
          const [ax, ay] = clock(cx, cy, st.r, st.s);
          const [bx, by] = clock(cx, cy, st.r, st.e);
          return `L${ax},${ay}A${st.r},${st.r} 0 0 1 ${bx},${by}`;
        })
        .join("");
      const [ix, iy] = clock(cx, cy, r0, start);
      const [jx, jy] = clock(cx, cy, r0, end);
      const large = end - start > 180 ? 1 : 0;
      return `M${ix},${iy}${outer}L${jx},${jy}A${r0},${r0} 0 ${large} 0 ${ix},${iy}Z`;
    })
    .join("");
};

/**
 * The events as a density map: where one wedge lies the hatch is open, where
 * two overlap it tightens, where three or more pile up it is densest. Each
 * level is hatch on paper inside a 1px rule.
 */
const Density = (props: { dial: Dial; ids: string[]; slices: Slice[] }) => (
  <g>
    {DENSITY.map((pitch, level) => (
      <path
        className="fade stroke-l5"
        d={levelPath(props.dial, props.slices, level)}
        fill={paint(props.ids[level] ?? "")}
        key={`level-${pitch}`}
        strokeLinejoin="round"
        strokeWidth={1}
        style={stagger(level)}
      />
    ))}
  </g>
);

/** Invisible hit wedges, smallest on top; the hovered one is outlined. */
const HitWedges = (props: {
  dial: Dial;
  hovered: number | null;
  onEnter: (i: number, x: number, y: number) => void;
  spans: Span[];
}) => {
  const { cx, cy, r0 } = props.dial;
  const order = props.spans
    .map((span, i) => ({ i, span }))
    .toSorted((a, b) => b.span.reach - a.span.reach);
  return (
    <g>
      {order.map(({ i, span }) => {
        const hovered = props.hovered === i;
        const [tx, ty] = clock(cx, cy, span.reach, (span.a0 + span.a1) / 2);
        return (
          <HitPath
            className={`transition-tone ${hovered ? "stroke-ink" : "stroke-none"}`}
            d={sectorPath(cx, cy, r0, span.reach, span.a0, span.a1)}
            key={`hit-${span.a0}-${span.a1}-${span.reach}`}
            onPointerEnter={() => {
              props.onEnter(i, tx, ty - 6);
            }}
            strokeLinejoin="round"
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
};

/**
 * L10 Solar flares. Events overlaid on a 24-hour dial: wedge angle = time
 * of day, angular width = duration, reach = size (linear in `size`, which is
 * already on a log scale). Overlap is read by hatch pitch, open to dense;
 * flagged wedges are crosshatched in ink.
 */
export const RadialPatchwork = (props: RadialPatchworkProps) => {
  const data = props.data ?? radialPatchworkDemo;
  const height = props.height ?? 460;
  const outlined = props.outlined ?? "class M or stronger";
  const hover = useHover<number>();
  const maxSize = Math.max(1, ...data.map((d) => d.size));
  const id = useTextureIds("patch");
  const levelIds = DENSITY.map((pitch) => id(`hatch-${pitch}`));
  const tipEvent = hover.key === null ? undefined : data.at(hover.key);

  return (
    <Plot
      overlay={
        hover.at === null || tipEvent === undefined ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                tipEvent.label,
                `${tipEvent.minutes} min`,
                ...(tipEvent.flagged === true ? [outlined] : []),
              ]}
              lead={`${hhmm(tipEvent.hour)} UTC`}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        // Hour labels reach ~40px beyond the rim, above and below.
        const noteH = noteSpace(props.note, width - 16, 20);
        const R = clamp(
          Math.min(width / 2 - 48, (height - 88 - noteH) / 2),
          90,
          220
        );
        const dial: Dial = {
          R,
          cx: Math.round(width / 2),
          cy: Math.round(R + 44),
          r0: R * 0.12,
        };
        const svgH = Math.min(height, Math.round(2 * R + 88 + noteH));
        const spans = data.map((event) => spanOf(dial, event, maxSize));
        const flagged = spans.filter((_, i) => data[i]?.flagged === true);
        return (
          <ChartSvg
            height={svgH}
            label={`${data.length} solar flares on a 24-hour dial in UTC, ${flagged.length} of ${outlined}`}
            leave={hover.clear}
            title="Solar flares overlaid on a 24-hour dial"
            width={width}
          >
            <defs>
              {DENSITY.map((pitch, level) => (
                <Hatch
                  id={levelIds[level] ?? ""}
                  key={`def-${pitch}`}
                  pitch={pitch}
                  tone="fill-l3"
                />
              ))}
              <CrossHatch id={id("hero")} tone="fill-hero" />
            </defs>
            <DialFace dial={dial} />
            <Density dial={dial} ids={levelIds} slices={slicesOf(spans)} />
            {flagged.map((span, k) => (
              <path
                className="fade stroke-hero"
                d={sectorPath(
                  dial.cx,
                  dial.cy,
                  dial.r0,
                  span.reach,
                  span.a0,
                  span.a1
                )}
                fill={paint(id("hero"))}
                key={`flag-${span.a0}-${span.a1}`}
                strokeLinejoin="round"
                strokeWidth={1}
                style={stagger(DENSITY.length + k)}
              />
            ))}
            <HitWedges
              dial={dial}
              hovered={hover.key}
              onEnter={(i, x, y) => {
                hover.show(i, x, y);
              }}
              spans={spans}
            />
            <FootNote height={svgH} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
