import { Fragment, createElement } from "react";
import type { PointerEvent, ReactElement, ReactNode } from "react";
import type { z } from "zod";

import type { SharedCallbacks, sharedShape } from "../schema/options";
import { DataTable } from "./data-table";
import { IdScope } from "./hooks";

/** The shared options as a chart's props carry them. */
export type SharedProps = Partial<z.infer<z.ZodObject<typeof sharedShape>>> &
  SharedCallbacks;

/** What `Plot` takes from a chart's shared options. */
export const plotOptions = (props: SharedProps) => ({
  animate: props.animate,
  onReady: props.onReady,
  replayKey: props.replayKey,
  scaling: { fit: props.fit, scale: props.scale, strokes: props.strokes },
});

/** A chart's ids under its `idPrefix`, when it has one. */
export const scoped = (
  idPrefix: string | undefined,
  children: ReactNode
): ReactElement =>
  idPrefix === undefined
    ? createElement(Fragment, null, children)
    : createElement(IdScope, { prefix: idPrefix }, children);

/** The chart's data table: hidden for sighted readers unless `table` is set. */
export const chartTable = (
  props: SharedProps,
  caption: string,
  columns: string[],
  rows: string[][]
): ReactElement =>
  createElement(DataTable, {
    caption,
    columns,
    rows,
    visible: props.table,
  });

/**
 * A pointer's x in the chart's own pixels. The svg may be shown larger or
 * smaller than it is drawn (`scale`, `fit`), so the box is read back.
 */
export const pointerX = (e: PointerEvent<SVGSVGElement>, width: number) => {
  const box = e.currentTarget.getBoundingClientRect();
  const offset = e.clientX - box.left;

  return box.width > 0 ? offset * (width / box.width) : offset;
};
