import type { ReferenceBand, ReferenceLine } from "../schema/references";
import { PLATE_H, bandsOf, linesOf } from "./reference-marks";
import type { Plate } from "./reference-marks";
import { bandPlate, linePlate, spanOf } from "./reference-plates";
import type { ReferenceProps } from "./reference-plates";
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

const BandName = (props: ReferenceProps & { band: ReferenceBand }) => {
  const plate = bandPlate(props, props.band);
  return plate === null || props.band.label === undefined
    ? null
    : plateAt(plate, props.band.label, "t-axis");
};

const LineMark = (props: ReferenceProps & { line: ReferenceLine }) => {
  const { along, line, plane } = props;
  const placed = linePlate(props, line);
  if (placed === null) {
    return null;
  }
  return (
    <g>
      {along === "y" ? (
        <HRule kind="target" x0={plane.x0} x1={plane.x1} y={placed.at} />
      ) : (
        <VRule kind="target" x={placed.at} y0={plane.y0} y1={plane.y1} />
      )}
      {line.label === undefined
        ? null
        : plateAt(placed.plate, line.label, "t-label")}
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
