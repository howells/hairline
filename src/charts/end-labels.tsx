import type { EndPlacement } from "./line-ends";
import { LEAD, TEXT_GAP } from "./line-ends";
import { Label } from "./text";
import { stagger } from "./util";

/** The hero's value stands this far after its name, px. */
const VALUE_GAP = 6;

/**
 * Line-end labels: the hero in ink with its value, the others named in the
 * label voice, the folded rest in one quiet label. A label nudged off its
 * line's end carries a short leader back to it. `x` is where the lines end.
 */
export const EndLabels = (props: { placed: EndPlacement; x: number }) => {
  const { group, labels } = props.placed;
  const text = props.x + LEAD + TEXT_GAP;

  return (
    <g className="fade" style={stagger(12, "series")}>
      {labels.map((l) => (
        <g key={l.name}>
          {l.nudged ? (
            <line
              className="rule"
              x1={props.x + 3}
              x2={props.x + LEAD}
              y1={l.at}
              y2={l.y}
            />
          ) : null}
          <Label
            className={l.hero ? "fill-ink" : undefined}
            middle
            voice="label"
            x={text}
            y={l.y}
          >
            {l.name}
            {l.hero && l.display !== undefined ? (
              <tspan className="t-value" dx={VALUE_GAP}>
                {l.display}
              </tspan>
            ) : null}
          </Label>
        </g>
      ))}
      {group === null ? null : (
        <Label middle muted voice="axis" x={text} y={group.y}>
          {group.text}
        </Label>
      )}
    </g>
  );
};
