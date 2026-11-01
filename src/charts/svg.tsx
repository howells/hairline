import { useContext } from "react";
import type { ReactNode, SVGProps } from "react";

import { ScaleContext } from "./scale-context";

type ChartSvgProps = Omit<SVGProps<SVGSVGElement>, "aria-label"> & {
  children: ReactNode;
  height: number;
  /** What the chart says, read out by screen readers and shown as its title. */
  label: string;
  /** Called as the pointer leaves the chart: usually the hover's `clear`. */
  leave?: () => void;
  /** A shorter hover title, when the label is a full reading of the data. */
  title?: string;
  width: number;
};

/**
 * The svg every chart draws into: sized, labelled for screen readers and
 * titled. Pointer handlers, classes and data attributes pass straight through.
 */
export const ChartSvg = ({
  children,
  height,
  label,
  leave,
  style,
  title,
  width,
  ...rest
}: ChartSvgProps) => {
  const { fit, scale, strokes } = useContext(ScaleContext);
  const scaled = fit === true || scale !== undefined;
  const size = scaled
    ? {
        height: fit === true ? undefined : height * (scale ?? 1),
        style:
          fit === true
            ? { ...style, aspectRatio: `${width} / ${height}` }
            : style,
        viewBox: `0 0 ${width} ${height}`,
        width: fit === true ? "100%" : width * (scale ?? 1),
      }
    : { height, style, viewBox: undefined, width };
  return (
    <svg
      data-hl-strokes={strokes === "device" ? "device" : undefined}
      {...size}
      aria-label={label}
      onPointerLeave={
        leave === undefined
          ? undefined
          : () => {
              leave();
            }
      }
      {...rest}
    >
      <title>{title ?? label}</title>
      {children}
    </svg>
  );
};
