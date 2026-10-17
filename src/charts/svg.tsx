import type { ReactNode, SVGProps } from "react";

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
  label,
  leave,
  title,
  ...rest
}: ChartSvgProps) => (
  <svg
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
