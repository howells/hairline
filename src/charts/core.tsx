import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { useMeasure, useReveal } from "./hooks";
import { PANEL } from "./roles";

const revealClass = (shown: boolean) => (shown ? "is-shown" : "is-hidden");

interface ChartProps {
  bottom?: ReactNode;
  children: (width: number) => ReactNode;
  className?: string;
  top?: ReactNode;
}

/**
 * The panel every board chart lives in: measures its width, plays the entry
 * animation when it scrolls into view, and slots optional HTML above/below.
 */
export const Chart = (props: ChartProps) => {
  const figRef = useRef<HTMLElement>(null);
  const [ref, width] = useMeasure<HTMLDivElement>();
  const shown = useReveal(figRef);
  return (
    <figure
      ref={figRef}
      className={`m-0 ${PANEL} ${revealClass(shown)} ${props.className ?? ""}`}
    >
      {props.top}
      <div ref={ref}>{width > 0 && props.children(width)}</div>
      {props.bottom}
    </figure>
  );
};

interface PlotProps {
  children: (width: number) => ReactNode;
  className?: string;
  overlay?: ReactNode;
  style?: CSSProperties;
}

/**
 * The bare plotting surface for editorial charts: measures its width and
 * plays the entry animation (.is-hidden → .is-shown) when scrolled into view.
 * No chrome; titles and sources belong to <Card>. Tooltips and other HTML
 * overlays go in `overlay`, positioned against this box.
 */
export const Plot = (props: PlotProps) => {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const shown = useReveal(ref);
  return (
    <div
      ref={ref}
      className={`[&_svg:focus-visible]:outline-muted relative min-w-0 [&_svg]:block [&_svg]:select-none [&_svg:focus]:outline-none [&_svg:focus-visible]:outline-1 [&_svg:focus-visible]:outline-offset-4 [&_svg:focus-visible]:outline-solid ${revealClass(shown)} ${props.className ?? ""}`}
      style={props.style}
    >
      {width > 0 && props.children(width)}
      {props.overlay}
    </div>
  );
};

interface TooltipProps {
  below?: boolean;
  children: ReactNode;
  x: number;
  y: number;
}

/** Gap kept between a tooltip and the edge of its chart. */
const TIP_INSET = 4;

/** Dark pill tooltip, anchored at (x, y) inside the nearest Plot. */
export const Tooltip = (props: TooltipProps) => {
  const ref = useRef<HTMLOutputElement>(null);
  // Horizontal shift that keeps the tooltip inside its chart near the edges.
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.offsetParent;
    if (el === null || !(box instanceof HTMLElement)) {
      return;
    }
    const half = el.offsetWidth / 2;
    const inside = Math.min(
      Math.max(props.x, half + TIP_INSET),
      box.clientWidth - half - TIP_INSET
    );
    setShift(inside - props.x);
    // Re-measure when the anchor moves; content changes travel with it.
  }, [props.x]);
  return (
    <output
      ref={ref}
      className={`rounded-tip bg-ink text-paper text-tick/normal pointer-events-none absolute z-10 px-2.5 py-1.75 whitespace-nowrap tabular-nums [&_b]:font-semibold ${props.below === true ? "-translate-x-1/2 translate-y-3" : "-mt-2.5 -translate-x-1/2 -translate-y-full"}`}
      style={{ left: props.x + shift, top: props.y }}
    >
      {props.children}
    </output>
  );
};

interface SplitClipsProps {
  height: number;
  id: string;
  width: number;
  x: number;
}

/**
 * Clip paths splitting the plot at the cursor: `${id}-past` and `${id}-future`.
 * Also defines `${id}-sweep`, the left-to-right entry reveal.
 */
export const SplitClips = (props: SplitClipsProps) => {
  const pad = 40;
  return (
    <defs>
      <clipPath id={`${props.id}-past`}>
        <rect
          x={-pad}
          y={-pad}
          width={Math.max(0, props.x + pad)}
          height={props.height + pad * 2}
        />
      </clipPath>
      <clipPath id={`${props.id}-future`}>
        <rect
          x={props.x}
          y={-pad}
          width={props.width + pad}
          height={props.height + pad * 2}
        />
      </clipPath>
      <clipPath id={`${props.id}-sweep`}>
        <rect
          className="sweep"
          x={-pad}
          y={-pad}
          width={props.width + pad * 2}
          height={props.height + pad * 2}
        />
      </clipPath>
    </defs>
  );
};

// ---------- Legend items ----------

export interface LegendItem {
  color: string;
  hollow?: boolean;
  label: string;
}
