import { scaleSqrt } from "d3-scale";

import { glyphBox } from "../glyph-box";
import { GlyphKey } from "../glyph-key";
import { RING_STEP } from "../marks";
import { DotRing, DotScreen } from "../texture";
import { HALFTONE_R, paint, useTextureIds } from "../texture-ids";
import type { AlmanacCell } from "./bubble-almanac.data";
import { RING_GAP, VEIL } from "./bubble-geometry";

interface BubbleMarkProps {
  cx: number;
  cy: number;
  /** Radius of the solid core, 0 for none. */
  coreR: number;
  /** Dotted ring: production fell on the year before. */
  flag: boolean;
  /** The largest cell: ink outline, halftone fill. */
  hero: boolean;
  /** Radius of the veiled circle. */
  r: number;
  /** Id of the halftone screen that fills the hero. */
  screen: string;
}

/** The almanac's glyph: a veiled circle sized by amount, a core by yield, a dotted ring when flagged. */
export const BubbleMark = (props: BubbleMarkProps) => {
  const { cx, cy, hero, r } = props;

  return (
    <>
      <circle
        className={hero ? "stroke-hero" : "fill-l4 stroke-l5"}
        cx={cx}
        cy={cy}
        fill={hero ? paint(props.screen) : undefined}
        // One tone at one opacity (VEIL): the year rule shows through.
        fillOpacity={hero ? 1 : VEIL}
        r={r}
        strokeWidth={hero ? 2 : 1}
      />
      {props.flag ? (
        <DotRing
          cx={cx}
          cy={cy}
          r={r + RING_GAP}
          step={RING_STEP.mark}
          tone="fill-l4"
        />
      ) : null}
      {props.coreR > 0 ? (
        <circle
          className={hero ? "fill-hero" : "fill-l3"}
          cx={cx}
          cy={cy}
          r={props.coreR}
        />
      ) : null}
    </>
  );
};

/** The cell the key draws: the largest that fell on the year before, else the largest. */
const exemplarOf = (data: AlmanacCell[]) => {
  const bySize = data.toSorted((a, b) => b.value - a.value);

  return bySize.find((d) => d.flag === true && d.core > 0) ?? bySize[0];
};

interface BubbleKeyProps {
  data: AlmanacCell[];
  format: (v: number) => string;
  noun: string;
  width: number;
}

/** One real cell drawn large, its circle, core and dotted ring named. */
export const BubbleKey = (props: BubbleKeyProps) => {
  const { data } = props;
  const screen = useTextureIds("almanac-key")("screen");
  const cell = exemplarOf(data);

  if (cell === undefined) {
    return null;
  }

  const box = glyphBox(props.width);
  const flag = cell.flag === true;
  // The chart's own ratios: the largest circle fills the box less the ring.
  const maxR = box.size / 2 - RING_GAP - 4;

  const r = Math.max(
    3,
    scaleSqrt()
      .domain([0, Math.max(1, ...data.map((d) => d.value))])
      .range([0, maxR])(cell.value)
  );

  const coreR =
    cell.core > 0
      ? Math.max(
          2,
          scaleSqrt()
            .domain([0, Math.max(1, ...data.map((d) => d.core))])
            .range([0, maxR * 0.16])(cell.core)
        )
      : 0;

  const rim = r * Math.SQRT1_2;
  const ring = (r + RING_GAP) * Math.SQRT1_2;
  const name = `${cell.category}, ${cell.year}`;

  return (
    <GlyphKey
      box={box}
      defs={<DotScreen id={screen} r={HALFTONE_R[1]} tone="fill-l3" />}
      label={`How to read one circle: ${name}`}
      parts={[
        {
          at: [box.cx + rim, box.cy - rim],
          detail: `${props.format(cell.value)} ${props.noun}`,
          name: "Circle area",
        },
        ...(coreR > 0
          ? [
              {
                at: [box.cx, box.cy] as const,
                detail: `Yield ${props.format(cell.core)} t/ha`,
                name: "Dark core",
              },
            ]
          : []),
        ...(flag
          ? [
              {
                at: [box.cx - ring, box.cy + ring] as const,
                detail: "Down on the year before",
                name: "Dotted ring",
              },
            ]
          : []),
      ]}
      record={name}
      width={props.width}
    >
      <BubbleMark
        coreR={coreR}
        cx={box.cx}
        cy={box.cy}
        flag={flag}
        hero={false}
        r={r}
        screen={screen}
      />
    </GlyphKey>
  );
};
