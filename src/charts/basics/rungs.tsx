import { stagger } from "../util";
import { RUNG, rungY } from "./rung-geometry";

interface RungsProps {
  /** Class for every `every`th rung, so a stack counts off ("" for none). */
  accent?: string;
  /** Accent rhythm in rungs; 5 by default. */
  every?: number;
  className: string;
  /** Pattern fill (`url(#id)`) for the rungs themselves, e.g. a dotted rung. */
  fill?: string;
  floor: number;
  /** Rungs already stacked below this run (stacks and waterfalls). */
  from?: number;
  id: string;
  left: number;
  n: number;
  /** Entry-stagger slot of the lowest rung. */
  order?: number;
  pitch: number;
  /** Whole px an accent rung reaches past the run on each side; 0 by default. */
  reach?: number;
  width: number;
}

/**
 * A run of `n` countable rungs standing on `floor`, one per unit: solid 2px
 * bars at one whole-pixel pitch. Every fifth (or `every`th) rung can step
 * darker, and reach a little wider, like the long marks on a rule.
 */
export const Rungs = (props: RungsProps) => {
  const from = props.from ?? 0;
  const left = Math.round(props.left);
  const width = Math.max(1, Math.round(props.left + props.width) - left);
  const every = props.every ?? 5;
  const reach = Math.round(props.reach ?? 0);
  return (
    <g>
      {Array.from({ length: props.n }, (_, r) => {
        const k = from + r;
        // Count off within this run, from its lowest rung.
        const accent =
          props.accent !== undefined &&
          props.accent !== "" &&
          (r + 1) % every === 0;
        return (
          <rect
            className={`grow-x ${accent ? props.accent : props.className}`}
            fill={accent ? undefined : props.fill}
            height={RUNG}
            key={`${props.id}-${k}`}
            style={stagger((props.order ?? 0) + r * 0.35, "fine")}
            width={accent ? width + reach * 2 : width}
            x={accent ? left - reach : left}
            y={rungY(props.floor, k, props.pitch)}
          />
        );
      })}
    </g>
  );
};
