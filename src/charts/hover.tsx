import type { SVGProps } from "react";

import { cx, dimClass } from "./util";

type GroupProps = SVGProps<SVGGElement> & {
  /** Another record is hovered: drop this one back. */
  dim: boolean;
};

/**
 * A hoverable record's group. It always carries the opacity transition, so
 * it eases both ways, and drops to the shared dim level while another
 * record is hovered.
 */
export const DimGroup = ({ className, dim, ...rest }: GroupProps) => (
  <g className={cx(dimClass(dim), className)} {...rest} />
);

/** An invisible rect that widens a record's hover target. */
export const HitRect = ({
  className,
  ...rest
}: Omit<SVGProps<SVGRectElement>, "fill">) => (
  <rect className={cx("fill-transparent", className)} {...rest} />
);

/** An invisible disc that widens a point's hover target. */
export const HitCircle = ({
  className,
  ...rest
}: Omit<SVGProps<SVGCircleElement>, "fill">) => (
  <circle className={cx("fill-transparent", className)} {...rest} />
);

/** An invisible path (a wedge, a sector) that widens a record's hover target. */
export const HitPath = ({
  className,
  ...rest
}: Omit<SVGProps<SVGPathElement>, "fill">) => (
  <path className={cx("fill-transparent", className)} {...rest} />
);

/**
 * The tooltip's one sentence: the record's name in bold, then its facts,
 * each after a middle dot.
 */
export const TipText = (props: { facts?: readonly string[]; lead: string }) => (
  <>
    <b>{props.lead}</b>
    {props.facts === undefined || props.facts.length === 0
      ? null
      : ` · ${props.facts.join(" · ")}`}
  </>
);
