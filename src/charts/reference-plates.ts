import type {
  Reference,
  ReferenceBand,
  ReferenceLine,
} from "../schema/references";
import type { Box } from "./label-box";
import {
  MARGIN,
  PLATE_H,
  bandsOf,
  clearest,
  levelBandPlates,
  levelLinePlates,
  linesOf,
  plateWidth,
} from "./reference-marks";
import type { Plate, Spot } from "./reference-marks";

/** The plot's rectangle in px: where the references run. */
export interface Plane {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface ReferenceProps {
  along: "x" | "y";
  /** Marks a name should stand clear of: dots, and the end value's label. */
  avoid?: readonly Spot[];
  plane: Plane;
  refs: readonly Reference[] | undefined;
  /** A value's place along the axis, in px. */
  scale: (value: number) => number;
  /** Where names may stand across the plot, when a value axis takes the ends. */
  within?: readonly [number, number];
}

const inside = (at: number, a: number, b: number) =>
  at >= Math.min(a, b) - 0.5 && at <= Math.max(a, b) + 0.5;

/** The span of a band along the axis, in whole px, clamped to the plane. */
export const spanOf = (
  band: ReferenceBand,
  props: ReferenceProps
): [number, number] => {
  const a = props.scale(band.from);
  const b = props.scale(band.to);
  const [lo, hi] =
    props.along === "y"
      ? [props.plane.y0, props.plane.y1]
      : [props.plane.x0, props.plane.x1];
  return [
    Math.round(Math.max(lo, Math.min(a, b))),
    Math.round(Math.min(hi, Math.max(a, b))),
  ];
};

/** Candidate plates for a name along an upright line or band: its sides, top and bottom. */
const uprightPlates = (
  width: number,
  x: number,
  plane: Plane,
  at: ReferenceLine["at"]
): Plate[] => {
  const tops =
    at === "start" ? [plane.y0 + 3] : [plane.y1 - 3 - PLATE_H, plane.y0 + 3];
  return tops.flatMap((top) =>
    [x + MARGIN, x - MARGIN - width].map((left) => ({
      h: PLATE_H,
      left,
      top,
      w: width,
    }))
  );
};

/** Where a band's name stands, or null when it has none or is not drawn. */
export const bandPlate = (
  props: ReferenceProps,
  band: ReferenceBand
): Plate | null => {
  const { along, plane } = props;
  if (band.label === undefined) {
    return null;
  }
  const [start, end] = spanOf(band, props);
  if (end <= start) {
    return null;
  }
  const width = plateWidth(band.label);
  const across = {
    hi: props.within?.[1] ?? plane.x1,
    lo: props.within?.[0] ?? plane.x0,
  };
  if (along === "y") {
    return clearest(
      levelBandPlates(width, { end, start }, across),
      props.avoid
    );
  }
  // An upright band names itself inside its top or bottom when it fits, else over the plane.
  const room = end - start;
  const left = (start + end) / 2 - width / 2;
  const plates: Plate[] =
    width + MARGIN <= room
      ? [plane.y0 + 3, plane.y1 - 3 - PLATE_H].map((top) => ({
          h: PLATE_H,
          left: start + MARGIN,
          top,
          w: width,
        }))
      : [{ h: PLATE_H, left, top: plane.y0 - 3 - PLATE_H, w: width }];
  return clearest(plates, props.avoid);
};

/** Where a target line is and where its name stands; null when it is off the axis. */
export const linePlate = (props: ReferenceProps, line: ReferenceLine) => {
  const { along, plane } = props;
  const at = props.scale(line.value);
  const span = along === "y" ? [plane.y0, plane.y1] : [plane.x0, plane.x1];
  if (!Number.isFinite(at) || !inside(at, span[0], span[1])) {
    return null;
  }
  const width = line.label === undefined ? 0 : plateWidth(line.label);
  const across = {
    hi: props.within?.[1] ?? plane.x1,
    lo: props.within?.[0] ?? plane.x0,
  };
  const plates =
    along === "y"
      ? levelLinePlates(width, Math.round(at), across, line.at)
      : uprightPlates(width, Math.round(at), plane, line.at);
  return { at, plate: clearest(plates, props.avoid) };
};

/** The boxes the names stand on, as the overlay draws them: what a tip keeps off. */
export const referenceBoxes = (props: ReferenceProps): Box[] =>
  [
    ...linesOf(props.refs).flatMap((line) => {
      const placed = linePlate(props, line);
      return placed === null || line.label === undefined ? [] : [placed.plate];
    }),
    ...bandsOf(props.refs).flatMap((band) => {
      const plate = bandPlate(props, band);
      return plate === null ? [] : [plate];
    }),
  ].map((p) => ({ x0: p.left, x1: p.left + p.w, y0: p.top, y1: p.top + p.h }));
