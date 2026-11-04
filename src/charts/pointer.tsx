import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Dot } from "./markers";
import { placeTip, spoken } from "./pointer-model";
import type { Avoid } from "./pointer-model";
import { Cursor } from "./rules";
import { ScaleContext, magnification } from "./scale-context";
import { tipCard } from "./tip-card";
import { usePointer } from "./use-pointer";
import type { BindOptions, PointerStop } from "./use-pointer";

/*
 * The one tip. Every chart that reads a point off its marks speaks through
 * this: the stop's title in bold, then a row per series (swatch, name, value),
 * the hero first. <Pointer> wires the shared pointer model (use-pointer.ts)
 * to it: the crosshair and ringed dots go inside the svg, the tip and a
 * polite live region beside it.
 */

export interface TipRow {
  /** Dims the row: a note, not a measurement. */
  muted?: boolean;
  /** A series' name; a lone value has none. */
  name?: string;
  /** Background class of the row's swatch, e.g. "bg-hero"; none draws no swatch. */
  swatch?: string;
  value: string;
}

export interface Stop<K> extends PointerStop<K> {
  /** A y-range the tip keeps clear of where it can: the hero's line or the row. */
  avoid?: Avoid;
  /** Stand above the mark, this far over y, when there is room (a column's label sits there), px. */
  above?: number;
  /** Room the mark takes either side of x, so the tip stands beside it, px. */
  clear?: number;
  /** Leave the column's band off here, where a printed label stands (the band would paint over it). */
  bare?: boolean;
  /** A ringed dot per series at this stop, as the cursor draws them. */
  dots?: readonly { className: string; y: number }[];
  /** Hero first. */
  rows: readonly TipRow[];
  lead: string;
}

export interface PointerViewProps<K> {
  active: Stop<K> | null;
  key: K | null;
  pinned: boolean;
  /** Spread on the <ChartSvg>. */
  svg: ReturnType<ReturnType<typeof usePointer<K>>["bind"]>;
  /** The crosshair, hit column and dots: draw last, inside the svg. */
  marks: ReactNode;
}

interface PointerProps<K> extends Omit<BindOptions<K>, "hoverable" | "stops"> {
  children: (view: PointerViewProps<K>) => ReactNode;
  /** Draw the crosshair, its column and dots between these two y's. */
  crosshair?: { bottom: number; top: number };
  /** The side the tip tries first; it flips only if it would clip. */
  side?: "left" | "right";
  stops: readonly Stop<K>[];
}

/** The column and crosshair at the active stop, and a ringed dot on each series. */
const Marks = <K,>(props: { active: Stop<K>; bottom: number; top: number }) => {
  const { active } = props;
  return (
    <g pointerEvents="none">
      {active.bare === true ? null : (
        <rect
          className="fill-l6"
          height={props.bottom - props.top}
          width={16}
          x={active.x - 8}
          y={props.top}
        />
      )}
      <Cursor x={active.x} y0={props.top} y1={props.bottom} />
      {(active.dots ?? []).map((d) => (
        <g key={`${d.className}-${d.y}`}>
          <circle className="fill-paper" cx={active.x} cy={d.y} r={6} />
          <Dot className={d.className} cx={active.x} cy={d.y} size="md" />
        </g>
      ))}
    </g>
  );
};

/** The avoid range in the shown size. */
const scaled = (avoid: Avoid | undefined, zoom: number): Avoid | undefined => {
  if (avoid === undefined) {
    return undefined;
  }
  return (x0, x1) =>
    avoid(x0 / zoom, x1 / zoom).map(
      ([lo, hi]) => [lo * zoom, hi * zoom] as const
    );
};

interface TipProps {
  bounds: { h: number; w: number };
  id: string;
  onEnter: () => void;
  onLeave: () => void;
  pinned: boolean;
  side: "left" | "right";
  stop: Stop<unknown>;
}

const Tip = (props: TipProps) => {
  const { bounds, pinned, side, stop } = props;
  // Anchors are in the chart's drawing pixels; the svg may be shown larger.
  const zoom = magnification(useContext(ScaleContext));
  const ref = useRef<HTMLDivElement>(null);
  // The tip's size is only known once it is drawn, so it is placed by hand
  // after layout: no state, no second render, and the first placement is
  // never seen moving.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) {
      return;
    }
    const place = placeTip({
      above: stop.above === undefined ? undefined : stop.above * zoom,
      at: { x: stop.x * zoom, y: stop.y * zoom },
      avoid: scaled(stop.avoid, zoom),
      bounds: { h: bounds.h * zoom, w: bounds.w * zoom },
      clear: (stop.clear ?? 0) * zoom,
      side,
      tip: { h: el.offsetHeight, w: el.offsetWidth },
    });
    el.style.left = `${place.left}px`;
    el.style.top = `${place.top}px`;
    el.style.visibility = "visible";
  });
  // Only the moves after the first placement are eased, once the tip has
  // painted (the stylesheet reads `data-settled`).
  useEffect(() => {
    if (ref.current !== null) {
      ref.current.dataset.settled = "true";
    }
  }, []);
  return (
    <div
      aria-hidden="true"
      className={`${tipCard(pinned)} transition-tip`}
      data-hl-pointer={props.id}
      data-settled="false"
      data-hl-tip={pinned ? "pinned" : "hover"}
      onPointerEnter={props.onEnter}
      onPointerLeave={props.onLeave}
      ref={ref}
      style={{ visibility: "hidden" }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <b>{stop.lead}</b>
        {pinned ? <span className="text-muted">Pinned · Esc</span> : null}
      </div>
      {stop.rows.map((row) => (
        <div
          className={`mt-1 flex items-center gap-2 ${row.muted === true ? "text-muted" : ""}`}
          key={`${row.name ?? ""}-${row.value}`}
        >
          {row.swatch === undefined ? null : (
            <span className={`h-0.5 w-2.5 shrink-0 ${row.swatch}`} />
          )}
          {row.name === undefined ? null : (
            <span className="text-muted">{row.name}</span>
          )}
          <span
            className={`${row.muted === true ? "" : "font-semibold"} ${row.name === undefined ? "" : "ml-auto pl-4"}`}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Wires a chart to the shared pointer model and the one tip. Give it the
 * chart's stops and render the svg with `svg` spread on it and `marks` last;
 * the tip and a polite live region (read out only for keys and pins, never
 * for a passing mouse) are drawn beside the svg, inside the Plot.
 */
export const Pointer = <K,>(props: PointerProps<K>) => {
  const { children, crosshair, side, stops, ...options } = props;
  const state = usePointer<K>();
  const svg = state.bind({ ...options, hoverable: true, stops });
  const active = stops.find((s) => s.key === state.key) ?? null;
  const { pinned } = state;
  const handleEnter = () => {
    state.cancelLeave();
  };
  const handleLeave = () => {
    state.leave();
  };
  const marks =
    active === null || crosshair === undefined ? null : (
      <Marks active={active} bottom={crosshair.bottom} top={crosshair.top} />
    );
  const announced =
    active !== null && (state.via === "key" || pinned)
      ? spoken(active, pinned)
      : "";
  return (
    <>
      {children({ active, key: state.key, marks, pinned, svg })}
      {active === null ? null : (
        <Tip
          bounds={{ h: options.height, w: options.width }}
          id={state.id}
          onEnter={handleEnter}
          onLeave={handleLeave}
          pinned={pinned}
          side={side ?? "right"}
          stop={active}
        />
      )}
      <output aria-live="polite" className="sr-only">
        {announced}
      </output>
    </>
  );
};
