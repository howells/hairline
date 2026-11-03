import { useContext, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { ScaleOptions } from "../schema/scale";
import { useEntry, useMeasure, useReveal } from "./hooks";
import type { Animate } from "./hooks";
import { PANEL } from "./roles";
import { ScaleContext, magnification } from "./scale-context";

const revealClass = (shown: boolean) => (shown ? "is-shown" : "is-hidden");
/** A plot with nothing to animate carries neither class: it is simply drawn. */
const phaseClass = (phase: "hidden" | "shown" | "still") =>
  phase === "still" ? "is-still" : revealClass(phase === "shown");

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
  /**
   * When the entry draws in: "scroll" when scrolled into view, "mount" at
   * once, "off" never. The default is "off" for a fixed-size chart (`width`
   * given) and "scroll" for a responsive one. Off draws the chart and marks it
   * ready (`data-hl-ready="true"`) in the first HTML. Under reduced motion the
   * stylesheet draws the plot in the first paint; `ready` follows hydration,
   * when the reader's preference is known.
   */
  animate?: Animate;
  children: (width: number) => ReactNode;
  className?: string;
  /**
   * Initial width for responsive mode: the first render (the server's too)
   * draws at this width until the real one is measured. Ignored if `width` is set.
   */
  initialWidth?: number;
  /** Called when the chart has settled, as `data-hl-ready` turns "true". */
  onReady?: () => void;
  overlay?: ReactNode;
  /** Change it to replay the entry without remounting. */
  replayKey?: number | string;
  /** Slide scale (see schema/scale.ts), applied to every ChartSvg inside. */
  scaling?: ScaleOptions;
  style?: CSSProperties;
  /**
   * The chart's data table (<DataTable>), rendered after the marks whether or
   * not a width is known yet, so it is in the first server HTML.
   */
  table?: ReactNode;
  /**
   * Fixed mode: draw at exactly this width, in px. Nothing is measured, so
   * the first render, on the server too, is the complete chart. Leave it out
   * for responsive mode, which measures the container.
   */
  width?: number;
}

/**
 * The bare plotting surface for editorial charts, in one of two modes. Fixed
 * (`width` given): draws at that width at once and never measures. Responsive
 * (the default): measures its width, drawing at `initialWidth` (else nothing)
 * until it knows. Either way it plays the entry animation (.is-hidden →
 * .is-shown) when scrolled into view. No chrome; titles and sources belong to
 * <Card>. Tooltips and other HTML overlays go in `overlay`, positioned against
 * this box.
 */
const NO_SCALE: ScaleOptions = {};

export const Plot = (props: PlotProps) => {
  const fixed = props.width !== undefined;
  const [ref, measured] = useMeasure<HTMLDivElement>(
    props.width ?? props.initialWidth ?? 0,
    !fixed
  );
  const width = props.width ?? measured;
  // A fixed-size chart is a server or export render: drawn and ready at once
  // unless it asks to animate. The measured, responsive chart reveals on scroll.
  const entry = useEntry(ref, {
    ...props,
    animate: props.animate ?? (fixed ? "off" : "scroll"),
  });
  return (
    <div
      ref={ref}
      data-hl-ready={entry.ready ? "true" : "false"}
      className={`[&_svg:focus-visible]:outline-ink relative min-w-0 [&_svg]:block [&_svg]:select-none [&_svg:focus]:outline-none [&_svg:focus-visible]:outline-1 [&_svg:focus-visible]:outline-offset-4 [&_svg:focus-visible]:outline-solid ${phaseClass(entry.phase)} ${props.className ?? ""}`}
      style={props.style}
    >
      <ScaleContext.Provider value={props.scaling ?? NO_SCALE}>
        {width > 0 && props.children(width)}
        {props.overlay}
      </ScaleContext.Provider>
      {props.table}
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
  // Anchors are given in the chart's drawing pixels; the svg may be shown larger.
  const zoom = magnification(useContext(ScaleContext));
  const x = props.x * zoom;
  const y = props.y * zoom;
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
    const shown = box.querySelector("svg")?.getBoundingClientRect().width ?? 0;
    const inside = Math.min(
      Math.max(x, half + TIP_INSET),
      Math.max(box.clientWidth, shown) - half - TIP_INSET
    );
    setShift(inside - x);
    // Re-measure when the anchor moves; content changes travel with it.
  }, [x]);
  return (
    <output
      ref={ref}
      className={`rounded-tip bg-ink text-paper text-tick/normal pointer-events-none absolute z-10 px-2.5 py-1.75 whitespace-nowrap tabular-nums [&_b]:font-semibold ${props.below === true ? "-translate-x-1/2 translate-y-3" : "-mt-2.5 -translate-x-1/2 -translate-y-full"}`}
      style={{ left: x + shift, top: y }}
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
