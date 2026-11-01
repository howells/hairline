import { useContext } from "react";
import type { ReactNode, SVGProps } from "react";

import { useSvgId } from "./hooks";
import { ScaleContext } from "./scale-context";

type ChartSvgProps = Omit<SVGProps<SVGSVGElement>, "aria-label" | "role"> & {
  children: ReactNode;
  /**
   * A sentence or two on what the data says, from the data passed in: read
   * out after the name. Becomes the svg's <desc>.
   */
  desc?: string;
  height: number;
  /** The chart's accessible name, read out by screen readers and shown as its title. */
  label: string;
  /** Called as the pointer leaves the chart: usually the hover's `clear`. */
  leave?: () => void;
  /** A shorter hover title, when the label is a full reading of the data. */
  title?: string;
  width: number;
};

/**
 * The svg every chart draws into: sized, an image with an accessible name
 * (`label`) and a description (`desc`), and titled. Pointer handlers,
 * classes and data attributes pass straight through.
 */
export const ChartSvg = ({
  children,
  desc,
  height,
  label,
  leave,
  style,
  title,
  width,
  ...rest
}: ChartSvgProps) => {
  const descId = useSvgId("desc");
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
      aria-describedby={desc === undefined ? undefined : descId}
      aria-label={label}
      onPointerLeave={
        leave === undefined
          ? undefined
          : () => {
              leave();
            }
      }
      role="img"
      {...rest}
    >
      <title>{title ?? label}</title>
      {desc === undefined ? null : <desc id={descId}>{desc}</desc>}
      {children}
    </svg>
  );
};
