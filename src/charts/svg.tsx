import { useId } from "react";
import type { ReactNode, SVGProps } from "react";

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
  label,
  leave,
  title,
  ...rest
}: ChartSvgProps) => {
  const descId = useId();
  return (
    <svg
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
