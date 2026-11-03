import type {
  Reference,
  ReferenceBand,
  ReferenceLine,
} from "../schema/references";
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
import { HRule, VRule } from "./rules";
import { PlateLabel } from "./texture";

/*
 * Reference marks: the target lines and bands a chart's `references` prop
 * names, drawn the one way. A band is a solid quiet tone behind the marks; a
 * line is the chart's one dash, because it means a target. Every name sits on
 * a small paper plate, over the marks, and stands in whichever of its places
 * is farthest from the marks the chart says to avoid. `along` says which way
 * the value runs: "y" is a value axis going up the page (the lines are
 * level), "x" one going across it (the lines are upright). A reference
 * outside the axis is not drawn; it is still in the data table and the
 * description.
 */

/** The plot's rectangle in px: where the references run. */
export interface Plane {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface ReferenceProps {
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
const spanOf = (
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

/** The bands, drawn first, behind the marks. Their names come with `ReferenceOverlay`. */
export const ReferenceBands = (props: ReferenceProps) => {
  const { along, plane } = props;
  return (
    <g className="fade">
      {bandsOf(props.refs).map((band) => {
        const [start, end] = spanOf(band, props);
        if (end <= start) {
          return null;
        }
        const key = `${band.from}-${band.to}`;
        return along === "y" ? (
          <g key={key}>
            <rect
              className="fill-l6"
              height={end - start}
              width={Math.round(plane.x1) - Math.round(plane.x0)}
              x={Math.round(plane.x0)}
              y={start}
            />
            <HRule
              className="stroke-l5"
              kind="plain"
              x0={plane.x0}
              x1={plane.x1}
              y={start}
            />
            <HRule
              className="stroke-l5"
              kind="plain"
              x0={plane.x0}
              x1={plane.x1}
              y={end}
            />
          </g>
        ) : (
          <g key={key}>
            <rect
              className="fill-l6"
              height={Math.round(plane.y1) - Math.round(plane.y0)}
              width={end - start}
              x={start}
              y={Math.round(plane.y0)}
            />
            <VRule
              className="stroke-l5"
              kind="plain"
              x={start}
              y0={plane.y0}
              y1={plane.y1}
            />
            <VRule
              className="stroke-l5"
              kind="plain"
              x={end}
              y0={plane.y0}
              y1={plane.y1}
            />
          </g>
        );
      })}
    </g>
  );
};

const plateAt = (plate: Plate, text: string, className: string) => (
  <PlateLabel
    anchor="start"
    className={className}
    text={text}
    x={plate.left}
    y={plate.top + PLATE_H / 2}
  />
);

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

const BandName = (props: ReferenceProps & { band: ReferenceBand }) => {
  const { along, band, plane } = props;
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
    const plate = clearest(
      levelBandPlates(width, { end, start }, across),
      props.avoid
    );
    return plateAt(plate, band.label, "t-axis");
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
  const plate = clearest(plates, props.avoid);
  return plateAt(plate, band.label, "t-axis");
};

const LineMark = (props: ReferenceProps & { line: ReferenceLine }) => {
  const { along, line, plane } = props;
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
  return (
    <g>
      {along === "y" ? (
        <HRule kind="target" x0={plane.x0} x1={plane.x1} y={at} />
      ) : (
        <VRule kind="target" x={at} y0={plane.y0} y1={plane.y1} />
      )}
      {line.label === undefined
        ? null
        : plateAt(clearest(plates, props.avoid), line.label, "t-label")}
    </g>
  );
};

/** The target lines, and every name, drawn over the marks. */
export const ReferenceOverlay = (props: ReferenceProps) => (
  <g className="fade">
    {linesOf(props.refs).map((line) => (
      <LineMark
        {...props}
        key={`${line.value}-${line.label ?? ""}`}
        line={line}
      />
    ))}
    {bandsOf(props.refs).map((band) => (
      <BandName {...props} band={band} key={`${band.from}-${band.to}`} />
    ))}
  </g>
);
